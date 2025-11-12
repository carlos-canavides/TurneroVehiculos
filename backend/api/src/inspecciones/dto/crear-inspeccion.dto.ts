import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CrearInspeccionDto {
  @ApiProperty({
    description: 'ID del turno (appointment) a inspeccionar',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  turnoId: string; // appointmentId
}

