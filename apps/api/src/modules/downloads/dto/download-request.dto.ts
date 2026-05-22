import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class DownloadRequestDto {
  @ApiProperty({ description: 'Database user id from Auth.js sync' })
  @IsString()
  @MinLength(10)
  userId!: string;
}
