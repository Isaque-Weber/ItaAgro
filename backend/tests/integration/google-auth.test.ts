import 'jest';
import { createTestApp } from '../helpers/app';
import { AppDataSource } from '../../src/services/typeorm/data-source';
import { User } from '../../src/entities/User';
import { FastifyInstance } from 'fastify';

describe('Google Authentication Integration', () => {
  let app: FastifyInstance;
  let userRepository: any;

  beforeAll(async () => {
    app = await createTestApp();
    userRepository = AppDataSource.getRepository(User);
  });

  beforeEach(async () => {
    const entity = AppDataSource.getRepository(User).metadata;
    const repository = AppDataSource.getRepository(User);
    if (entity.primaryColumns.length > 0 && entity.foreignKeys.length === 0) {
      await repository.clear();
    } else if (entity.foreignKeys.length > 0) {
      await repository.delete({});
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('deve redirecionar para o Google ao iniciar autenticação', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/auth/google'
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toContain('accounts.google.com');
  });

  it('deve criar novo usuário após autenticação Google bem-sucedida', async () => {
    const mockGoogleUser = {
      email: 'test@gmail.com',
      name: 'Test User',
      id: '123456789',
    };

    // Simula callback do Google
    const response = await app.inject({
      method: 'GET',
      url: '/auth/google/callback',
      query: {
        code: 'mock_auth_code'
      }
    });

    // Verifica se o usuário foi criado no banco
    const user = await userRepository.findOneBy({ email: mockGoogleUser.email });
    expect(user).toBeDefined();
    expect(user.googleId).toBe(mockGoogleUser.id);
    expect(user.emailVerified).toBe(true);
  });
});
