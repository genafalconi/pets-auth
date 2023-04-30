import { Body, Controller, Get, Inject, Post, Req } from '@nestjs/common';
import { DocumentData } from 'firebase-admin/firestore';
import { CustomRequest } from 'src/firebase/customRequest';
import { LoginDto } from '../dto/login.dto';
import { UserDto } from '../dto/user.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService)
    private readonly authService: AuthService,
  ) { }

  @Post('/login')
  async loginUser(@Body() login: LoginDto): Promise<DocumentData> {
    return await this.authService.login(login);
  }

  @Post('/register')
  async registerUser(@Body() user: UserDto): Promise<DocumentData> {
    return await this.authService.register(user);
  }

  @Post('/token')
  async getTokenFirebase(@Body() login: LoginDto) {
    return await this.authService.getToken(login);
  }

  @Get('/verify-token')
  async verifyTokenFirebase(@Req() req: CustomRequest) {
    return await this.authService.verifyToken(req.headers.authorization);
  }
}
