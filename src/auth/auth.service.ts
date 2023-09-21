import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CartDto, LoginDto, UserLoginDto, UserSesionDto } from '../dto/login.dto';
import { UserRegisterDto } from '../dto/user.dto';
import { firebaseAuth, firebaseClientAuth } from '../firebase/firebase.app';
import { ParseAndFillEntity } from 'src/helpers/parseandFillEntity';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/schemas/user.schema';
import { Model, Types } from 'mongoose';
import { Cart } from 'src/schemas/cart.schema';
import { Subproduct } from 'src/schemas/subprod.schema';
import { CartPopulateOptions, GOOGLE_PROVIDER_ID } from 'src/dto/constants';
import { SecurityDto } from 'src/dto/security.dto';

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
  ) {}

  async login(loginUser: UserLoginDto): Promise<UserSesionDto> {
    try {
      const [userInDb, userFirebase] = await Promise.all([
        this.userModel.findOne({ email: loginUser.user.email }),
        firebaseAuth.getUserByEmail(loginUser.user.email),
      ]);

      if (!userInDb && !userFirebase) {
        throw new HttpException('No existe el usuario', HttpStatus.BAD_REQUEST);
      }

      let cartUser: Cart;

      if (userInDb && userFirebase && !loginUser.cart) {
        cartUser = await this.getUserCart(userInDb._id);
      } else {
        if (loginUser.cart) {
          cartUser = await this.saveLocalCart(loginUser.cart, userInDb._id);
        }
      }

      if (!userInDb && userFirebase && userFirebase.providerData[0].providerId === GOOGLE_PROVIDER_ID) {
        const userToSave: User = this.fillAndParseRegister.fillUserToLogin(
          userFirebase,
          loginUser,
          this.userModel,
        );

        const googleUser = await this.createUserAndLog(userToSave);

        return { user: googleUser, cart: cartUser ? cartUser : {} };
      }

      Logger.log('User logged', userInDb);
      return { user: userInDb, cart: cartUser ? cartUser : {} };
    } catch (error) {
      throw new Error(`Failed to log in user: ${error.message}`);
    }
  }

  async register(createUser: UserRegisterDto): Promise<UserSesionDto> {
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
        const userSaved = await this.createUserAndLog(userToSave);

        let cartUser: Cart = {} as Cart;
        if (createUser.cart) {
          cartUser = await this.saveLocalCart(createUser.cart, userSaved._id);
        }
        return { user: userSaved, cart: cartUser };
      }

      if (userInDb && userFirebase && userFirebase.providerData[0].providerId !== 'google.com') {
        throw new Error('Ya existe una cuenta con ese email, logueate');
      } else {
        throw new Error('Hay un error al registrarse');
      }
    } catch (error) {
      throw new Error(`Failed to register user: ${error.message}`);
    }
  }

  async getToken(loginDto: LoginDto): Promise<SecurityDto> {
    const { email, password } = loginDto;
    try {
      const userCredential = await signInWithEmailAndPassword(
        firebaseClientAuth,
        email,
        password,
      );

      const idToken = await userCredential.user.getIdToken();
      const refreshToken = userCredential.user.refreshToken;

      return { access_token: idToken, refresh_token: refreshToken };
    } catch (error) {
      throw new Error(`Failed to get token: ${error.message}`);
    }
  }

  async verifyToken(token: string): Promise<boolean> {
    try {
      token = token.split(' ')[1];
      if (token !== 'null') {
        const tokenValidation = await firebaseAuth.verifyIdToken(token);
        return !!tokenValidation;
      } else {
        return false;
      }
    } catch (error) {
      throw new Error(`Failed to verify token: ${error.message}`);
    }
  }

  async verifyAdminToken(token: string, user: string): Promise<boolean> {
    try {
      token = token.split(' ')[1];
      const [userIsAdmin, tokenValidation] = await Promise.all([
        this.userModel.findById(user).select('_id admin'),
        firebaseAuth.verifyIdToken(token),
      ]);

      if (userIsAdmin && userIsAdmin.admin && tokenValidation) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      throw new Error(`Failed to verify admin token: ${error.message}`);
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
      const userCartUpdated = this.updateCartProducts(
        cartUser,
        cartUser.subproducts,
        cartData.subproducts
      );

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
    newSubproducts: Array<{ subproduct: Subproduct; quantity: number }>
  ) {
    const updatedSubproducts = oldCartSubprod.slice();

    for (const newElem of newSubproducts) {
      const existProd = updatedSubproducts.find((elem: any) => {
        return elem.subproduct._id.toString() === newElem.subproduct._id.toString();
      });

      if (existProd) {
        existProd.quantity += newElem.quantity;
      } else {
        updatedSubproducts.push(newElem);
      }
    }

    const [newTotalP, newCant] = updatedSubproducts.reduce(([totalP, cant], elem) => {
      if (elem.subproduct.highlight) {
        elem.subproduct.sell_price = elem.subproduct.sale_price;
      }
      const subProdTotal = elem.quantity * elem.subproduct.sell_price;
      return [totalP + subProdTotal, cant + elem.quantity];
    }, [0, 0]);

    userCart.total_price = newTotalP;
    userCart.total_products = newCant;

    if (userCart.total_products === 0) {
      userCart.subproducts = [];
    } else {
      userCart.subproducts = updatedSubproducts;
    }

    return userCart;
  }

  async getUserCart(idUser: string): Promise<Cart | null> {
    try {
      const userCart = await this.cartModel
        .findOne({ user: new Types.ObjectId(idUser), active: true })
        .populate(CartPopulateOptions)
        .lean();
      return userCart || null;
    } catch (error) {
      throw new Error(`Failed to get user cart: ${error.message}`);
    }
  }

  private async createUserAndLog(userToSave: User): Promise<User> {
    const userSaved = await this.userModel.create(userToSave);
    Logger.log(userSaved, 'User registered');
    return userSaved;
  }
}
