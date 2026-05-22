import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListSkillsQueryDto {
  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 12, minimum: 1, maximum: 48, default: 12 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(48)
  limit?: number = 12;

  @ApiPropertyOptional({ example: "terraform" })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: 'Code Review' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: ['popular', 'new', 'rating'], default: 'popular' })
  @IsOptional()
  @IsIn(['popular', 'new', 'rating'])
  sort?: 'popular' | 'new' | 'rating';
}

