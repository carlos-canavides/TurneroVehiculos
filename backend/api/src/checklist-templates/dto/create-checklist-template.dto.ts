import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChecklistTemplateDto {
  @ApiProperty({
    description: 'Nombre de la plantilla de checklist',
    example: 'Básica 8 Puntos',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  name: string;
}

