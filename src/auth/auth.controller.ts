import { Body, Controller, Get, Inject, Post, Req } from '@nestjs/common';
import { DocumentData } from 'firebase-admin/firestore';
import { CustomRequest } from 'src/firebase/customRequest';
import { LoginDto } from '../dto/login.dto';
import { UserDto } from '../dto/user.dto';
import { AuthService } from './auth.service';
import { User } from 'src/schemas/user.schema';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService)
    private readonly authService: AuthService,
  ) {}

  @Post('/login')
  async loginUser(@Body() login: LoginDto): Promise<User> {
    return await this.authService.login(login);
  }

  @Post('/register')
  async registerUser(@Body() user: UserDto): Promise<User> {
    return await this.authService.register(user);
  }

  @Post('/token')
  async getTokenFirebase(@Body() login: LoginDto): Promise<any> {
    return await this.authService.getToken(login);
  }

  @Get('/verify-token')
  async verifyTokenFirebase(@Req() req: CustomRequest): Promise<boolean> {
    return await this.authService.verifyToken(req.headers.authorization);
  }
}
