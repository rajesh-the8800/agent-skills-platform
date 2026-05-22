import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  stars!: number;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  body!: string;
}
