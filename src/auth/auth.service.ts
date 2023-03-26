import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { LoginDto } from '../dto/login.dto';
import { UserDto } from '../dto/user.dto';
import {
  firebaseApp,
  firebaseAuth,
  firebaseClientAuth,
  firebaseFirestore,
} from '../firebase/firebase.app';
import { UserRecord } from 'firebase-admin/lib/auth/user-record';
import { CollectionReference, DocumentData } from 'firebase-admin/firestore';
import { ParseandFillEntity } from 'src/helpers/parseandFillEntity';
import { ClientProxy } from '@nestjs/microservices';
import * as admin from 'firebase-admin';
import { signInWithEmailAndPassword } from 'firebase/auth';
import axios from 'axios';

@Injectable()
export class AuthService {
  private usersCollection: CollectionReference;
  private cartCollection: CollectionReference;
  private prodCollection: CollectionReference;

  constructor(private readonly fillAndParseEntity: ParseandFillEntity) {
    this.usersCollection = firebaseFirestore.collection('user');
    this.cartCollection = firebaseFirestore.collection('cart');
    this.prodCollection = firebaseFirestore.collection('product');
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

      const userCart = await this.getUserCart(userFirebase.uid);

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
        Logger.log(JSON.stringify(userSaved), 'User registered');

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

  async getUserCart(idUser: string): Promise<DocumentData> {
    const cartDoc: DocumentData = await this.cartCollection
      .where('user', '==', idUser)
      .where('isActive', '!=', false)
      .get();
    if (cartDoc.empty) {
      return {};
    } else {
      const userCart = cartDoc.docs[0].data();
      for (const prod of userCart?.products) {
        const prodDoc: DocumentData = this.prodCollection.doc(prod.idProduct);
        const prodCart = await prodDoc.get().then((doc) => {
          return doc.data();
        });
        if (prodCart) prod.productName = prodCart.name;
      }
      Logger.log(userCart, 'Cart');
      return userCart;
    }
  }
}
