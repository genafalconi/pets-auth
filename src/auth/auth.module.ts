import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { ParseandFillEntity } from 'src/helpers/parseandFillEntity';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';

@Module({
  imports: [ConfigModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    ParseandFillEntity,
    {
      provide: 'CART_SERVICE',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        ClientProxyFactory.create({
          transport: Transport.TCP,
          options: {
            host: configService.get('CART_SERVICE_HOST'),
            port: configService.get('CART_SERVICE_PORT'),
          },
        }),
    },
  ],
})
export class AuthModule {}
