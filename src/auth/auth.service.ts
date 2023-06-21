import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { LoginDto } from '../dto/login.dto';
import { UserDto } from '../dto/user.dto';
import { firebaseAuth, firebaseClientAuth } from '../firebase/firebase.app';
import { UserRecord } from 'firebase-admin/lib/auth/user-record';
import { ParseandFillEntity } from 'src/helpers/parseandFillEntity';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/schemas/user.schema';
import { Model, Types } from 'mongoose';
import { Cart } from 'src/schemas/cart.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly fillAndParseEntity: ParseandFillEntity,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(Cart.name)
    private readonly cartModel: Model<Cart>,
  ) { }

  async login(loginUser: LoginDto): Promise<any> {
    try {
      const userInDb: User = await this.userModel
        .findOne({ email: loginUser.email })
        .exec();
      const userFirebase: UserRecord = await firebaseAuth.getUserByEmail(
        loginUser.email,
      );

      let cartUser: Cart;
      if (userInDb) {
        cartUser = await this.getUserCart(userInDb._id);
      }

      if (
        !userInDb &&
        userFirebase &&
        userFirebase.providerData[0].providerId === 'google.com'
      ) {
        const userToSave: User = this.fillAndParseEntity.fillUserToObj(
          userFirebase,
          loginUser,
          this.userModel,
        );
        const googleUser = await this.userModel.create(userToSave);
        Logger.log('User logged', googleUser);
        return { user: googleUser, cart: cartUser ? cartUser : {} };
      }
      if (!userInDb && !userFirebase) {
        throw new HttpException('No existe el usuario', HttpStatus.NOT_FOUND);
      }

      Logger.log('User logged', userInDb);
      return { user: userInDb, cart: cartUser ? cartUser : {} };
    } catch (error) {
      return error;
    }
  }

  async register(createUser: UserDto): Promise<User> {
    try {
      const userInDb = await this.userModel.findOne({
        email: createUser.email,
      });
      const userFirebase = await firebaseAuth.getUserByEmail(createUser.email);

      if (!userInDb) {
        const userToSave = this.fillAndParseEntity.fillUserToObj(
          userFirebase,
          createUser,
          this.userModel,
        );
        const userSaved = await this.userModel.create(userToSave);
        Logger.log(JSON.stringify(userSaved), 'User registered');

        return userSaved;
      }

      if (
        userInDb &&
        userFirebase &&
        userFirebase.providerData[0].providerId !== 'google.com'
      ) {
        throw new Error('Ya existe una cuenta con ese email, logueate');
      } else {
        throw new Error('Hay un error al registrarse');
      }
    } catch (error) {
      throw new Error(`Failed to register user: ${error.message}`);
    }
  }

  async getToken(loginDto: LoginDto) {
    const { email, password } = loginDto;
    try {
      const userCredential = await signInWithEmailAndPassword(
        firebaseClientAuth,
        email,
        password,
      );
      // Get the ID token for the signed-in user
      const idToken = await userCredential.user.getIdToken();
      const refreshToken = userCredential.user.refreshToken;

      return { access_token: idToken, refresh_token: refreshToken };
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  async getUserCart(idUser: string): Promise<Cart | null> {
    try {
      const userCart = await this.cartModel
        .findOne({ user: new Types.ObjectId(idUser), active: true })
        .exec();
      if (!userCart) {
        return null;
      }
      return userCart;
    } catch (error) {
      throw new Error(`Failed to get user cart: ${error.message}`);
    }
  }

  async verifyToken(token: string) {
    try {
      token = token.split(' ')[1];
      const tokenValidation = await firebaseAuth.verifyIdToken(token);
      if (tokenValidation) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  async verifyAdminToken(token: string, user: string) {
    try {
      token = token.split(' ')[1];
      const [userIsAdmin, tokenValidation] = await Promise.all([
        await this.userModel.findById(user),
        await firebaseAuth.verifyIdToken(token)
      ])
      if (userIsAdmin) {
        if (userIsAdmin.admin && tokenValidation) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    } catch (error) {
      console.error(error);
      return error;
    }
  }
}
