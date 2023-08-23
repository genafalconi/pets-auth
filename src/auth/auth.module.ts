import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { ParseAndFillEntity } from 'src/helpers/parseandFillEntity';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schemas/user.schema';
import { Cart, CartSchema } from 'src/schemas/cart.schema';
import { Address, AddressSchema } from 'src/schemas/address.schema';
import { Product, ProductSchema } from 'src/schemas/product.schema';
import { Subproduct, SubproductSchema } from 'src/schemas/subprod.schema';
import { Offer, OfferSchema } from 'src/schemas/offers.schema';
import { Order, OrderSchema } from 'src/schemas/order.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Cart.name, schema: CartSchema },
      { name: Address.name, schema: AddressSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Subproduct.name, schema: SubproductSchema },
      { name: Offer.name, schema: OfferSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, ParseAndFillEntity],
})
export class AuthModule {}
