import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CancelarTurnoDto {
  @ApiPropertyOptional({
    description: 'Motivo de cancelación del turno',
    example: 'Cambio de planes',
  })
  @IsOptional()
  @IsString()
  motivo?: string;
}