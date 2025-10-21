import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { UserTier } from '@gridtrader/shared';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      tier: UserTier;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    }
  }
}

// JWT Authentication Middleware
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (err: any, user: Express.User | false, info: any) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - Invalid or expired token'
      });
    }

    req.user = user;
    next();
  })(req, res, next);
};

// Optional Authentication Middleware (doesn't fail if no token)
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (err: any, user: Express.User | false) => {
    if (user) {
      req.user = user;
    }
    next();
  })(req, res, next);
};

// Tier-based access control
export const requireTier = (minimumTier: UserTier) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const tierHierarchy = {
      [UserTier.FREE]: 0,
      [UserTier.PRO]: 1,
      [UserTier.PREMIUM]: 2,
    };

    const userTierLevel = tierHierarchy[req.user.tier];
    const requiredTierLevel = tierHierarchy[minimumTier];

    if (userTierLevel < requiredTierLevel) {
      return res.status(403).json({
        success: false,
        error: `This feature requires ${minimumTier} tier or higher`
      });
    }

    next();
  };
};

// Free tier specific limits
export const enforceFreeTierLimits = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (req.user.tier === UserTier.FREE) {
    // Add specific limits for free tier users
    // This would typically be implemented with rate limiting and usage tracking
    req.isFreeTier = true;
  }

  next();
};

// Extend Request interface for free tier
declare global {
  namespace Express {
    interface Request {
      user?: Express.User;
      isFreeTier?: boolean;
    }
  }
};