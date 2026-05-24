import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const MAX_CONTENT_LENGTH = 50_000;

export class SummarizeDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(MAX_CONTENT_LENGTH)
  content!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2000)
  maxLength?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  tone?: string;
}

export class RewriteDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(MAX_CONTENT_LENGTH)
  content!: string;

  @IsOptional()
  @IsEnum(['formal', 'casual', 'concise', 'friendly', 'professional'])
  style?: 'formal' | 'casual' | 'concise' | 'friendly' | 'professional';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  instructions?: string;
}

export class ExtractKeywordsDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(MAX_CONTENT_LENGTH)
  content!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  count?: number;
}

export class GenerateDescriptionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_CONTENT_LENGTH)
  content?: string;

  @IsOptional()
  @IsEnum(['product', 'article', 'service', 'general'])
  type?: 'product' | 'article' | 'service' | 'general';

  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(2000)
  maxLength?: number;
}
