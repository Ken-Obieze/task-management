import Task, { ITask, TaskPriority, TaskStatus } from '../models/task.model';
import { cacheService } from './cache.service';
import { emitTaskUpdate } from '../config/socket.config';
import { AppError } from '../middlewares/error.middleware';
// import mongoose from 'mongoose';
import { logger } from '../utils/logger';

interface TaskInput {
  title: string;
  description: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate: Date;
  assignedTo: string;
}

interface TaskFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface TaskPaginationResult {
  tasks: ITask[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const CACHE_TTL = 60 * 5; // 5 minutes

class TaskService {
  async createTask(taskInput: TaskInput, userId: string): Promise<ITask> {
    try {
      const task = await Task.create({
        ...taskInput,
        createdBy: userId
      });

      // Clear cache
      await cacheService.clearByPattern(`tasks:user:${taskInput.assignedTo}:*`);

      // Emit socket event
      emitTaskUpdate(taskInput.assignedTo, task);

      return task;
    } catch (error) {
      logger.error('Create task error:', error);
      throw error;
    }
  }

  async getTaskById(taskId: string, userId: string): Promise<ITask> {
    try {
      const cacheKey = `tasks:${taskId}:${userId}`;
      const cachedTask = await cacheService.get<ITask>(cacheKey);
      
      if (cachedTask) {
        return cachedTask;
      }

      const task = await Task.findById(taskId);
      
      if (!task) {
        const error: AppError = new Error('Task not found');
        error.statusCode = 404;
        throw error;
      }

      // Check if user is authorized (admin, task creator, or assigned to the task)
      const isAssigned = task.assignedTo.toString() === userId;
      const isCreator = task.createdBy.toString() === userId;
      
      if (!isAssigned && !isCreator) {
        const error: AppError = new Error('Not authorized to view this task');
        error.statusCode = 403;
        throw error;
      }

      // Cache the result
      await cacheService.set(cacheKey, task, CACHE_TTL);
      
      return task;
    } catch (error) {
      logger.error('Get task by ID error:', error);
      throw error;
    }
  }

  async updateTask(taskId: string, updates: Partial<TaskInput>, userId: string): Promise<ITask> {
    try {
      const task = await Task.findById(taskId);
      
      if (!task) {
        const error: AppError = new Error('Task not found');
        error.statusCode = 404;
        throw error;
      }

      // Check if user is authorized (admin, task creator, or assigned to the task)
      const isAssigned = task.assignedTo.toString() === userId;
      const isCreator = task.createdBy.toString() === userId;
      
      if (!isAssigned && !isCreator) {
        const error: AppError = new Error('Not authorized to update this task');
        error.statusCode = 403;
        throw error;
      }

      // Update the task
      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        { ...updates },
        { new: true, runValidators: true }
      );

      if (!updatedTask) {
        const error: AppError = new Error('Task update failed');
        error.statusCode = 500;
        throw error;
      }

      // Clear cache
      await cacheService.delete(`tasks:${taskId}:${userId}`);
      await cacheService.clearByPattern(`tasks:user:${task.assignedTo}:*`);
      
      if (updates.assignedTo && updates.assignedTo !== task.assignedTo.toString()) {
        await cacheService.clearByPattern(`tasks:user:${updates.assignedTo}:*`);
      }

      // Emit socket event for both the previous assignee and new assignee if changed
      emitTaskUpdate(task.assignedTo.toString(), updatedTask);
      
      if (updates.assignedTo && updates.assignedTo !== task.assignedTo.toString()) {
        emitTaskUpdate(updates.assignedTo, updatedTask);
      }

      return updatedTask;
    } catch (error) {
      logger.error('Update task error:', error);
      throw error;
    }
  }

  async deleteTask(taskId: string, userId: string): Promise<boolean> {
    try {
      const task = await Task.findById(taskId);
      
      if (!task) {
        const error: AppError = new Error('Task not found');
        error.statusCode = 404;
        throw error;
      }

      // Check if user is authorized (only creator or admin can delete)
      const isCreator = task.createdBy.toString() === userId;
      
      if (!isCreator) {
        const error: AppError = new Error('Not authorized to delete this task');
        error.statusCode = 403;
        throw error;
      }

      await Task.findByIdAndDelete(taskId);

      // Clear cache
      await cacheService.delete(`tasks:${taskId}:${userId}`);
      await cacheService.clearByPattern(`tasks:user:${task.assignedTo}:*`);

      // Emit socket event
      emitTaskUpdate(task.assignedTo.toString(), { _id: taskId, deleted: true });

      return true;
    } catch (error) {
      logger.error('Delete task error:', error);
      throw error;
    }
  }

  async getUserTasks(userId: string, filter: TaskFilter): Promise<TaskPaginationResult> {
    try {
      const {
        status,
        priority,
        startDate,
        endDate,
        searchTerm,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filter;

      // Build cache key based on filter parameters
      const cacheKey = `tasks:user:${userId}:${JSON.stringify(filter)}`;
      
      // Check cache first
      const cachedResult = await cacheService.get<TaskPaginationResult>(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      // Build query
      const query: any = { assignedTo: userId };
      
      if (status) {
        query.status = status;
      }
      
      if (priority) {
        query.priority = priority;
      }
      
      if (startDate && endDate) {
        query.dueDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
      } else if (startDate) {
        query.dueDate = { $gte: new Date(startDate) };
      } else if (endDate) {
        query.dueDate = { $lte: new Date(endDate) };
      }
      
      if (searchTerm) {
        query.$or = [
          { title: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } }
        ];
      }

      // Calculate pagination parameters
      const skip = (page - 1) * limit;
      
      // Build sort object
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Execute query with pagination
      const [tasks, total] = await Promise.all([
        Task.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .exec(),
        Task.countDocuments(query)
      ]);

      const result: TaskPaginationResult = {
        tasks,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };

      // Cache the result
      await cacheService.set(cacheKey, result, CACHE_TTL);

      return result;
    } catch (error) {
      logger.error('Get user tasks error:', error);
      throw error;
    }
  }

  async getAllTasks(filter: TaskFilter): Promise<TaskPaginationResult> {
    try {
      const {
        status,
        priority,
        startDate,
        endDate,
        searchTerm,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filter;

      // Build cache key based on filter parameters
      const cacheKey = `tasks:all:${JSON.stringify(filter)}`;
      
      // Check cache first
      const cachedResult = await cacheService.get<TaskPaginationResult>(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      // Build query
      const query: any = {};
      
      if (status) {
        query.status = status;
      }
      
      if (priority) {
        query.priority = priority;
      }
      
      if (startDate && endDate) {
        query.dueDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
      } else if (startDate) {
        query.dueDate = { $gte: new Date(startDate) };
      } else if (endDate) {
        query.dueDate = { $lte: new Date(endDate) };
      }
      
      if (searchTerm) {
        query.$or = [
          { title: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } }
        ];
      }

      // Calculate pagination parameters
      const skip = (page - 1) * limit;
      
      // Build sort object
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Execute query with pagination
      const [tasks, total] = await Promise.all([
        Task.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate('assignedTo', 'firstName lastName email')
          .populate('createdBy', 'firstName lastName email')
          .exec(),
        Task.countDocuments(query)
      ]);

      const result: TaskPaginationResult = {
        tasks,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };

      // Cache the result
      await cacheService.set(cacheKey, result, CACHE_TTL);

      return result;
    } catch (error) {
      logger.error('Get all tasks error:', error);
      throw error;
    }
  }
}

export const taskService = new TaskService();
