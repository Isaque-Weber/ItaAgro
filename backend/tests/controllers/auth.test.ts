import 'jest';
import { createTestApp } from '../helpers/app';
import { AppDataSource } from '../../src/services/typeorm/data-source';
import { User } from '../../src/entities/User';
import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';

describe('Auth Controller', () => {
  let app: FastifyInstance;
  let userRepository: any;

  beforeAll(async () => {
    app = await createTestApp();
    userRepository = AppDataSource.getRepository(User);
  });

  beforeEach(async () => {

  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      const password = await bcrypt.hash('senha123', 10);
      await userRepository.save(userRepository.create({
        email: 'teste@exemplo.com',
        name: 'Usuário Teste',
        password,
        role: 'user'
      }));
    });

    it('deve fazer login com credenciais válidas', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'teste@exemplo.com',
          password: 'senha123'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.token).toBeDefined();
    });

    it('deve rejeitar login com senha incorreta', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'teste@exemplo.com',
          password: 'senhaerrada'
        }
      });

      expect(response.statusCode).toBe(401);
    });

    it('deve rejeitar login com email não cadastrado', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'naocadastrado@exemplo.com',
          password: 'senha123'
        }
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /auth/signup', () => {
    it('deve criar uma nova conta com dados válidos', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/signup',
        payload: {
          email: 'novo@exemplo.com',
          name: 'Novo Usuário',
          password: 'senha123'
        }
      });

      expect(response.statusCode).toBe(201);

      const user = await userRepository.findOneBy({ email: 'novo@exemplo.com' });
      expect(user).toBeDefined();
      expect(user.name).toBe('Novo Usuário');
    });

    it('não deve permitir cadastro com email já existente', async () => {
      // Primeiro cadastro
      await app.inject({
        method: 'POST',
        url: '/auth/signup',
        payload: {
          email: 'duplicado@exemplo.com',
          name: 'Usuário Duplicado',
          password: 'senha123'
        }
      });

      // Tentativa de cadastro duplicado
      const response = await app.inject({
        method: 'POST',
        url: '/auth/signup',
        payload: {
          email: 'duplicado@exemplo.com',
          name: 'Outro Usuário',
          password: 'outrasenha'
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
