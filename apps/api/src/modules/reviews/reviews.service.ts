import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(skillId: string, dto: CreateReviewDto) {
    const skill = await this.prisma.skill.findFirst({
      where: { id: skillId, deletedAt: null },
      select: { id: true },
    });
    if (!skill) throw new NotFoundException('Skill not found');

    const existing = await this.prisma.review.findFirst({
      where: { skillId, userId: dto.userId, deletedAt: null },
      select: { id: true },
    });
    if (existing) throw new ConflictException('You have already reviewed this skill');

    let review;
    try {
      [review] = await this.prisma.$transaction([
        this.prisma.review.create({
          data: { skillId, userId: dto.userId, body: dto.body, stars: dto.stars },
          include: { user: { select: { name: true, email: true } } },
        }),
        this.prisma.rating.upsert({
          where: { skillId_userId: { skillId, userId: dto.userId } },
          create: { skillId, userId: dto.userId, stars: dto.stars },
          update: { stars: dto.stars },
        }),
      ]);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('You have already reviewed this skill');
      }
      throw e;
    }

    return {
      id: review.id,
      body: review.body,
      stars: dto.stars,
      author: (review.user as { name: string | null; email: string }).name ??
              (review.user as { name: string | null; email: string }).email,
      createdAt: review.createdAt,
    };
  }
}
