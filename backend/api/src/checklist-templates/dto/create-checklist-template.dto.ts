import { IsString, MinLength } from 'class-validator';

export class CreateChecklistTemplateDto {
  @IsString()
  @MinLength(3)
  name: string;
}

