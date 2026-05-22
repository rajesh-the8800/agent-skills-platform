import { Body, Controller, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { InternalAuthGuard } from '../../common/guards/internal-auth.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@Controller('skills/:skillId/reviews')
export class ReviewsController {
  constructor(@Inject(ReviewsService) private readonly reviews: ReviewsService) {}

  @ApiOkResponse({ schema: { example: { id: 'clx...', body: 'Great skill!', stars: 5 } } })
  @UseGuards(InternalAuthGuard)
  @Post()
  create(@Param('skillId') skillId: string, @Body() dto: CreateReviewDto) {
    return this.reviews.create(skillId, dto);
  }
}
