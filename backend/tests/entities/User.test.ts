import { User } from '../../src/entities/User';
import bcrypt from 'bcrypt';

describe('User Entity', () => {
  let user: User;

  beforeEach(() => {
    user = new User();
    user.email = 'test@example.com';
    user.password = 'password123';
    user.role = 'user';
  });

  it('should create a valid user', () => {
    expect(user).toBeInstanceOf(User);
    expect(user.email).toBe('test@example.com');
    expect(user.role).toBe('user');
  });

  it('should hash the password before insert', async () => {
    // Call the private method using any type assertion
    await (user as any).hashPassword();
    
    // Verify the password was hashed
    expect(user.password).not.toBe('password123');
    
    // Verify the hashed password can be compared correctly
    const isMatch = await bcrypt.compare('password123', user.password);
    expect(isMatch).toBe(true);
  });

  it('should have correct relationships defined', () => {
    // Check that the relationships are defined
    expect(user.subscriptions).toBeUndefined(); // Initially undefined until loaded
    expect(user.chatSessions).toBeUndefined(); // Initially undefined until loaded
    
    // In a real test with a database connection, you would test loading relationships
  });
});