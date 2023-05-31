import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { StatusOrder } from 'src/dto/types.dto';

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Cart' })
  cart: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Address' })
  address: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Offer' })
  offer: Types.ObjectId;

  @Prop({ required: true })
  payment_type: string;

  @Prop({ default: false })
  message_sent: boolean;

  @Prop({ default: false })
  status: StatusOrder;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
