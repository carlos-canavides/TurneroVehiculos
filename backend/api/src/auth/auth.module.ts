import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        // expiresIn puede ser número (segundos) o string ('3600s', '1h', etc)
        const expiresInEnv = cfg.get<string | number>('JWT_EXPIRES_IN');
        const expiresIn = expiresInEnv 
          ? (typeof expiresInEnv === 'number' ? `${expiresInEnv}s` : expiresInEnv.toString())
          : '3600s'; // 1 hora por defecto
        
        return {
          secret: cfg.get<string>('JWT_SECRET') || 'default-secret-key-change-in-production',
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
