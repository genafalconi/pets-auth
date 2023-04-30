import { Model, Types } from 'mongoose';
import { AddressDto } from 'src/dto/address.dto';
import { Address } from 'src/schemas/address.schema';
import { User } from 'src/schemas/user.schema';

export class ParseandFillEntity {
  fillUserToObj(dataFirebase: any, dataForm: any, userModel: Model<User>): User {
    const userToSave = new userModel({
      email: dataFirebase.email,
      full_name: dataForm.fullName,
      active: true,
      admin: false,
      phone: dataForm.phone,
      provider_login: dataFirebase.providerData[0].providerId,
      firebase_id: dataFirebase.uid
    });

    return userToSave;
  }

  fillAddressToObj(userId: string, dataForm: AddressDto, addressModel: Model<Address>): Address {
    const addressToSave = new addressModel({
      user: new Types.ObjectId(userId),
      street: dataForm.street || '',
      number: dataForm.number || 0,
      floor: dataForm.floor || '',
      flat: dataForm.flat || '',
      active: true,
      city: dataForm.city || '',
      province: dataForm.province || '',
      extra: dataForm.extra || ''
    });

    return addressToSave
  }
}
