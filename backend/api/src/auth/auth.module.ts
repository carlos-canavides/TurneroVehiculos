import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import type { StringValue } from 'ms';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService): JwtModuleOptions => {
        // Por defecto: 24 horas para desarrollo
        // Validamos que JWT_EXPIRES_IN sea razonable (mínimo 1 hora)
        const raw = cfg.get<string | number>('JWT_EXPIRES_IN');
        let expiresIn: number | StringValue = '24h'; // Valor por defecto
        
        if (raw !== undefined && raw !== null) {
          if (typeof raw === 'number') {
            // Si es número, validar mínimo 1 hora (3600 segundos)
            expiresIn = raw >= 3600 ? raw : 3600;
          } else if (typeof raw === 'string') {
            // Si es string, verificar si es un número puro o tiene formato (1h, 3600s, etc.)
            const parsed = parseInt(raw);
            if (!isNaN(parsed) && raw === parsed.toString()) {
              // Es un número puro como string (ej: "3600")
              // Convertir a número o agregar "s" para formato de tiempo
              expiresIn = parsed >= 3600 ? parsed : 3600;
            } else {
              // Tiene formato de tiempo (ej: "1h", "3600s", "24h")
              // Validar que no sea muy corto
              if (!isNaN(parsed) && parsed < 3600) {
                expiresIn = '1h'; // Mínimo 1 hora
              } else {
                expiresIn = raw as StringValue;
              }
            }
          }
        }

        const secret = cfg.get<string>('JWT_SECRET') || 'default-secret-key-change-in-production';
        
        return {
          secret,
          signOptions: { expiresIn },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
