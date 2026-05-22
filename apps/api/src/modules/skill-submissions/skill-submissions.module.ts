import { Module } from '@nestjs/common';

import { InternalAuthGuard } from '../../common/guards/internal-auth.guard';
import { ScannerService } from './scanner.service';
import { SkillSubmissionsController } from './skill-submissions.controller';
import { SkillSubmissionsService } from './skill-submissions.service';

@Module({
  controllers: [SkillSubmissionsController],
  providers: [SkillSubmissionsService, ScannerService, InternalAuthGuard],
})
export class SkillSubmissionsModule {}
