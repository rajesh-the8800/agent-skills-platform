import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { SyncUserDto } from './dto/sync-user.dto';

@Injectable()
export class AuthService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async syncGoogleUser(dto: SyncUserDto) {
    const user = await this.prisma.user.upsert({
      where: { email: dto.email },
      create: {
        email: dto.email,
        name: dto.name ?? null,
        avatar: dto.avatar ?? null,
        provider: dto.provider,
      },
      update: {
        name: dto.name ?? undefined,
        avatar: dto.avatar ?? undefined,
        provider: dto.provider,
      },
      select: { id: true, role: true },
    });
    return { id: user.id, role: user.role };
  }
}
