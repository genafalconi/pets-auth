import { CartDto } from "./login.dto";

export class UserDto {
  id: string;
  email: string;
  fullName: string;
  phone: string;
}

export class UserRegisterDto {
  user: UserDto
  cart?: CartDto
}