import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AddressDto, DeleteAddressDto } from 'src/dto/address.dto';
import { FirebaseAuthGuard } from 'src/firebase/firebase.auth.guard';
import { UserService } from './user.service';
import { Address } from 'src/schemas/address.schema';
import { User } from 'src/schemas/user.schema';

// @UseGuards(FirebaseAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post('/address/:idUser')
  async createUserAddress(
    @Param('idUser') idUser: string,
    @Body() addressData: AddressDto,
  ): Promise<Address> {
    return await this.userService.createUserAddress(idUser, addressData);
  }

  @Get('/address/:idUser')
  async getUserAddress(@Param('idUser') idUser: string): Promise<Address[]> {
    return await this.userService.getUserAddress(idUser);
  }

  @Put('/address/:idUser')
  async editUserAddress(@Param('idUser') idUser: string, @Body() addressData: AddressDto): Promise<Address[]> {
    return await this.userService.editUserAddress(addressData, idUser);
  }

  @Delete('/address')
  async removeUserAddress(@Body() deleteAddress: DeleteAddressDto): Promise<Address> {
    return await this.userService.removeUserAddress(deleteAddress._id);
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
