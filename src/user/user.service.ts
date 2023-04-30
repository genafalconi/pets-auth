import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Address } from '../schemas/address.schema';
import { AddressDto } from '../dto/address.dto';
import { ParseandFillEntity } from 'src/helpers/parseandFillEntity';

@Injectable()
export class UserService {
  constructor(
    private readonly parseAddress: ParseandFillEntity,
    @InjectModel(Address.name)
    private readonly addressModel: Model<Address>
  ) { }

  async createUserAddress(idUser: string, address: AddressDto): Promise<Address> {
    const addressInDb: Address = await this.addressModel.findOne({ user: idUser });

    if (!addressInDb) {
      const newAddress = this.parseAddress.fillAddressToObj(idUser, address, this.addressModel);

      const addressSaved = await newAddress.save();
      Logger.log(addressSaved, 'User address creado');
      return addressSaved;
    } else {
      const userAddress: Address = await this.addressModel.findOne({ user: idUser });
      Logger.log(userAddress, 'User Address existente');
      return userAddress;
    }
  }

  async getUserAddress(idUser: string): Promise<Address[]> {
    const userAddresses: Address[] = await this.addressModel.find({ user: new Types.ObjectId(idUser) });
    Logger.log(userAddresses, 'User Addresses');
    return userAddresses;
  }

  async removeUserAddress(idAddress: string): Promise<void> {
    const addressInDb: Address = await this.addressModel.findById(idAddress);

    if (addressInDb) {
      Logger.log(addressInDb, 'Address deleted');
      await this.addressModel.deleteOne(addressInDb._id);
    }
  }

  async getUserAddressById(addressId: string): Promise<Address> {
    const addressInDb: Address = await this.addressModel.findById(addressId);
    return addressInDb;
  }
}
