import { UserRecord } from 'firebase-admin/auth';
import { Model, Types } from 'mongoose';
import { AddressDto } from 'src/dto/address.dto';
import { UserLoginDto } from 'src/dto/login.dto';
import { UserRegisterDto } from 'src/dto/user.dto';
import { Address } from 'src/schemas/address.schema';
import { User } from 'src/schemas/user.schema';

export class ParseAndFillEntity {
  fillUserToRegister(
    dataFirebase: UserRecord,
    dataForm: UserRegisterDto,
    userModel: Model<User>,
  ): User {
    const userToSave = new userModel({
      email: dataFirebase.email,
      full_name: dataForm.user.full_name,
      active: true,
      admin: false,
      phone: dataForm.user.phone,
      provider_login: dataFirebase.providerData[0].providerId,
      firebase_id: dataFirebase.uid,
    });

    return userToSave;
  }

  fillAddressToObj(
    userId: string,
    dataForm: AddressDto,
    addressModel: Model<Address>,
  ): Address {
    const addressToSave = new addressModel({
      user: new Types.ObjectId(userId),
      street: dataForm.street || '',
      number: dataForm.number || 0,
      floor: dataForm.floor || '',
      flat: dataForm.flat || '',
      active: true,
      city: dataForm.city || '',
      province: dataForm.province || '',
      extra: dataForm.extra || '',
    });

    return addressToSave;
  }

  fillUserToLogin(
    dataFirebase: UserRecord,
    dataForm: UserLoginDto,
    userModel: Model<User>,
  ): User {
    const userToSave = new userModel({
      email: dataFirebase.email,
      full_name: dataFirebase.displayName,
      active: true,
      admin: false,
      phone: dataFirebase.phoneNumber,
      provider_login: dataFirebase.providerData[0].providerId,
      firebase_id: dataFirebase.uid,
    });

    return userToSave;
  }
}
