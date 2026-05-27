import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SkillStatus } from '@prisma/client';

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

    // sort=rating uses raw SQL because the averageRating column is not yet in the
    // generated Prisma client (requires `prisma generate` after the migration).
    if (query.sort === 'rating') {
      return this.listByRating(query.q, query.category, page, limit);
    }

    const orderBy: Prisma.SkillOrderByWithRelationInput =
      query.sort === 'new' ? { updatedAt: 'desc' } : { installCount: 'desc' };

    const [total, skills] = await this.prisma.$transaction([
      this.prisma.skill.count({ where }),
      this.prisma.skill.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit, include }),
    ]);

    return { items: skills.map(toCard), page, limit, total };
  }

  private async listByRating(
    q: string | undefined,
    category: string | undefined,
    page: number,
    limit: number,
  ) {
    const conditions: Prisma.Sql[] = [
      Prisma.sql`s."deletedAt" IS NULL AND s.status = 'PUBLISHED'`,
    ];
    if (q) {
      conditions.push(
        Prisma.sql`(s.name ILIKE ${`%${q}%`} OR s."shortDescription" ILIKE ${`%${q}%`} OR s.tags @> ARRAY[${q}]::text[])`,
      );
    }
    if (category) {
      conditions.push(
        Prisma.sql`EXISTS (SELECT 1 FROM "SkillCategory" sc JOIN "Category" cat ON cat.id = sc."categoryId" WHERE sc."skillId" = s.id AND cat.name = ${category})`,
      );
    }
    const sqlWhere = Prisma.join(conditions, ' AND ');
    const offset = (page - 1) * limit;

    // Compute average inline from Rating rows — no stored column needed.
    const [countRows, idRows] = await Promise.all([
      this.prisma.$queryRaw<[{ count: bigint }]>(
        Prisma.sql`SELECT COUNT(*) AS count FROM "Skill" s WHERE ${sqlWhere}`,
      ),
      this.prisma.$queryRaw<{ id: string }[]>(
        Prisma.sql`
          SELECT s.id
          FROM "Skill" s
          LEFT JOIN "Rating" r ON r."skillId" = s.id
          WHERE ${sqlWhere}
          GROUP BY s.id
          ORDER BY COALESCE(AVG(r.stars), 0) DESC
          LIMIT ${limit} OFFSET ${offset}
        `,
      ),
    ]);

    const total = Number(countRows[0]?.count ?? 0);
    const orderedIds = idRows.map((r) => r.id);

    if (orderedIds.length === 0) {
      return { items: [], page, limit, total };
    }

    const skills = await this.prisma.skill.findMany({
      where: { id: { in: orderedIds } },
      include,
    });

    const idPos = new Map(orderedIds.map((id, i) => [id, i]));
    skills.sort((a, b) => (idPos.get(a.id) ?? 0) - (idPos.get(b.id) ?? 0));

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
      ratings,
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
      ...(dto.repoUrl !== undefined && { repoUrl: dto.repoUrl || null }),
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
