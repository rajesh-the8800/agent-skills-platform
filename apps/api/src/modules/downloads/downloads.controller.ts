import { Body, Controller, Inject, Ip, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { InternalAuthGuard } from '../../common/guards/internal-auth.guard';
import { DownloadRequestDto } from './dto/download-request.dto';
import { DownloadsService } from './downloads.service';

@ApiTags('downloads')
@Controller('skills')
export class DownloadsController {
  constructor(@Inject(DownloadsService) private readonly downloads: DownloadsService) {}

  @ApiOkResponse({ description: 'Streams the skill ZIP file' })
  @UseGuards(InternalAuthGuard)
  @Post(':skillId/download')
  async download(
    @Param('skillId') skillId: string,
    @Body() body: DownloadRequestDto,
    @Ip() ip: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp =
      typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : Array.isArray(forwarded)
          ? forwarded[0]
          : ip;

    const { zipBuffer, version, slug } = await this.downloads.download(
      skillId,
      body.userId,
      clientIp || null,
    );

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${slug}-${version}.zip"`,
      'Content-Length': String(zipBuffer.length),
    });
    res.send(zipBuffer);
  }
}
