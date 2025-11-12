import { IsEmail, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan Pérez',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Email del usuario (debe ser único)',
    example: 'juan@mail.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Contraseña (solo letras y números)',
    example: 'password123',
  })
  @IsString()
  @MinLength(1)
  @Matches(/^[a-zA-Z0-9]+$/, {
    message: 'La contraseña solo puede contener letras y números',
  })
  password: string;
}

