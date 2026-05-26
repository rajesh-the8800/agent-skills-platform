import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SkillStatus, UserRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { AdminSkillActionDto } from './dto/admin-skill-action.dto';
import { AdminSetRoleDto } from './dto/admin-set-role.dto';

@Injectable()
export class AdminService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getQueue(adminUserId: string, status: string, page: number, limit: number) {
    await this.assertAdmin(adminUserId);

    const statusFilter = status === 'PUBLISHED'
      ? SkillStatus.PUBLISHED
      : status === 'REJECTED'
      ? SkillStatus.REJECTED
      : status === 'PENDING'
      ? SkillStatus.PENDING
      : SkillStatus.AWAITING_REVIEW;

    const [total, skills] = await this.prisma.$transaction([
      this.prisma.skill.count({ where: { deletedAt: null, status: statusFilter } }),
      this.prisma.skill.findMany({
        where: { deletedAt: null, status: statusFilter },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          slug: true,
          name: true,
          shortDescription: true,
          status: true,
          securityScanned: true,
          createdAt: true,
          tags: true,
          supportedAgents: true,
          creator: { select: { id: true, name: true, email: true } },
          categories: { include: { category: { select: { name: true } } } },
        },
      }),
    ]);

    const items = skills.map((s) => ({
      ...s,
      creatorName: s.creator.name ?? s.creator.email,
      categories: s.categories.map((c) => c.category.name),
    }));

    return { items, page, limit, total };
  }

  async getSkillDetail(adminUserId: string, skillId: string) {
    await this.assertAdmin(adminUserId);

    const skill = await this.prisma.skill.findFirst({
      where: { id: skillId, deletedAt: null },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        versions: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 1 },
        categories: { include: { category: { select: { name: true } } } },
        adminReviews: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { reviewer: { select: { name: true, email: true } } },
        },
      },
    });
    if (!skill) throw new NotFoundException('Skill not found');

    const { creator, versions, categories, adminReviews, ...rest } = skill;
    return {
      ...rest,
      creatorName: creator.name ?? creator.email,
      creatorEmail: creator.email,
      skillMd: versions[0]?.skillMd ?? null,
      version: versions[0]?.version ?? null,
      categories: categories.map((c) => c.category.name),
      history: adminReviews.map((r) => ({
        action: r.action,
        note: r.note,
        reviewerName: r.reviewer.name ?? r.reviewer.email,
        createdAt: r.createdAt,
      })),
    };
  }

  async approveSkill(skillId: string, dto: AdminSkillActionDto) {
    await this.assertAdmin(dto.adminUserId);

    const skill = await this.prisma.skill.findFirst({
      where: { id: skillId, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!skill) throw new NotFoundException('Skill not found');

    await this.prisma.$transaction([
      this.prisma.skill.update({
        where: { id: skillId },
        data: { status: SkillStatus.PUBLISHED },
      }),
      this.prisma.skillAdminReview.create({
        data: { skillId, reviewerId: dto.adminUserId, action: 'APPROVED', note: dto.note ?? null },
      }),
    ]);

    return { skillId, status: 'PUBLISHED' };
  }

  async rejectSkill(skillId: string, dto: AdminSkillActionDto) {
    await this.assertAdmin(dto.adminUserId);

    const skill = await this.prisma.skill.findFirst({
      where: { id: skillId, deletedAt: null },
      select: { id: true },
    });
    if (!skill) throw new NotFoundException('Skill not found');

    await this.prisma.$transaction([
      this.prisma.skill.update({
        where: { id: skillId },
        data: { status: SkillStatus.REJECTED, rejectionReason: dto.note ?? 'Rejected by admin' },
      }),
      this.prisma.skillAdminReview.create({
        data: { skillId, reviewerId: dto.adminUserId, action: 'REJECTED', note: dto.note ?? null },
      }),
    ]);

    return { skillId, status: 'REJECTED' };
  }

  async listUsers(adminUserId: string, page: number, limit: number) {
    await this.assertAdmin(adminUserId);

    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          createdAt: true,
          _count: { select: { skills: true } },
        },
      }),
    ]);

    return { items: users, page, limit, total };
  }

  async setUserRole(targetUserId: string, dto: AdminSetRoleDto) {
    await this.assertAdmin(dto.adminUserId);

    const target = await this.prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
    if (!target) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: dto.role as UserRole },
      select: { id: true, role: true },
    });

    return updated;
  }

  async getStats(adminUserId: string) {
    await this.assertAdmin(adminUserId);

    const [pending, awaitingReview, published, rejected, totalUsers, totalSkills] =
      await this.prisma.$transaction([
        this.prisma.skill.count({ where: { status: SkillStatus.PENDING, deletedAt: null } }),
        this.prisma.skill.count({ where: { status: SkillStatus.AWAITING_REVIEW, deletedAt: null } }),
        this.prisma.skill.count({ where: { status: SkillStatus.PUBLISHED, deletedAt: null } }),
        this.prisma.skill.count({ where: { status: SkillStatus.REJECTED, deletedAt: null } }),
        this.prisma.user.count(),
        this.prisma.skill.count({ where: { deletedAt: null } }),
      ]);

    return { pending, awaitingReview, published, rejected, totalUsers, totalSkills };
  }

  private async assertAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user || user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }
}
