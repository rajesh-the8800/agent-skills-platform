import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const AGENT_OPTIONS = ['Claude', 'Codex', 'ChatGPT', 'Gemini', 'Cursor', 'Other'] as const;

export class SkillSubmissionCompleteDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(220)
  shortDescription!: string;

  @ApiProperty()
  @IsString()
  @MinLength(20)
  @MaxLength(20_000)
  description!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  tags!: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @IsIn([...AGENT_OPTIONS], { each: true })
  supportedAgents!: (typeof AGENT_OPTIONS)[number][];

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  categoryIds?: string[];

  @ApiProperty()
  @IsString()
  @Matches(/^\d+\.\d+\.\d+$/)
  version!: string;

  @ApiProperty({ description: 'S3 object key returned from presign' })
  @IsString()
  @IsNotEmpty()
  s3Key!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(52_428_800)
  fileSize!: number;
}
