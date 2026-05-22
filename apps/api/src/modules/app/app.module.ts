import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { HealthController } from './health.controller';
import { AuthModule } from '../auth/auth.module';
import { DownloadsModule } from '../downloads/downloads.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CategoriesModule } from '../categories/categories.module';
import { SkillSubmissionsModule } from '../skill-submissions/skill-submissions.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { SkillsModule } from '../skills/skills.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60000, limit: 200 }],
    }),
    PrismaModule,
    AuthModule,
    DownloadsModule,
    CategoriesModule,
    SkillSubmissionsModule,
    SkillsModule,
    ReviewsModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

