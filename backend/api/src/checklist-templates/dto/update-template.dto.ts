import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTemplateDto {
  @ApiPropertyOptional({
    description: 'Nombre de la plantilla',
    example: 'Básica 8 Puntos',
    minLength: 3,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @ApiPropertyOptional({
    description: 'Estado activo/inactivo de la plantilla (debe tener 8 items para activar)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

