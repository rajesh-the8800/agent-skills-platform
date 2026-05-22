import { Controller, Get, HttpCode, Inject, Param, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { SkillsService } from './skills.service';
import { ListSkillsQueryDto } from './dto/list-skills.query';

@ApiTags('skills')
@Controller('skills')
export class SkillsController {
  constructor(@Inject(SkillsService) private readonly skills: SkillsService) {}

  @ApiOkResponse({
    schema: {
      example: {
        items: [],
        page: 1,
        limit: 12,
        total: 0,
      },
    },
  })
  @Get()
  async list(@Query() query: ListSkillsQueryDto) {
    return this.skills.list(query);
  }

  @ApiParam({ name: 'slug', example: 'terraform-skill' })
  @ApiOkResponse({
    schema: { example: { id: 'ck...', slug: 'terraform-skill', name: 'Terraform Skill' } },
  })
  @Get(':slug')
  async bySlug(@Param('slug') slug: string) {
    return this.skills.bySlug(slug);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(204)
  @Post(':skillId/view')
  async incrementView(@Param('skillId') skillId: string) {
    await this.skills.incrementView(skillId);
  }
}

