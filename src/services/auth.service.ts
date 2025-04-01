import User, { IUser, UserRole } from '../models/user.model';
import { hashPassword, comparePassword } from '../utils/password.utils';
import { generateToken } from '../utils/jwt.utils';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';

interface SignupInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
}

class AuthService {
  async signup(input: SignupInput): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: input.email });
      if (existingUser) {
        const error: AppError = new Error('User with this email already exists');
        error.statusCode = 409;
        throw error;
      }

      // Hash password
      const hashedPassword = await hashPassword(input.password);

      // Create new user
      const user = await User.create({
        ...input,
        password: hashedPassword
      });

      // Generate JWT token
      const token = generateToken(user);

      return {
        token,
        user: {
          id: user.id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      };
    } catch (error) {
      logger.error('Signup error:', error);
      throw error;
    }
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = await User.findOne({ email: input.email });
      if (!user) {
        const error: AppError = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
      }

      // Verify password
      const isPasswordValid = await comparePassword(input.password, user.password);
      if (!isPasswordValid) {
        const error: AppError = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
      }

      // Generate JWT token
      const token = generateToken(user);

      return {
        token,
        user: {
          id: user.id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
