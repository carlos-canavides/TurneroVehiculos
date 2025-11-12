import { IsString, IsInt, Min, Max, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddItemDto {
  @ApiProperty({
    description: 'Etiqueta o nombre del ítem',
    example: 'Frenos',
    minLength: 2,
  })
  @IsString()
  @MinLength(2)
  label: string;

  @ApiProperty({
    description: 'Posición del ítem en la plantilla (1-8)',
    example: 1,
    minimum: 1,
    maximum: 8,
  })
  @IsInt()
  @Min(1)
  @Max(8)
  ord: number; // posición en la plantilla (1..8)
}

