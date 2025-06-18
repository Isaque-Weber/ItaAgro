import { build } from '../../src/app';
import { FastifyInstance } from 'fastify';
import { AppDataSource } from '../../src/services/typeorm/data-source';
import { User } from '../../src/entities/User';
import bcrypt from 'bcrypt';

/**
 * Integration tests for the auth endpoints
 * 
 * These tests use a real database connection but with a test database.
 * Make sure to set up a test database before running these tests.
 * 
 * You can run these tests with:
 * NODE_ENV=test npm test -- tests/integration/auth.integration.test.ts
 */
describe('Auth Integration Tests', () => {
  let app: FastifyInstance;
  let testUser: User;

  // Set up the app and database before all tests
  beforeAll(async () => {
    // Initialize the database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    
    // Build the app
    app = await build();
    
    // Create a test user
    const userRepository = AppDataSource.getRepository(User);
    
    // Delete any existing test users
    await userRepository.delete({ email: 'integration-test@example.com' });
    
    // Create a new test user
    testUser = new User();
    testUser.email = 'integration-test@example.com';
    testUser.password = 'password123'; // Will be hashed by the entity
    testUser.role = 'user';
    
    await userRepository.save(testUser);
  });

  // Clean up after all tests
  afterAll(async () => {
    // Delete the test user
    if (AppDataSource.isInitialized) {
      const userRepository = AppDataSource.getRepository(User);
      await userRepository.delete({ email: 'integration-test@example.com' });
      
      // Close the database connection
      await AppDataSource.destroy();
    }
    
    // Close the app
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'integration-test@example.com',
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
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'integration-test@example.com',
          password: 'wrongpassword',
        },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual(expect.objectContaining({
        message: 'Credenciais inválidas',
      }));
    });

    it('should return 401 when user not found', async () => {
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

  describe('GET /auth/me', () => {
    it('should return user info when authenticated', async () => {
      // First login to get a token
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'integration-test@example.com',
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
        email: 'integration-test@example.com',
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