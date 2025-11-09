import { IsInt, IsOptional, IsString, IsUUID, Min, Max } from 'class-validator';

export class AgregarPuntajeDto {
  @IsUUID()
  itemId: string; // ChecklistItemDefinition id

  @IsInt()
  @Min(1)
  @Max(10)
  valor: number; // 1-10

  @IsOptional()
  @IsString()
  nota?: string; // observación opcional
}

