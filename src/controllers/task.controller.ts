import { Request, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';
import { taskService } from '../services/task.service';
import { TaskPriority, TaskStatus } from '../models/task.model';
import { AuthRequest } from '../middlewares/auth.middleware';
import { logger } from '../utils/logger';

export const validateCreateTask = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('priority')
    .optional()
    .isIn(Object.values(TaskPriority))
    .withMessage('Invalid priority'),
  body('status')
    .optional()
    .isIn(Object.values(TaskStatus))
    .withMessage('Invalid status'),
  body('assignedTo').notEmpty().withMessage('Assigned user is required')
];

export const validateUpdateTask = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  body('dueDate').optional().isISO8601().withMessage('Valid due date is required'),
  body('priority')
    .optional()
    .isIn(Object.values(TaskPriority))
    .withMessage('Invalid priority'),
  body('status')
    .optional()
    .isIn(Object.values(TaskStatus))
    .withMessage('Invalid status'),
  body('assignedTo').optional().notEmpty().withMessage('Assigned user cannot be empty')
];

export const validateTaskFilters = [
  query('status')
    .optional()
    .isIn(Object.values(TaskStatus))
    .withMessage('Invalid status'),
  query('priority')
    .optional()
    .isIn(Object.values(TaskPriority))
    .withMessage('Invalid priority'),
  query('startDate').optional().isISO8601().withMessage('Valid start date is required'),
  query('endDate').optional().isISO8601().withMessage('Valid end date is required'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer'),
  query('sortBy')
    .optional()
    .isIn(['title', 'createdAt', 'priority', 'status', 'dueDate'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

export const createTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!req.user?.userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const task = await taskService.createTask(req.body, req.user.userId);
    res.status(201).json(task);
  } catch (error) {
    logger.error('Create task controller error:', error);
    next(error);
  }
};

export const getTaskById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const taskId = req.params.id;
    const task = await taskService.getTaskById(taskId, req.user.userId);
    res.status(200).json(task);
  } catch (error) {
    logger.error('Get task by ID controller error:', error);
    next(error);
  }
};

export const updateTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!req.user?.userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const taskId = req.params.id;
    const updatedTask = await taskService.updateTask(taskId, req.body, req.user.userId);
    res.status(200).json(updatedTask);
  } catch (error) {
    logger.error('Update task controller error:', error);
    next(error);
  }
};

export const deleteTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const taskId = req.params.id;
    await taskService.deleteTask(taskId, req.user.userId);
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    logger.error('Delete task controller error:', error);
    next(error);
  }
};

export const getUserTasks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!req.user?.userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const tasks = await taskService.getUserTasks(req.user.userId, req.query as any);
    res.status(200).json(tasks);
  } catch (error) {
    logger.error('Get user tasks controller error:', error);
    next(error);
  }
};

export const getAllTasks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!req.user?.userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const tasks = await taskService.getAllTasks(req.query as any);
    res.status(200).json(tasks);
  } catch (error) {
    logger.error('Get all tasks controller error:', error);
    next(error);
  }
};
