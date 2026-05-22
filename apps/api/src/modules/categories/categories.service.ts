import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    });
  }
}
