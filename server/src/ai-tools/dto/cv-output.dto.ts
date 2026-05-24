import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CvExperienceDto {
  @IsString()
  @MinLength(1)
  company!: string;

  @IsString()
  @MinLength(1)
  role!: string;

  @IsString()
  @MinLength(1)
  duration!: string;

  @IsArray()
  @IsString({ each: true })
  responsibilities!: string[];
}

export class CvEducationDto {
  @IsString()
  @MinLength(1)
  institution!: string;

  @IsString()
  @MinLength(1)
  degree!: string;

  @IsOptional()
  @IsString()
  year?: string;
}

export class CvParserOutputDto {
  @IsString()
  @MinLength(1)
  fullName!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsString()
  @MinLength(1)
  summary!: string;

  @IsArray()
  @IsString({ each: true })
  skills!: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CvExperienceDto)
  experience!: CvExperienceDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CvEducationDto)
  education!: CvEducationDto[];
}
