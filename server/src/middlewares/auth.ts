import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/backend';
import prisma from '../config/db.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    roleId: string;
    roleName: string;
    societyId: string;
    permissions: string[];
  };
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format.',
      });
      return;
    }

    const secretKey = process.env.CLERK_SECRET_KEY;
    const jwtKey = process.env.CLERK_JWT_KEY;

    let decoded;
    try {
      decoded = await verifyToken(token, {
        secretKey,
        jwtKey,
      });
    } catch (err: any) {
      console.error('Clerk token verification failed:', err.message || err);
      res.status(401).json({
        success: false,
        message: 'Access denied. Invalid or expired token.',
      });
      return;
    }

    const clerkUserId = decoded.sub;
    if (!clerkUserId) {
      res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token claims.',
      });
      return;
    }

    // Look up the user in local database by clerkId
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    // If not found by clerkUserId, check by email (for seeded/existing users first login)
    if (!dbUser) {
      try {
        const { createClerkClient } = await import('@clerk/backend');
        const clerkClient = createClerkClient({ secretKey });
        const clerkUser = await clerkClient.users.getUser(clerkUserId);
        const email = clerkUser.emailAddresses[0]?.emailAddress;

        if (email) {
          dbUser = await prisma.user.findUnique({
            where: { email },
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          });

          if (dbUser) {
            // Update the existing user to associate with their Clerk account
            dbUser = await prisma.user.update({
              where: { id: dbUser.id },
              data: { clerkId: clerkUserId },
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            });
          }
        }
      } catch (err) {
        console.error('Failed to resolve user email from Clerk:', err);
      }
    }

    // If user is still not in DB, we allow /auth/me route to proceed so it can auto-create the user
    if (!dbUser) {
      if (req.path === '/me' || req.originalUrl.endsWith('/auth/me')) {
        req.user = {
          userId: clerkUserId,
          email: '', // Will resolve in /me handler
          roleId: '',
          roleName: '',
          societyId: '',
          permissions: [],
        };
        return next();
      }

      res.status(401).json({
        success: false,
        message: 'Account not registered in society portal.',
      });
      return;
    }

    if (dbUser.deletedAt) {
      res.status(403).json({
        success: false,
        message: 'Your account has been deleted.',
      });
      return;
    }

    if (dbUser.status !== 'ACTIVE') {
      res.status(403).json({
        success: false,
        message: 'Your account is inactive.',
      });
      return;
    }

    const permissions = dbUser.role.rolePermissions.map(
      (rp) => rp.permission.name
    );

    req.user = {
      userId: dbUser.id,
      email: dbUser.email,
      roleId: dbUser.roleId,
      roleName: dbUser.role.name,
      societyId: dbUser.societyId,
      permissions,
    };

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Access denied. Invalid session or token.',
    });
  }
};
