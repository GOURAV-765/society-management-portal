import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import prisma from '../config/db.js';

export const getMeetings = async (
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

    const meetings = await prisma.meeting.findMany({
      where: { societyId },
      include: {
        attendance: true,
      },
      orderBy: { date: 'desc' },
    });

    res.status(200).json({ success: true, meetings });
  } catch (error) {
    next(error);
  }
};

export const createMeeting = async (
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

    const { title, date, description } = req.body;

    const meeting = await prisma.meeting.create({
      data: {
        societyId,
        title,
        date,
        description,
      },
    });

    // Initialize attendance for all active members in the society
    const members = await prisma.member.findMany({
      where: { societyId, deletedAt: null },
    });

    if (members.length > 0) {
      await prisma.attendance.createMany({
        data: members.map((member) => ({
          meetingId: meeting.id,
          memberId: member.id,
          status: 'unmarked',
        })),
      });
    }

    const createdMeeting = await prisma.meeting.findUnique({
      where: { id: meeting.id },
      include: { attendance: true },
    });

    res.status(201).json({ success: true, meeting: createdMeeting });
  } catch (error) {
    next(error);
  }
};

export const updateAttendance = async (
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

    const { meetingId, memberId, status } = req.body;

    const attendance = await prisma.attendance.upsert({
      where: {
        meetingId_memberId: {
          meetingId,
          memberId,
        },
      },
      update: {
        status,
      },
      create: {
        meetingId,
        memberId,
        status,
      },
    });

    res.status(200).json({ success: true, attendance });
  } catch (error) {
    next(error);
  }
};

export const bulkUpdateAttendance = async (
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

    const { meetingId, status } = req.body;

    const members = await prisma.member.findMany({
      where: { societyId, deletedAt: null },
    });

    for (const member of members) {
      await prisma.attendance.upsert({
        where: {
          meetingId_memberId: {
            meetingId,
            memberId: member.id,
          },
        },
        update: {
          status,
        },
        create: {
          meetingId,
          memberId: member.id,
          status,
        },
      });
    }

    const attendance = await prisma.attendance.findMany({
      where: { meetingId },
    });

    res.status(200).json({ success: true, attendance });
  } catch (error) {
    next(error);
  }
};
