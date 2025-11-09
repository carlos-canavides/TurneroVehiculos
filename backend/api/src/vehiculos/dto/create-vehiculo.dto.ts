import { IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVehiculoDto {
  @ApiProperty({
    description: 'Patente del vehículo',
    example: 'ABC123',
    pattern: '^([A-Z]{3}\\d{3}|[A-Z]{2}\\d{3}[A-Z]{2})$',
  })
  @IsString()
  @Matches(/^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/i, {
    message: 'Patente inválida (formatos aceptados: ABC123 o AB123CD)',
  })
  patente: string;

  @ApiPropertyOptional({
    description: 'Alias o nombre del vehículo',
    example: 'Mi auto',
  })
  @IsOptional()
  @IsString()
  alias?: string;
}