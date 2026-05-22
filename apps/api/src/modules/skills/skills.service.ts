import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SkillStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { ListSkillsQueryDto } from './dto/list-skills.query';
import type { UpdateSkillDto } from './dto/update-skill.dto';

const include = {
  creator: { select: { name: true, email: true } },
  categories: { include: { category: { select: { name: true } } } },
  ratings: { select: { stars: true } },
} satisfies Prisma.SkillInclude;

function avgRating(ratings: { stars: number }[]): number {
  if (ratings.length === 0) return 0;
  return ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length;
}

function toCard(s: Prisma.SkillGetPayload<{ include: typeof include }>) {
  return {
    id: s.id,
    slug: s.slug,
    name: s.name,
    shortDescription: s.shortDescription,
    thumbnailUrl: null as string | null,
    creatorName: s.creator.name ?? s.creator.email,
    installCount: s.installCount,
    averageRating: avgRating(s.ratings),
    supportedAgents: s.supportedAgents,
    updatedAt: s.updatedAt.toISOString(),
    tags: s.tags,
    categories: s.categories.map((c) => c.category.name),
    securityScanned: s.securityScanned,
  };
}

@Injectable()
export class SkillsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(query: ListSkillsQueryDto) {
    const page = Math.max(1, Number(query.page ?? 1) || 1);
    const limit = Math.min(48, Math.max(1, Number(query.limit ?? 12) || 12));

    const where: Prisma.SkillWhereInput = {
      deletedAt: null,
      status: SkillStatus.PUBLISHED,
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { shortDescription: { contains: query.q, mode: 'insensitive' } },
              { tags: { has: query.q } },
            ],
          }
        : {}),
      ...(query.category
        ? { categories: { some: { category: { name: query.category } } } }
        : {}),
    };

    if (query.sort === 'rating') {
      const all = await this.prisma.skill.findMany({ where, include });
      const mapped = all.map(toCard);
      mapped.sort((a, b) => b.averageRating - a.averageRating);
      return {
        items: mapped.slice((page - 1) * limit, page * limit),
        page,
        limit,
        total: mapped.length,
      };
    }

    const orderBy: Prisma.SkillOrderByWithRelationInput =
      query.sort === 'new' ? { updatedAt: 'desc' } : { installCount: 'desc' };

    const [total, skills] = await this.prisma.$transaction([
      this.prisma.skill.count({ where }),
      this.prisma.skill.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include,
      }),
    ]);

    return { items: skills.map(toCard), page, limit, total };
  }

  async bySlug(slug: string) {
    const skill = await this.prisma.skill.findFirst({
      where: { slug, deletedAt: null, status: SkillStatus.PUBLISHED },
      include: {
        creator: { select: { name: true, email: true } },
        versions: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } },
        reviews: {
          where: { deletedAt: null },
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        ratings: { select: { stars: true } },
        categories: { include: { category: { select: { name: true } } } },
      },
    });
    if (!skill) throw new NotFoundException('Skill not found');

    const { creator, ratings, categories, versions, ...rest } = skill;
    return {
      ...rest,
      creatorName: creator.name ?? creator.email,
      averageRating: avgRating(ratings),
      categories: categories.map((c) => c.category.name),
      version: versions[0]?.version ?? '1.0.0',
      updatedAt: skill.updatedAt.toISOString(),
    };
  }

  async incrementView(skillId: string): Promise<void> {
    await this.prisma.skill.updateMany({
      where: { id: skillId, deletedAt: null, status: SkillStatus.PUBLISHED },
      data: { viewCount: { increment: 1 } },
    });
  }

  async update(slug: string, dto: UpdateSkillDto) {
    const skill = await this.prisma.skill.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true, creatorId: true },
    });
    if (!skill) throw new NotFoundException('Skill not found');
    if (skill.creatorId !== dto.userId) throw new ForbiddenException('You do not own this skill');

    const categoryIds = dto.categoryIds;
    if (categoryIds !== undefined && categoryIds.length > 0) {
      const count = await this.prisma.category.count({ where: { id: { in: categoryIds } } });
      if (count !== categoryIds.length) throw new NotFoundException('One or more categories are invalid');
    }

    const data = {
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(dto.shortDescription !== undefined && { shortDescription: dto.shortDescription.trim() }),
      ...(dto.description !== undefined && { description: dto.description.trim() }),
      ...(dto.tags !== undefined && { tags: dto.tags.map((t) => t.trim()).filter(Boolean) }),
      ...(dto.supportedAgents !== undefined && { supportedAgents: dto.supportedAgents }),
      ...(dto.useCases !== undefined && { useCases: dto.useCases.map((s) => s.trim()).filter(Boolean) }),
      ...(dto.limitations !== undefined && { limitations: dto.limitations.map((s) => s.trim()).filter(Boolean) }),
    };

    if (categoryIds !== undefined) {
      await this.prisma.skillCategory.deleteMany({ where: { skillId: skill.id } });
      if (categoryIds.length > 0) {
        await this.prisma.skillCategory.createMany({
          data: categoryIds.map((categoryId) => ({ skillId: skill.id, categoryId })),
        });
      }
    }

    await this.prisma.skill.update({ where: { id: skill.id }, data });
    return { slug };
  }
}
