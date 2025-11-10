import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {

  constructor(private users: UsersService, private jwt: JwtService) {}

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

}