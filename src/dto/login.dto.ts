import { Types } from "mongoose";
import { Subproduct } from "src/schemas/subprod.schema";

export class LoginDto {
  email: string;
  password: string;
}

export class CartDto {
  _id: string;
  user: Types.ObjectId | string;
  active: boolean;
  subproducts: Array<{ subproduct: Subproduct; quantity: number }>;
  total_price: number;
  total_products: number;
}

export class UserLoginDto {
  user: LoginDto
  cart?: CartDto
}