import { CartDto } from './login.dto';

export class UserDto {
  id: string;
  email: string;
  full_name: string;
  phone: string;
}

export class UserRegisterDto {
  user: UserDto;
  cart?: CartDto;
}
