import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authService } from '../services/auth.service';
import { logger } from '../utils/logger';

export const validateSignup = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required')
];

export const validateLogin = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const result = await authService.signup(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Signup controller error:', error);
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const result = await authService.login(req.body);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Login controller error:', error);
    next(error);
  }
};
