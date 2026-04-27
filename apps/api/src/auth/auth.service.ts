import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      scope: user.scope,
    };

    return {
      accessToken: this.jwt.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        scope: user.scope,
      },
    };
  }

  async refresh(token: string) {
    try {
      const decoded = this.jwt.verify(token);
      const user = await this.prisma.user.findUnique({ where: { id: decoded.sub } });
      if (!user || !user.isActive) throw new UnauthorizedException();

      const payload = { sub: user.id, email: user.email, role: user.role, scope: user.scope };
      return { accessToken: this.jwt.sign(payload) };
    } catch {
      throw new UnauthorizedException('Token invalide');
    }
  }

  async validateUser(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
