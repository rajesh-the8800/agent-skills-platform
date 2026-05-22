import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SyncUserDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  avatar?: string | null;

  @ApiProperty({ example: 'google' })
  @IsString()
  @MinLength(2)
  provider!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  providerAccountId?: string | null;
}
