import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { InternalAuthGuard } from '../../common/guards/internal-auth.guard';
import { AuthService } from './auth.service';
import { SyncUserDto } from './dto/sync-user.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @ApiOkResponse({ schema: { example: { id: 'clxyz...' } } })
  @UseGuards(InternalAuthGuard)
  @Post('sync')
  async sync(@Body() body: SyncUserDto) {
    return this.auth.syncGoogleUser(body);
  }
}
