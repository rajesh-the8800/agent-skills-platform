import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';

import { PrismaService } from '../../modules/prisma/prisma.service';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.get<UserRole[]>('roles', ctx.getHandler()) ?? [];
    if (required.length === 0) return true;

    const req = ctx.switchToHttp().getRequest<Request>();
    const body = req.body as Record<string, unknown>;
    const query = req.query as Record<string, string>;
    const userId = (body?.adminUserId ?? query?.adminUserId) as string | undefined;

    if (!userId) throw new ForbiddenException('adminUserId required');

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user || !required.includes(user.role as UserRole)) throw new ForbiddenException('Insufficient permissions');
    return true;
  }
}
