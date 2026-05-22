import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { InternalAuthGuard } from '../../common/guards/internal-auth.guard';
import { SkillUploadDto } from './dto/skill-upload.dto';
import { SkillSubmissionsService } from './skill-submissions.service';

@ApiTags('skill-submissions')
@Controller('skill-submissions')
export class SkillSubmissionsController {
  constructor(@Inject(SkillSubmissionsService) private readonly submissions: SkillSubmissionsService) {}

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseGuards(InternalAuthGuard)
  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({
    schema: { example: { skillId: 'clx...', slug: 'my-skill', version: '1.0.0' } },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 52_428_800 },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: SkillUploadDto,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('No file uploaded');
    }
    return this.submissions.upload(body, file.buffer);
  }
}
