import { Inject, Injectable } from '@nestjs/common';
import { DocumentData } from 'firebase-admin/firestore';
import { UserService } from 'src/user/user.service';

@Injectable()
export class IntegrationService {
  constructor(
    @Inject(UserService)
    private readonly userService: UserService,
  ) {}

  async getOrderAddress(addressId: string): Promise<DocumentData> {
    return await this.userService.getUserAddressById(addressId);
  }
}
