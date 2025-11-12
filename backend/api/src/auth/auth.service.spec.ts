import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';

// Mockear bcryptjs antes de importar cualquier cosa que lo use
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let prismaService: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    // Resetear mocks de bcrypt antes de cada test
    jest.clearAllMocks();

    const mockUsersService = {
      findByEmail: jest.fn(),
    };

    const mockPrismaService = {
      role: {
        findFirst: jest.fn(),
      },
      user: {
        create: jest.fn(),
      },
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
  });

  describe('validateUser', () => {
    it('debe retornar null si el usuario no existe', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const resultado = await service.validateUser('test@test.com', 'password');
      expect(resultado).toBeNull();
    });

    it('debe retornar null si el usuario está inactivo', async () => {
      usersService.findByEmail.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        active: false,
        password: 'hashed',
      } as any);

      const resultado = await service.validateUser('test@test.com', 'password');
      expect(resultado).toBeNull();
    });

    it('debe retornar el usuario si las credenciales son correctas', async () => {
      const user = {
        id: '1',
        email: 'test@test.com',
        active: true,
        password: 'hashed-password',
      };

      usersService.findByEmail.mockResolvedValue(user as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const resultado = await service.validateUser('test@test.com', 'password123');
      expect(resultado).toEqual(user);
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
    });
  });

  describe('login', () => {
    it('debe generar un token JWT', async () => {
      const user = {
        id: '1',
        email: 'test@test.com',
        roles: [{ role: { name: 'OWNER' } }],
      };

      jwtService.sign.mockReturnValue('mock-token');

      const resultado = await service.login(user as any);
      expect(resultado).toEqual({ access_token: 'mock-token' });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: '1',
        email: 'test@test.com',
        roles: ['OWNER'],
      });
    });

    it('debe lanzar UnauthorizedException si no hay usuario', async () => {
      await expect(service.login(null)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('debe lanzar ConflictException si el email ya existe', async () => {
      usersService.findByEmail.mockResolvedValue({ id: '1', email: 'test@test.com' } as any);

      await expect(
        service.register({
          name: 'Test',
          email: 'test@test.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('debe crear un usuario nuevo con rol OWNER', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      (prismaService.role.findFirst as jest.Mock).mockResolvedValue({ id: 'role-1', name: 'OWNER' });
      (prismaService.user.create as jest.Mock).mockResolvedValue({
        id: 'user-1',
        name: 'Test',
        email: 'test@test.com',
        password: 'hashed-password',
        roles: [{ role: { name: 'OWNER' } }],
      });

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const resultado = await service.register({
        name: 'Test',
        email: 'test@test.com',
        password: 'password123',
      });

      expect(resultado).not.toHaveProperty('password');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(prismaService.user.create).toHaveBeenCalled();
    });
  });
});

