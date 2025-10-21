import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

// Validation middleware
const registerValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const refreshTokenValidation = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
];

// Public routes
router.post('/register', registerValidation, authController.register.bind(authController));
router.post('/login', loginValidation, authController.login.bind(authController));
router.post('/refresh', refreshTokenValidation, authController.refreshToken.bind(authController));

// Google OAuth routes
router.get('/google', authController.googleAuth.bind(authController));
router.get('/google/callback', authController.googleCallback.bind(authController));

// Protected routes
router.post('/logout', authenticateJWT, authController.logout.bind(authController));
router.get('/me', authenticateJWT, authController.getCurrentUser.bind(authController));
router.post('/change-password', authenticateJWT, changePasswordValidation, authController.changePassword.bind(authController));

export default router;