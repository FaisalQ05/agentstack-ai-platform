import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CvParserOutputDto } from './cv-output.dto';
import { JobExtractorOutputDto } from './job-output.dto';

export class ParseCvDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(100_000)
  text!: string;
}

export class ExtractJobDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(100_000)
  text!: string;
}

export class MatchJobByIdsDto {
  @IsUUID()
  cvId!: string;

  @IsUUID()
  jobId!: string;
}

export class MatchJobInlineDto {
  @ValidateNested()
  @Type(() => CvParserOutputDto)
  cv!: CvParserOutputDto;

  @ValidateNested()
  @Type(() => JobExtractorOutputDto)
  job!: JobExtractorOutputDto;
}

export class MatchJobDto {
  @IsOptional()
  @IsUUID()
  cvId?: string;

  @IsOptional()
  @IsUUID()
  jobId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CvParserOutputDto)
  cv?: CvParserOutputDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => JobExtractorOutputDto)
  job?: JobExtractorOutputDto;
}
