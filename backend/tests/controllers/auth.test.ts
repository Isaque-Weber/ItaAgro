import { FastifyInstance } from 'fastify';
import { build } from '../../src/app'; // We'll need to create this file
import { AppDataSource } from '../../src/services/typeorm/data-source';
import { User } from '../../src/entities/User';
import bcrypt from 'bcrypt';

// Mock TypeORM's AppDataSource
jest.mock('../../src/services/typeorm/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('Auth Controller', () => {
  let app: FastifyInstance;
  let mockUserRepo: any;
  let mockUser: User;

  beforeAll(async () => {
    // Create the Fastify app
    app = await build();
  });

  beforeEach(() => {
    // Create a mock user
    mockUser = new User();
    mockUser.id = '123e4567-e89b-12d3-a456-426614174000';
    mockUser.email = 'test@example.com';
    mockUser.password = bcrypt.hashSync('password123', 10);
    mockUser.role = 'user';

    // Mock the user repository
    mockUserRepo = {
      findOneBy: jest.fn().mockResolvedValue(mockUser),
    };

    // Set up the mock repository
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockUserRepo);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('should return 200 and set cookie with valid credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(expect.objectContaining({
        success: true,
        role: 'user',
      }));
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('itaagro_token');
    });

    it('should return 401 with invalid credentials', async () => {
      // Mock bcrypt.compare to return false for invalid password
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false);

      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'wrongpassword',
        },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual(expect.objectContaining({
        message: 'Credenciais inválidas',
      }));
    });

    it('should return 401 when user not found', async () => {
      // Mock repository to return null (user not found)
      mockUserRepo.findOneBy.mockResolvedValueOnce(null);

      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'nonexistent@example.com',
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual(expect.objectContaining({
        message: 'Usuário inválido',
      }));
    });
  });

  describe('POST /auth/logout', () => {
    it('should clear the cookie and return success', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/logout',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ success: true });
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('itaagro_token=;');
    });
  });

  describe('GET /auth/me', () => {
    it('should return user info when authenticated', async () => {
      // First login to get a token
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'password123',
        },
      });

      const cookies = loginResponse.headers['set-cookie'];

      // Then use the token to access /me
      const response = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: {
          cookie: cookies[0],
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        email: 'test@example.com',
        role: 'user',
      });
    });

    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/me',
      });

      expect(response.statusCode).toBe(401);
    });
  });
});