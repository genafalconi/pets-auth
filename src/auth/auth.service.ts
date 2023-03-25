import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger
} from '@nestjs/common';
import { LoginDto } from '../dto/login.dto';
import { UserDto } from '../dto/user.dto';
import {
  firebaseAuth,
  firebaseClientAuth,
  firebaseFirestore,
} from '../firebase/firebase.app';
import { UserRecord } from 'firebase-admin/lib/auth/user-record';
import { CollectionReference, DocumentData } from 'firebase-admin/firestore';
import { ParseandFillEntity } from 'src/helpers/parseandFillEntity';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { signInWithEmailAndPassword } from 'firebase/auth';

@Injectable()
export class AuthService {
  private usersCollection: CollectionReference;

  constructor(
    private readonly fillAndParseEntity: ParseandFillEntity,
    @Inject('CART_SERVICE')
    private readonly cartService: ClientProxy,
  ) {
    this.usersCollection = firebaseFirestore.collection('user');
  }

  async login(loginUser: LoginDto): Promise<any> {
    try {
      const userInDb: DocumentData = await this.usersCollection
        .where('email', '==', loginUser.email)
        .get();
      const userFirebase: UserRecord = await firebaseAuth.getUserByEmail(
        loginUser.email,
      );
      if (
        userInDb.empty &&
        userFirebase &&
        userFirebase.providerData[0].providerId === 'google.com'
      ) {
        const userToSave: DocumentData = this.fillAndParseEntity.fillUserToObj(
          userFirebase,
          loginUser,
        );
        const googleUser = this.usersCollection.doc();
        await googleUser.set(userToSave);
        const userSaved = await googleUser.get();
        return userSaved.data();
      }
      if (userInDb.empty && !userFirebase) {
        throw new HttpException('No existe el usuario', HttpStatus.NOT_FOUND);
      }
      const userLogged = userInDb.docs[0].data();
      const userCart = await lastValueFrom(
        this.cartService.send({ cmd: 'user-cart' }, userFirebase.uid),
      );

      Logger.log(userLogged, 'User logged');
      return { user: userLogged, cart: userCart };
    } catch (error) {
      return error;
    }
  }

  async register(createUser: UserDto): Promise<DocumentData> {
    try {
      const userInDb: DocumentData = await this.usersCollection
        .where('email', '==', createUser.email)
        .get();
      const userFirebase = await firebaseAuth.getUserByEmail(createUser.email);

      if (userInDb.empty) {
        const userToSave: DocumentData = this.fillAndParseEntity.fillUserToObj(
          userFirebase,
          createUser,
        );
        const newUser = this.usersCollection.doc();

        await newUser.set(userToSave);
        const userSaved = await newUser.get();
        Logger.log(userSaved, 'User registered');

        return userSaved.data();
      }
      if (
        userInDb &&
        userFirebase &&
        userFirebase.providerData[0].providerId !== 'google.com'
      ) {
        return new Error('Ya existe una cuenta con ese email, logueate');
      } else {
        return new Error('Hay un error al registrarse');
      }
    } catch (error) {
      return new Error(error);
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
}
