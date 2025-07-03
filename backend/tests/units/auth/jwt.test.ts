import 'jest';
import { signJwt, verifyJwt } from '../../../src/utils/jwt';

describe('JWT Utils', () => {
  const mockPayload = {
    userId: 1,
    email: 'test@example.com',
    role: 'user'
  };

  it('deve gerar um token JWT válido', () => {
    const token = signJwt(mockPayload);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });

  it('deve verificar um token JWT válido', () => {
    const token = signJwt(mockPayload);
    const decoded = verifyJwt(token);

    expect(decoded).toBeDefined();
    expect(decoded.userId).toBe(mockPayload.userId);
    expect(decoded.email).toBe(mockPayload.email);
    expect(decoded.role).toBe(mockPayload.role);
  });

  it('deve rejeitar um token JWT inválido', () => {
    const invalidToken = 'invalid.token.here';
    expect(() => verifyJwt(invalidToken)).toThrow();
  });
});
