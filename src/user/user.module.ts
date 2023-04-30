import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ParseandFillEntity } from 'src/helpers/parseandFillEntity';
import { Address, AddressSchema } from 'src/schemas/address.schema';
import { User, UserSchema } from 'src/schemas/user.schema';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Address.name, schema: AddressSchema },
    ])
  ],
  controllers: [UserController],
  providers: [UserService, ParseandFillEntity],
})
export class UserModule { }
