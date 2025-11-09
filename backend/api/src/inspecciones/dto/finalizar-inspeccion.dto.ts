import { IsOptional, IsString } from 'class-validator';

export class FinalizarInspeccionDto {
  @IsOptional()
  @IsString()
  observacionGeneral?: string; // note
}

