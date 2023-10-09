import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Address, AddressSchema } from 'src/schemas/address.schema';
import { User, UserSchema } from 'src/schemas/user.schema';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ParseAndFillEntity } from 'src/helpers/parseandFillEntity';
import { SubproductBought, SubproductBoughtSchema } from 'src/schemas/subprodsBought.schema';
import { Cart, CartSchema } from 'src/schemas/cart.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Address.name, schema: AddressSchema },
      { name: SubproductBought.name, schema: SubproductBoughtSchema },
      { name: Cart.name, schema: CartSchema }
    ]),
  ],
  controllers: [UserController],
  providers: [UserService, ParseAndFillEntity],
})
export class UserModule {}
