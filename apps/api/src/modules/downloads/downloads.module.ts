import { Module } from '@nestjs/common';

import { InternalAuthGuard } from '../../common/guards/internal-auth.guard';
import { DownloadsController } from './downloads.controller';
import { DownloadsService } from './downloads.service';

@Module({
  controllers: [DownloadsController],
  providers: [DownloadsService, InternalAuthGuard],
})
export class DownloadsModule {}
