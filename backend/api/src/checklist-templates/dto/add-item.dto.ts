import { IsString, IsInt, Min, Max, MinLength } from 'class-validator';

export class AddItemDto {
  @IsString()
  @MinLength(2)
  label: string;

  @IsInt()
  @Min(1)
  @Max(8)
  ord: number; // posición en la plantilla (1..8)
}

