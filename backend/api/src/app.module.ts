import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VehiculosModule } from './vehiculos/vehiculos.module';
import { TurnosModule } from './turnos/turnos.module';
import { ChecklistTemplatesModule } from './checklist-templates/checklist-templates.module';
import { InspeccionesModule } from './inspecciones/inspecciones.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    VehiculosModule,
    TurnosModule,
    ChecklistTemplatesModule,
    InspeccionesModule,
  ],
})
export class AppModule {}
