import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ParseandFillEntity } from 'src/helpers/parseandFillEntity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [ConfigModule],
  controllers: [UserController],
  providers: [UserService, ParseandFillEntity],
})
export class UserModule {}
