import { IsISO8601, IsUUID } from 'class-validator';

export class CreateTurnoDto {
  @IsUUID()
  vehicleId: string;

  @IsISO8601()
  scheduledAt: string; // fecha/hora ISO (ej: 2025-11-10T15:30:00)
}