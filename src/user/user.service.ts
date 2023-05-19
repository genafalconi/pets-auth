import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Address } from '../schemas/address.schema';
import { AddressDto } from '../dto/address.dto';
import { ParseandFillEntity } from 'src/helpers/parseandFillEntity';
import { User } from 'src/schemas/user.schema';

@Injectable()
export class UserService {
  constructor(
    private readonly parseAddress: ParseandFillEntity,
    @InjectModel(Address.name)
    private readonly addressModel: Model<Address>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

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

  async removeUserAddress(idAddress: string): Promise<void> {
    const addressInDb: Address = await this.addressModel.findOneAndDelete({
      _id: idAddress,
    });
    if (addressInDb) {
      Logger.log(addressInDb, 'Address deleted');
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
      .find({ _id: new Types.ObjectId(idUser) })
      .lean();
  }
}
