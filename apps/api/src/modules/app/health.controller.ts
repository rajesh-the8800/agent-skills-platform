import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @ApiOkResponse({ schema: { example: { ok: true } } })
  @Get()
  getHealth() {
    return { ok: true };
  }
}

