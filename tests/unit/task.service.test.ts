import { taskService } from '../../src/services/task.service';
import Task from '../../src/models/task.model';
import { cacheService } from '../../src/services/cache.service';
import { emitTaskUpdate } from '../../src/config/socket.config';
import { AppError } from '../../src/middlewares/error.middleware';

// Mock dependencies
jest.mock('../../src/models/task.model');
jest.mock('../../src/services/cache.service');
jest.mock('../../src/config/socket.config');

describe('Task Service', () => {
  const mockUserId = '12345';
  const mockAssignedUserId = '67890';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a task successfully', async () => {
    const taskData = {
      title: 'Test Task',
      description: 'This is a test task.',
      dueDate: new Date(),
      assignedTo: mockAssignedUserId,
    };

    const createdTask = {
      ...taskData,
      _id: 'taskId',
      createdBy: mockUserId,
      status: 'pending',
      priority: 'medium',
    };

    Task.create = jest.fn().mockResolvedValue(createdTask);
    cacheService.clearByPattern = jest.fn();
    (emitTaskUpdate as jest.Mock) = jest.fn();

    const result = await taskService.createTask(taskData, mockUserId);

    expect(Task.create).toHaveBeenCalledWith({
      ...taskData,
      createdBy: mockUserId,
    });
    expect(cacheService.clearByPattern).toHaveBeenCalled();
    expect(emitTaskUpdate).toHaveBeenCalledWith(mockAssignedUserId, createdTask);
    expect(result).toEqual(createdTask);
  });

  it('should throw an error if task creation fails', async () => {
    const taskData = {
      title: 'Test Task',
      description: 'This is a test task.',
      dueDate: new Date(),
      assignedTo: mockAssignedUserId,
    };

    Task.create = jest.fn().mockRejectedValue(new Error('Database error'));

    await expect(taskService.createTask(taskData, mockUserId)).rejects.toThrowError('Database error');
  });

  it('should get task by ID', async () => {
    const task = {
      _id: 'taskId',
      title: 'Test Task',
      description: 'This is a test task.',
      status: 'pending',
      priority: 'medium',
      dueDate: new Date(),
      assignedTo: mockAssignedUserId,
      createdBy: mockUserId,
    };

    cacheService.get = jest.fn().mockResolvedValue(null); // No cache hit
    Task.findById = jest.fn().mockResolvedValue(task);
    
    const result = await taskService.getTaskById('taskId', mockUserId);

    expect(Task.findById).toHaveBeenCalledWith('taskId');
    expect(result).toEqual(task);
  });

  it('should throw error if task is not found', async () => {
    Task.findById = jest.fn().mockResolvedValue(null);

    await expect(taskService.getTaskById('invalidTaskId', mockUserId)).rejects.toThrow(Error);
  });

});
