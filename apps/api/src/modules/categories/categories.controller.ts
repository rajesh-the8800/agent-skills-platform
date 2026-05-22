import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { CategoriesService } from './categories.service';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(@Inject(CategoriesService) private readonly categories: CategoriesService) {}

  @ApiOkResponse({
    schema: {
      example: [{ id: 'clx...', name: 'Code Review', slug: 'code-review' }],
    },
  })
  @Get()
  list() {
    return this.categories.list();
  }
}
