import { Module } from '@nestjs/common';
import { ParseandFillEntity } from 'src/helpers/parseandFillEntity';
import { UserService } from 'src/user/user.service';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';

@Module({
  controllers: [IntegrationController],
  providers: [IntegrationService, UserService, ParseandFillEntity],
})
export class IntegrationModule {}
