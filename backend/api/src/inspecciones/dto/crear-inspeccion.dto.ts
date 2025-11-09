import { IsUUID } from 'class-validator';

export class CrearInspeccionDto {
  @IsUUID()
  turnoId: string; // appointmentId
}

