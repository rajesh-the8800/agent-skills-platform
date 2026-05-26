import { Body, Controller, Get, Inject, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { InternalAuthGuard } from '../../common/guards/internal-auth.guard';
import { AdminService } from './admin.service';
import { AdminSkillActionDto } from './dto/admin-skill-action.dto';
import { AdminSetRoleDto } from './dto/admin-set-role.dto';

@ApiTags('admin')
@UseGuards(InternalAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(@Inject(AdminService) private readonly admin: AdminService) {}

  @Get('stats')
  stats(@Query('adminUserId') adminUserId: string) {
    return this.admin.getStats(adminUserId);
  }

  @Get('skills')
  listSkills(
    @Query('adminUserId') adminUserId: string,
    @Query('status') status = 'AWAITING_REVIEW',
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.admin.getQueue(adminUserId, status, Math.max(1, Number(page) || 1), Math.min(50, Math.max(1, Number(limit) || 20)));
  }

  @Get('skills/:skillId')
  skillDetail(@Query('adminUserId') adminUserId: string, @Param('skillId') skillId: string) {
    return this.admin.getSkillDetail(adminUserId, skillId);
  }

  @Post('skills/:skillId/approve')
  approveSkill(@Param('skillId') skillId: string, @Body() dto: AdminSkillActionDto) {
    return this.admin.approveSkill(skillId, dto);
  }

  @Post('skills/:skillId/reject')
  rejectSkill(@Param('skillId') skillId: string, @Body() dto: AdminSkillActionDto) {
    return this.admin.rejectSkill(skillId, dto);
  }

  @Get('users')
  listUsers(
    @Query('adminUserId') adminUserId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.admin.listUsers(adminUserId, Math.max(1, Number(page) || 1), Math.min(50, Math.max(1, Number(limit) || 20)));
  }

  @Patch('users/:userId/role')
  setUserRole(@Param('userId') userId: string, @Body() dto: AdminSetRoleDto) {
    return this.admin.setUserRole(userId, dto);
  }
}
