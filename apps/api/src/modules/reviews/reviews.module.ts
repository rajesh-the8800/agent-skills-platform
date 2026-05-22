import { Module } from '@nestjs/common';

import { InternalAuthGuard } from '../../common/guards/internal-auth.guard';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService, InternalAuthGuard],
})
export class ReviewsModule {}
