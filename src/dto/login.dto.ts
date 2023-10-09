import { Types } from 'mongoose';
import { Cart } from 'src/schemas/cart.schema';
import { Subproduct } from 'src/schemas/subprod.schema';
import { User } from 'src/schemas/user.schema';

export class LoginDto {
  email: string;
  password: string;
}

export class CartDto {
  _id: string;
  user: Types.ObjectId | string;
  active: boolean;
  subproducts: Array<{ subproduct: Subproduct; quantity: number, profit: number }>;
  total_price: number;
  total_products: number;
}

export class UserLoginDto {
  user: LoginDto;
  cart?: CartDto;
}

export class UserSesionDto {
  user: User;
  cart?: Cart | object;
}
