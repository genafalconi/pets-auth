import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  full_name: string;

  @Prop({ required: true })
  active: boolean;

  @Prop({ required: true })
  admin: boolean;

  @Prop({ required: false })
  phone: string;

  @Prop({ required: true })
  provider_login: string;

  @Prop({ required: true })
  firebase_id: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Address' }], default: [] })
  addresses: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Order' }], default: [] })
  orders: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('find', function (next) {
  this.populate({
    path: 'orders',
    model: 'Order',
    options: { sort: { createdAt: 'desc' } },
    populate: [
      {
        path: 'offer',
        model: 'Offer',
        select: '_id date',
      },
      {
        path: 'cart',
        model: 'Cart',
        populate: [
          {
            path: 'subproducts.subproduct',
            model: 'Subproduct',
            select: '_id sell_price size',
            populate: {
              path: 'product',
              model: 'Product',
              select: '_id name',
            },
          },
        ],
        select: '_id total_price total_products subproducts',
      },
    ],
  });
  next();
});
