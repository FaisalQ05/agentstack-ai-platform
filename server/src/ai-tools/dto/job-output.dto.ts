import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class JobExtractorOutputDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @MinLength(1)
  company!: string;

  @IsString()
  @MinLength(1)
  location!: string;

  @IsOptional()
  @IsString()
  salary_range?: string;

  @IsEnum(['full-time', 'part-time', 'contract', 'internship'])
  job_type!: 'full-time' | 'part-time' | 'contract' | 'internship';

  @IsEnum(['junior', 'mid', 'senior', 'lead', 'staff'])
  seniority_level!: 'junior' | 'mid' | 'senior' | 'lead' | 'staff';

  @IsArray()
  @IsString({ each: true })
  required_skills!: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferred_skills?: string[];
}
