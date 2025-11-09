import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

