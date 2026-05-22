import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const ZIP_TYPES = ['application/zip', 'application/x-zip-compressed'] as const;

export class SkillSubmissionPresignDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ example: 'my-awesome-skill' })
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase letters, numbers, and single hyphens between words',
  })
  slug!: string;

  @ApiProperty({ enum: ZIP_TYPES })
  @IsString()
  @IsIn(ZIP_TYPES)
  contentType!: (typeof ZIP_TYPES)[number];

  @ApiProperty({ example: 1024000 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(52_428_800)
  fileSize!: number;
}
