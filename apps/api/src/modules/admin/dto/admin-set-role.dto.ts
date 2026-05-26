import { IsIn, IsString } from 'class-validator';

export class AdminSetRoleDto {
  @IsString()
  adminUserId!: string;

  @IsString()
  @IsIn(['USER', 'MODERATOR', 'ADMIN'])
  role!: string;
}
