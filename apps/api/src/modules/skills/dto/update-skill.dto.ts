import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const AGENT_OPTIONS = ['Claude', 'Codex', 'ChatGPT', 'Gemini', 'Cursor', 'Other'] as const;

function parseJsonArray(value: unknown): unknown {
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return value; }
  }
  return value;
}

export class UpdateSkillDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(220)
  shortDescription?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(20_000)
  description?: string;

  @ApiProperty({ type: [String], required: false })
  @Transform(({ value }) => parseJsonArray(value))
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  @Matches(/^[a-zA-Z0-9 ._-]+$/, { each: true, message: 'Tags may only contain letters, numbers, spaces, dots, underscores, and hyphens' })
  tags?: string[];

  @ApiProperty({ type: [String], required: false })
  @Transform(({ value }) => parseJsonArray(value))
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @IsIn([...AGENT_OPTIONS], { each: true })
  supportedAgents?: (typeof AGENT_OPTIONS)[number][];

  @ApiProperty({ type: [String], required: false })
  @Transform(({ value }) => parseJsonArray(value))
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  categoryIds?: string[];

  @ApiProperty({ type: [String], required: false })
  @Transform(({ value }) => parseJsonArray(value))
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  useCases?: string[];

  @ApiProperty({ type: [String], required: false })
  @Transform(({ value }) => parseJsonArray(value))
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  limitations?: string[];
}
