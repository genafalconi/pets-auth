import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Address } from '../schemas/address.schema';
import { AddressDto } from '../dto/address.dto';
import { ParseAndFillEntity } from 'src/helpers/parseandFillEntity';
import { User } from 'src/schemas/user.schema';
import { Cart } from 'src/schemas/cart.schema';

@Injectable()
export class UserService {
  constructor(
    private readonly parseAddress: ParseAndFillEntity,
    @InjectModel(Address.name)
    private readonly addressModel: Model<Address>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(Cart.name)
    private readonly cartModel: Model<Cart>
  ) { }

  async createUserAddress(
    idUser: string,
    address: AddressDto,
  ): Promise<Address> {
    const addressInDb: Address = await this.addressModel.findOne({
      user: idUser,
    });

    if (!addressInDb) {
      const newAddress = this.parseAddress.fillAddressToObj(
        idUser,
        address,
        this.addressModel,
      );

      const addressSaved = await newAddress.save();
      await this.userModel.updateOne(
        { _id: idUser },
        { $push: { addresses: addressSaved._id } },
      );

      Logger.log(addressSaved, 'User address creado');
      return addressSaved;
    } else {
      const userAddress: Address = await this.addressModel.findOne({
        user: idUser,
      });
      Logger.log(userAddress, 'User Address existente');
      return userAddress;
    }
  }

  async getUserAddress(idUser: string): Promise<Address[]> {
    const userAddresses: Address[] = await this.addressModel.find({
      user: new Types.ObjectId(idUser),
    });
    Logger.log(userAddresses, 'User Addresses');
    return userAddresses;
  }

  async editUserAddress(addressData: AddressDto, idUser: string): Promise<Address[]> {
    const [edit, userAddresses] = await Promise.all([
      this.addressModel.findByIdAndUpdate(
        new Types.ObjectId(addressData._id),
        addressData,
        { new: true }
      ),
      this.addressModel.find({ user: new Types.ObjectId(idUser) })
    ])

    return userAddresses
  }

  async removeUserAddress(idAddress: string): Promise<Address> {
    const addressInDb: Address = await this.addressModel.findByIdAndDelete(new Types.ObjectId(idAddress));
    if (addressInDb) {
      await this.userModel.findByIdAndUpdate(addressInDb.user, {
        $pull: { addresses: addressInDb._id },
      });

      Logger.log(addressInDb, 'Address deleted');
      return addressInDb;
    }
  }

  async getUserAddressById(addressId: string): Promise<Address> {
    return await this.addressModel.findById(addressId);
  }

  async getUserInfo(idUser: string): Promise<User> {
    return await this.userModel.findById(idUser).populate('addresses');
  }

  async getUserOrders(idUser: string): Promise<User[]> {
    return await this.userModel
      .findOne({ _id: new Types.ObjectId(idUser) })
      .populate({
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
                  select: '_id name image',
                },
              },
            ],
            select: '_id total_price total_products subproducts',
          },
          {
            path: 'products',
            model: 'SubproductBought',
            populate: {
              path: 'subproduct',
              model: 'Subproduct',
              select: '_id size stock',
              populate: {
                path: 'product',
                model: 'Product',
                select: '_id name image',
              },
            },
          }
        ],
      })
      .lean();
  }

  async getReorderCart(cartId: string): Promise<Cart> {
    const reorderCart = await this.cartModel.findById(new Types.ObjectId(cartId))
      .populate({
        path: 'subproducts.subproduct',
        model: 'Subproduct',
        select: '_id sell_price sale_price buy_price size highlight',
        populate: {
          path: 'product',
          model: 'Product',
          select: '_id name image',
        }
      })

    let totalPrice: number = 0
    reorderCart.subproducts.forEach((elem) => {
      const price = elem.subproduct.highlight ? elem.subproduct.sale_price : elem.subproduct.sell_price
      elem.profit = (price - elem.subproduct.buy_price) * elem.quantity
      totalPrice += price * elem.quantity
    })
    reorderCart.total_price = totalPrice
    return reorderCart
  }

}
