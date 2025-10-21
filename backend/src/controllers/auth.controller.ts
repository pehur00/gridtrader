import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import passport from 'passport';
import { AuthService } from '../services/auth.service';
import { ApiResponse, validateLogin, validateRegister } from '@gridtrader/shared';

export class AuthController {
  private authService = new AuthService();

  // Register new user
  async register(req: Request, res: Response) {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        } as ApiResponse);
      }

      const { email, password } = req.body;

      // Validate with Zod schema
      const validationResult = validateRegister({ email, password });
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input data',
          details: validationResult.error.issues
        } as ApiResponse);
      }

      // Register user
      const result = await this.authService.register(email, password);

      res.status(201).json({
        success: true,
        data: result,
        message: 'User registered successfully'
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      res.status(400).json({
        success: false,
        error: message
      } as ApiResponse);
    }
  }

  // Login user
  async login(req: Request, res: Response) {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        } as ApiResponse);
      }

      const { email, password } = req.body;

      // Validate with Zod schema
      const validationResult = validateLogin({ email, password });
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input data',
          details: validationResult.error.issues
        } as ApiResponse);
      }

      // Login user
      const result = await this.authService.login(email, password);

      res.json({
        success: true,
        data: result,
        message: 'Login successful'
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      res.status(401).json({
        success: false,
        error: message
      } as ApiResponse);
    }
  }

  // Google OAuth login
  async googleAuth(req: Request, res: Response, next: NextFunction) {
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false
    })(req, res, next);
  }

  // Google OAuth callback
  async googleCallback(req: Request, res: Response, next: NextFunction) {
    passport.authenticate('google', {
      session: false,
      failureRedirect: `${process.env.CORS_ORIGIN}/login?error=google-auth-failed`
    }, (err: any, user: any) => {
      if (err) {
        return res.redirect(`${process.env.CORS_ORIGIN}/login?error=${encodeURIComponent(err.message)}`);
      }

      if (!user) {
        return res.redirect(`${process.env.CORS_ORIGIN}/login?error=authentication-failed`);
      }

      // Generate tokens for OAuth user
      const authService = new AuthService();
      // This would need to be implemented in the service
      // For now, we'll create a simple token
      const token = 'simple-jwt-token-for-oauth';

      // Redirect to frontend with token
      res.redirect(`${process.env.CORS_ORIGIN}/auth/callback?token=${token}`);
    })(req, res, next);
  }

  // Refresh token
  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token is required'
        } as ApiResponse);
      }

      const tokens = await this.authService.refreshToken(refreshToken);

      res.json({
        success: true,
        data: tokens,
        message: 'Token refreshed successfully'
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Token refresh failed';
      res.status(401).json({
        success: false,
        error: message
      } as ApiResponse);
    }
  }

  // Logout user
  async logout(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated'
        } as ApiResponse);
      }

      await this.authService.logout(req.user.id);

      res.json({
        success: true,
        message: 'Logout successful'
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Logout failed';
      res.status(500).json({
        success: false,
        error: message
      } as ApiResponse);
    }
  }

  // Get current user
  async getCurrentUser(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated'
        } as ApiResponse);
      }

      res.json({
        success: true,
        data: req.user,
        message: 'User retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get user';
      res.status(500).json({
        success: false,
        error: message
      } as ApiResponse);
    }
  }

  // Change password
  async changePassword(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated'
        } as ApiResponse);
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Current password and new password are required'
        } as ApiResponse);
      }

      await this.authService.changePassword(req.user.id, currentPassword, newPassword);

      res.json({
        success: true,
        message: 'Password changed successfully'
      } as ApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password change failed';
      res.status(400).json({
        success: false,
        error: message
      } as ApiResponse);
    }
  }
}