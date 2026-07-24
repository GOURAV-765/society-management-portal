import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import prisma from '../config/db.js';

export const getTasks = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const societyId = req.user?.societyId;
    if (!societyId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const tasks = await prisma.task.findMany({
      where: { societyId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, tasks });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const societyId = req.user?.societyId;
    if (!societyId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { title, description, priority, assigneeId, dueDate } = req.body;

    const task = await prisma.task.create({
      data: {
        societyId,
        title,
        description,
        priority: priority || 'medium',
        assigneeId,
        dueDate,
        status: 'todo',
      },
    });

    res.status(201).json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const societyId = req.user?.societyId;
    if (!societyId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { title, description, priority, assigneeId, dueDate, status } = req.body;

    // Use update to get the actual updated task object back rather than a batch count.
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        priority,
        assigneeId,
        dueDate,
        status,
      },
    });

    res.status(200).json({ success: true, task: updatedTask });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const societyId = req.user?.societyId;
    if (!societyId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    await prisma.task.delete({
      where: { id },
    });

    res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};
