import { IsISO8601, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTurnoDto {
  @ApiProperty({
    description: 'ID del vehículo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  vehicleId: string;

  @ApiProperty({
    description: 'Fecha y hora programada (formato ISO 8601)',
    example: '2025-11-10T15:30:00',
  })
  @IsISO8601()
  scheduledAt: string; // fecha/hora ISO (ej: 2025-11-10T15:30:00)
}