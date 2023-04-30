import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DocumentData } from 'firebase-admin/firestore';
import { AddressDto } from 'src/dto/address.dto';
import { FirebaseAuthGuard } from 'src/firebase/firebase.auth.guard';
import { UserService } from './user.service';

@UseGuards(FirebaseAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/address/:idUser')
  async createUserAddress(
    @Param('idUser') idUser: string,
    @Body() addressData: AddressDto,
  ): Promise<DocumentData> {
    return await this.userService.createUserAddress(idUser, addressData);
  }

  @Get('/address/:idUser')
  async getUserAddress(@Param('idUser') idUser: string): Promise<DocumentData> {
    return await this.userService.getUserAddress(idUser);
  }

  @Delete('/address/:idAddress')
  async removeUserAddress(@Param('idAddress') idAddress: string) {
    return await this.userService.removeUserAddress(idAddress);
  }
}
