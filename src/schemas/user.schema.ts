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

  @Prop({ type: Types.ObjectId, ref: 'Cart' })
  active_cart: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Address' })
  active_address: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  orders: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);
