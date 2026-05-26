import { IsOptional, IsString } from 'class-validator';

export class AdminSkillActionDto {
  @IsString()
  adminUserId!: string;

  @IsString()
  @IsOptional()
  note?: string;
}
