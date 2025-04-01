import { authService } from '../../src/services/auth.service';
import User from '../../src/models/user.model';
import { hashPassword, comparePassword } from '../../src/utils/password.utils';
import { generateToken } from '../../src/utils/jwt.utils';
import { UserRole } from '../../src/models/user.model';

jest.mock('../../src/models/user.model');
jest.mock('../../src/utils/password.utils');
jest.mock('../../src/utils/jwt.utils');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should create a new user and return a token', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.USER,
        password: 'hashedpassword'
      };
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (hashPassword as jest.Mock).mockResolvedValue('hashedpassword');
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      (generateToken as jest.Mock).mockReturnValue('mockToken');

      const result = await authService.signup({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      });

      expect(result.token).toBe('mockToken');
      expect(result.user.email).toBe(mockUser.email);
    });
  });

  describe('login', () => {
    it('should authenticate user and return a token', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.USER
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (comparePassword as jest.Mock).mockResolvedValue(true);
      (generateToken as jest.Mock).mockReturnValue('mockToken');

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result.token).toBe('mockToken');
    });
  });
});
