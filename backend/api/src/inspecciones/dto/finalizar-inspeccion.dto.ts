import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FinalizarInspeccionDto {
  @ApiPropertyOptional({
    description: 'Observación general sobre la inspección',
    example: 'Vehículo en buen estado general, se recomienda revisar frenos en próximo servicio',
  })
  @IsOptional()
  @IsString()
  observacionGeneral?: string; // note
}

