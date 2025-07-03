import 'jest';
import { User } from '../../src/entities/User';
import { AppDataSource } from '../../src/services/typeorm/data-source';
import bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UserRole } from '../../src/entities/User'; // ajuste necessário

describe('User Entity', () => {
  let userRepository: Repository<User>;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    userRepository = AppDataSource.getRepository(User);
  });

  it('deve criar um novo usuário com senha criptografada', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
      role: UserRole.USER,
    };

    const user = userRepository.create(userData);
    await userRepository.save(user);

    const savedUser = await userRepository.findOneBy({ email: userData.email });
    expect(savedUser).toBeDefined();
    expect(savedUser?.email).toBe(userData.email);
    expect(savedUser?.name).toBe(userData.name);

    const isPasswordValid = await bcrypt.compare(userData.password, savedUser!.password);
    expect(isPasswordValid).toBe(true);
  });

  it('não deve permitir dois usuários com o mesmo email', async () => {
    const userData = {
      email: 'duplicate@example.com',
      name: 'Test User',
      password: 'password123',
      role: UserRole.USER,
    };

    await userRepository.save(userRepository.create(userData));

    await expect(() =>
        userRepository.save(userRepository.create(userData))
    ).rejects.toThrow(/duplicate|violates unique constraint/i);
  });
});
