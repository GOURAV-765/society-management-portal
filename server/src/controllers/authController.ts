import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../config/db.js';
import { generateToken } from '../utils/jwt.js';

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        society: true,
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        member: true,
      },
    });

    // Check if user exists and is not soft-deleted
    if (!user || user.deletedAt) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Check user status
    if (user.status !== 'ACTIVE') {
      res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact your administrator.',
      });
      return;
    }

    // Check if society is active
    if (user.society.deletedAt) {
      res.status(403).json({
        success: false,
        message: 'Your society is inactive. Please contact support.',
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Extract permission names
    const permissions = user.role.rolePermissions.map(
      (rp) => rp.permission.name
    );

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role.name,
      societyId: user.societyId,
      permissions,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        status: user.status,
        societyId: user.societyId,
        societyName: user.society.name,
        role: {
          id: user.role.id,
          name: user.role.name,
        },
        permissions,
        member: user.member
          ? {
              id: user.member.id,
              firstName: user.member.firstName,
              lastName: user.member.lastName,
              phone: user.member.phone,
              profileImage: user.member.profileImage,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Stateless logout: client just discards the token.
    // We return a success response.
    res.status(200).json({
      success: true,
      message: 'Logout successful. Please clear the token from your client storage.',
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const { userId } = req.user;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        society: true,
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        member: true,
      },
    });

    if (!user || user.deletedAt) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({
        success: false,
        message: 'User account is inactive',
      });
      return;
    }

    const permissions = user.role.rolePermissions.map(
      (rp) => rp.permission.name
    );

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        status: user.status,
        societyId: user.societyId,
        societyName: user.society.name,
        role: {
          id: user.role.id,
          name: user.role.name,
        },
        permissions,
        member: user.member
          ? {
              id: user.member.id,
              firstName: user.member.firstName,
              lastName: user.member.lastName,
              phone: user.member.phone,
              profileImage: user.member.profileImage,
              bio: user.member.bio,
              status: user.member.status,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};
