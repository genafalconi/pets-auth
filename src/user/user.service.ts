import { Injectable, Logger } from '@nestjs/common';
import { CollectionReference, DocumentData } from 'firebase-admin/firestore';
import { AddressDto } from 'src/dto/address.dto';
import { firebaseFirestore } from '../firebase/firebase.app';
import { ParseandFillEntity } from 'src/helpers/parseandFillEntity';
@Injectable()
export class UserService {
  private addressCollection: CollectionReference;

  constructor(private readonly parseAddress: ParseandFillEntity) {
    this.addressCollection = firebaseFirestore.collection('address');
  }

  async createUserAddress(
    idUser: string,
    address: AddressDto,
  ): Promise<DocumentData> {
    const addressInDb: DocumentData = await this.addressCollection
      .where('user', '==', idUser)
      .get();

    if (addressInDb.empty) {
      const newAddress = this.parseAddress.fillAddressToObj(idUser, address);
      const addressDocs = this.addressCollection.doc();
      await addressDocs.set(Object.assign({}, newAddress));

      const addressGet = await addressDocs.get();
      const addressSaved = addressGet.data();
      Logger.log(addressSaved, 'User address creado');
      return addressSaved;
    } else {
      const userAddress: DocumentData[] = [];
      addressInDb.docs.map((elem: any) => {
        const addressWithId = {
          id: elem.id,
          ...elem.data(),
        };
        userAddress.push(addressWithId);
      });
      Logger.log(userAddress, 'User Address existente');
      return userAddress;
    }
  }

  async getUserAddress(idUser: string): Promise<DocumentData> {
    const addressInDb: DocumentData = await this.addressCollection
      .where('user', '==', idUser)
      .get();
    const userAddresses: DocumentData[] = [];

    if (!addressInDb.empty) {
      addressInDb.docs.map((elem: any) => {
        const addressWithId = {
          id: elem.id,
          ...elem.data(),
        };
        userAddresses.push(addressWithId);
      });
    }
    Logger.log(userAddresses, 'User Addresses');
    return userAddresses;
  }

  async removeUserAddress(idAddress: string): Promise<void> {
    const addressInDb: DocumentData = await this.addressCollection
      .doc(idAddress)
      .get();
    const addressDoc = await addressInDb.get();
    if (addressDoc.exists) {
      Logger.log(addressDoc.data(), 'Address deleted');
      await addressInDb.delete();
    }
  }

  async getUserAddressById(addressId: string): Promise<DocumentData> {
    const addressInDb: DocumentData = await this.addressCollection
      .doc(addressId)
      .get();
    return addressInDb.data();
  }
}
