import { DocumentData } from 'firebase-admin/firestore';
import { AddressDto } from 'src/dto/address.dto';
import { AddressEntity } from 'src/entities/address.entity';
import { UserEntity } from 'src/entities/user.entity';

export class ParseandFillEntity {
  fillUserToObj(dataFirebase: any, dataForm: any): DocumentData {
    const userToSave: UserEntity = new UserEntity();

    userToSave.id = dataFirebase.uid || '';
    userToSave.email = dataFirebase.email || '';
    userToSave.fullName = dataForm.fullName || '';
    userToSave.phone = dataForm.phone || '';
    userToSave.providerLogin = dataFirebase.providerData[0].providerId || '';
    userToSave.isActive = true;
    userToSave.isAdmin = false;
    userToSave.created_at = new Date().toISOString();
    userToSave.updated_at = new Date().toISOString();

    const plainObj = Object.assign({}, userToSave);

    return plainObj;
  }

  fillAddressToObj(idUser: string, dataForm: AddressDto): DocumentData {
    const addressToSave: AddressEntity = new AddressEntity();

    addressToSave.user = idUser || '';
    addressToSave.street = dataForm.street || '';
    addressToSave.number = dataForm.number || 0;
    addressToSave.floor = dataForm.floor || '';
    addressToSave.flat = dataForm.flat || '';
    addressToSave.isActive = true;
    addressToSave.city = dataForm.city || '';
    addressToSave.province = dataForm.province || '';
    addressToSave.extra = dataForm.extra || '';

    const plainObj = Object.assign({}, addressToSave);

    return plainObj;
  }
}
