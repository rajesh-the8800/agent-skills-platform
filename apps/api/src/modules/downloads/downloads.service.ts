import { Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import AdmZip from 'adm-zip';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DownloadsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async download(skillId: string, userId: string, ipAddress: string | null) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const skill = await this.prisma.skill.findFirst({
      where: { id: skillId, deletedAt: null },
      include: {
        versions: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!skill || skill.versions.length === 0) {
      throw new NotFoundException('Skill or package version not found');
    }

    const version = skill.versions[0];

    await this.prisma.$transaction([
      this.prisma.download.create({
        data: { skillId: skill.id, userId: user.id, ipAddress: ipAddress || null },
      }),
      this.prisma.skill.update({
        where: { id: skill.id },
        data: { installCount: { increment: 1 } },
      }),
    ]);

    const zip = new AdmZip();
    zip.addFile('SKILL.md', Buffer.from(version.skillMd as string, 'utf-8'));
    const files = version.files as Record<string, string>;
    for (const [filePath, content] of Object.entries(files)) {
      zip.addFile(filePath, Buffer.from(content, 'utf-8'));
    }

    return {
      zipBuffer: zip.toBuffer(),
      version: version.version,
      slug: skill.slug,
    };
  }
}
