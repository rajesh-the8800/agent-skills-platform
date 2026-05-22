import { Module } from '@nestjs/common';

import { InternalAuthGuard } from '../../common/guards/internal-auth.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, InternalAuthGuard],
  exports: [AuthService],
})
export class AuthModule {}
