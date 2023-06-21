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
import { Address } from 'src/schemas/address.schema';
import { User } from 'src/schemas/user.schema';

@UseGuards(FirebaseAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/address/:idUser')
  async createUserAddress(
    @Param('idUser') idUser: string,
    @Body() addressData: AddressDto,
  ): Promise<Address[] | Address> {
    return await this.userService.createUserAddress(idUser, addressData);
  }

  @Get('/address/:idUser')
  async getUserAddress(@Param('idUser') idUser: string): Promise<Address[]> {
    return await this.userService.getUserAddress(idUser);
  }

  @Delete('/address/:idAddress')
  async removeUserAddress(
    @Param('idAddress') idAddress: string,
  ): Promise<void> {
    return await this.userService.removeUserAddress(idAddress);
  }

  @Get('/info/:idUser')
  async getUserInfo(@Param('idUser') idUser: string): Promise<User> {
    return await this.userService.getUserInfo(idUser);
  }

  @Get('/orders/:idUser')
  async getUserOrders(@Param('idUser') idUser: string): Promise<User[]> {
    return await this.userService.getUserOrders(idUser);
  }
}
