import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {

  constructor(
    private users: UsersService,
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user || !user.active) return null;

    const ok = await bcrypt.compare(password, user.password);
    return ok ? user : null;
  }

  async login(user: any) {
    if (!user) throw new UnauthorizedException('Credenciales Invalidas');
    const roles: string[] = (user.roles ?? []).map((ur: any) => String(ur.role.name));
    const payload = { sub: user.id, email: user.email, roles };
    const token = this.jwt.sign(payload);
    return { access_token: token };
  }

  async register(dto: RegisterDto) {
    // Verificar que el email no exista
    const existe = await this.users.findByEmail(dto.email);
    if (existe) {
      throw new ConflictException('El email ya está registrado');
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Obtener el rol OWNER
    const ownerRole = await this.prisma.role.findFirst({
      where: { name: 'OWNER' },
    });

    if (!ownerRole) {
      throw new Error('El rol OWNER no existe en la base de datos');
    }

    // Crear el usuario con rol OWNER por defecto
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        active: true,
        roles: {
          create: {
            roleId: ownerRole.id,
          },
        },
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Retornar sin la contraseña
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

}