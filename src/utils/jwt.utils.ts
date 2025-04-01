import jwt from 'jsonwebtoken';
import { IUser } from '../models/user.model';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
//const JWT_EXPIRATION = process.env.JWT_EXPIRATION;

export const generateToken = (user: IUser): string => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '24h'}
  );
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};
