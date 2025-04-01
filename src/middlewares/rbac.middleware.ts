import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { UserRole } from '../models/user.model';
import { logger } from '../utils/logger';

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    if (req.user.role !== UserRole.ADMIN) {
      res.status(403).json({ message: 'Access denied. Admin privileges required' });
      return;
    }

    next();
  } catch (error) {
    logger.error('RBAC error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const hasRole = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      if (!roles.includes(req.user.role as UserRole)) {
        res.status(403).json({ message: 'Access denied. Insufficient privileges' });
        return;
      }

      next();
    } catch (error) {
      logger.error('RBAC error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};
