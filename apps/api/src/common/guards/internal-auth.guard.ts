import { timingSafeEqual } from 'node:crypto';

import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class InternalAuthGuard implements CanActivate {
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const expected = this.config.get<string>('INTERNAL_API_SECRET');
    if (!expected) {
      throw new UnauthorizedException('Server misconfigured: INTERNAL_API_SECRET');
    }
    const actual = Buffer.from(req.headers.authorization ?? '');
    const expectedBuf = Buffer.from(`Bearer ${expected}`);
    const match =
      actual.length === expectedBuf.length && timingSafeEqual(actual, expectedBuf);
    if (!match) {
      throw new UnauthorizedException('Invalid internal authorization');
    }
    return true;
  }
}
