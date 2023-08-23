import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CartDto, LoginDto, UserLoginDto } from '../dto/login.dto';
import { UserRegisterDto } from '../dto/user.dto';
import { firebaseAuth, firebaseClientAuth } from '../firebase/firebase.app';
import { ParseAndFillEntity } from 'src/helpers/parseandFillEntity';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/schemas/user.schema';
import { Model, Types } from 'mongoose';
import { Cart } from 'src/schemas/cart.schema';
import { Subproduct } from 'src/schemas/subprod.schema';
import { CartPopulateOptions } from 'src/dto/constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly fillAndParseRegister: ParseAndFillEntity,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(Cart.name)
    private readonly cartModel: Model<Cart>,
    @InjectModel(Subproduct.name)
    private readonly subproductModel: Model<Subproduct>,
  ) { }

  async login(loginUser: UserLoginDto): Promise<any> {
    try {
      const [userInDb, userFirebase] = await Promise.all([
        this.userModel.findOne({ email: loginUser.user.email }),
        firebaseAuth.getUserByEmail(loginUser.user.email),
      ]);

      let cartUser: Cart;
      if (userInDb && !loginUser.cart) {
        cartUser = await this.getUserCart(userInDb._id);
      } else {
        cartUser = await this.saveLocalCart(loginUser.cart, userInDb._id);
      }

      if (
        !userInDb &&
        userFirebase &&
        userFirebase.providerData[0].providerId === 'google.com'
      ) {
        const userToSave: User = this.fillAndParseRegister.fillUserToLogin(
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

  async register(createUser: UserRegisterDto): Promise<User> {
    try {
      const [userInDb, userFirebase] = await Promise.all([
        this.userModel.findOne({ email: createUser.user.email }),
        firebaseAuth.getUserByEmail(createUser.user.email),
      ]);

      if (!userInDb) {
        const userToSave = this.fillAndParseRegister.fillUserToRegister(
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

  async verifyToken(token: string): Promise<boolean> {
    try {
      token = token.split(' ')[1];
      if (token !== 'null') {
        const tokenValidation = await firebaseAuth.verifyIdToken(token);
        if (tokenValidation) {
          return true;
        }
      } else {
        return false;
      }
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  async verifyAdminToken(token: string, user: string): Promise<boolean> {
    try {
      token = token.split(' ')[1];
      const [userIsAdmin, tokenValidation] = await Promise.all([
        await this.userModel.findById(user).select('_id admin'),
        await firebaseAuth.verifyIdToken(token),
      ]);

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
      console.error(error.code);
      return false;
    }
  }

  async saveLocalCart(cartData: CartDto, idUser: string): Promise<Cart> {
    const cartUser = await this.cartModel
      .findOne({ user: new Types.ObjectId(idUser), active: true })
      .populate(CartPopulateOptions)
      .exec();

    if (!cartUser) {
      cartData.user = new Types.ObjectId(idUser);
      const newCart = new this.cartModel(cartData);

      const cart = await this.cartModel.create(newCart);
      const cartSaved = await this.cartModel
        .findById(cart._id)
        .populate(CartPopulateOptions);

      Logger.log(cartSaved, 'Local cart saved');
      return cartSaved;
    } else {
      let userCartUpdated: any;
      for (const elem of cartData.subproducts) {
        const subproduct = await this.subproductModel.findById(elem.subproduct);
        userCartUpdated = this.updateCartProducts(
          cartUser,
          cartUser.subproducts,
          subproduct,
          elem.quantity,
        );
      }
      console.log(userCartUpdated);
      const cartUpdated = await this.cartModel
        .findByIdAndUpdate(cartUser._id, userCartUpdated, { new: true })
        .populate(CartPopulateOptions);
      Logger.log(cartUpdated, 'Local cart updated');

      return cartUpdated;
    }
  }

  updateCartProducts(
    userCart: Cart,
    oldCartSubprod: Array<{ subproduct: Subproduct; quantity: number }>,
    newProd: Subproduct,
    newQuantity: number,
  ) {
    let newTotalP = 0,
      newCant = 0;

    const existProd = oldCartSubprod.find((elem: any) => {
      return elem.subproduct._id.toString() === newProd._id.toString();
    });

    if (existProd) {
      existProd.quantity += newQuantity;
      oldCartSubprod.map((elem: any) => {
        const subProdTotal = elem.quantity * elem.subproduct.sell_price;
        newTotalP += subProdTotal;
        newCant += elem.quantity;
      });
    } else {
      const newSubProd: { subproduct: Subproduct; quantity: number } = {
        subproduct: newProd,
        quantity: newQuantity,
      };
      oldCartSubprod.push(newSubProd);
      oldCartSubprod.map((elem: any) => {
        const subProdTotal = elem.quantity * elem.subproduct.sell_price;
        newTotalP += subProdTotal;
        newCant += elem.quantity;
      });
    }
    userCart.total_price = newTotalP;
    userCart.total_products = newCant;

    if (userCart.total_products === 0) {
      userCart.subproducts = [];
    }

    return userCart;
  }

  async getUserCart(idUser: string): Promise<Cart | null> {
    try {
      const userCart = await this.cartModel
        .findOne({ user: new Types.ObjectId(idUser), active: true })
        .populate(CartPopulateOptions)
        .lean();
      if (!userCart) {
        return null;
      }
      return userCart;
    } catch (error) {
      throw new Error(`Failed to get user cart: ${error.message}`);
    }
  }
}
