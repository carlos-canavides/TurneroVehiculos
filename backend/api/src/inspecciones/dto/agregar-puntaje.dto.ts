import { IsInt, IsOptional, IsString, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AgregarPuntajeDto {
  @ApiProperty({
    description: 'ID del ítem de checklist',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  itemId: string; // ChecklistItemDefinition id

  @ApiProperty({
    description: 'Puntaje del ítem (1-10)',
    example: 8,
    minimum: 1,
    maximum: 10,
  })
  @IsInt()
  @Min(1)
  @Max(10)
  valor: number; // 1-10

  @ApiPropertyOptional({
    description: 'Observacion opcional sobre el item',
    example: 'Buen estado general',
  })
  @IsOptional()
  @IsString()
  nota?: string; // observacion opcional
}

