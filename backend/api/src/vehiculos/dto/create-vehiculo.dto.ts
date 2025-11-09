import { IsOptional, IsString, Matches } from 'class-validator';

export class CreateVehiculoDto {
  @IsString()
  @Matches(/^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/i, {
    message: 'Patente inválida (formatos aceptados: ABC123 o AB123CD)',
  })
  patente: string;

  @IsOptional()
  @IsString()
  alias?: string;
}