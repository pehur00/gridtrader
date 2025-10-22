import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { User, AuthResponse, UserTier } from '@gridtrader/shared';
import { User as PrismaUser, UserTier as PrismaUserTier } from '@prisma/client';

export class AuthService {

  // Convert Prisma User to shared User type
  private convertToSharedUser(prismaUser: PrismaUser): User {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      tier: this.convertUserTier(prismaUser.tier),
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    };
  }

  // Convert Prisma UserTier to shared UserTier
  private convertUserTier(prismaTier: PrismaUserTier): UserTier {
    switch (prismaTier) {
      case PrismaUserTier.FREE:
        return UserTier.FREE;
      case PrismaUserTier.PRO:
        return UserTier.PRO;
      case PrismaUserTier.PREMIUM:
        return UserTier.PREMIUM;
      default:
        return UserTier.FREE;
    }
  }
  // Register new user
  async register(email: string, password: string): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        tier: PrismaUserTier.FREE,
      },
      select: {
        id: true,
        email: true,
        tier: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(user);

    // Store refresh token hash
    await this.storeRefreshToken(user.id, refreshToken);

    return {
      user: this.convertToSharedUser(user),
      accessToken,
      refreshToken,
    };
  }

  // Login user
  async login(email: string, password: string): Promise<AuthResponse> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        tier: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    if (!user.passwordHash) {
      throw new Error('Please login with Google OAuth');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Remove password hash from user object
    const { passwordHash: _, ...userWithoutPassword } = user;

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(userWithoutPassword);

    // Store refresh token hash
    await this.storeRefreshToken(user.id, refreshToken);

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
        select: {
          id: true,
          email: true,
          tier: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      // Generate new tokens
      const tokens = this.generateTokens(user);

      // Store new refresh token
      await this.storeRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Logout user
  async logout(userId: string): Promise<void> {
    // Remove refresh token
    await this.removeRefreshToken(userId);
  }

  // Change password
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        passwordHash: true,
      }
    });

    if (!user || !user.passwordHash) {
      throw new Error('User not found or uses OAuth login');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    });
  }

  // Private methods
  private generateTokens(user: Partial<User>): { accessToken: string; refreshToken: string } {
    const payload = {
      sub: user.id,
      email: user.email,
      tier: user.tier,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    // In a real implementation, you would store refresh tokens in a separate table
    // For now, we'll just store it in Redis or a simple in-memory store
    // This is a simplified version
    const tokenHash = bcrypt.hashSync(refreshToken, 10);

    // Store in Redis or database (implement based on your preference)
    // await redis.setex(`refresh_token:${userId}`, 7 * 24 * 60 * 60, tokenHash);
  }

  private async removeRefreshToken(userId: string): Promise<void> {
    // Remove refresh token from storage
    // await redis.del(`refresh_token:${userId}`);
  }

  // OAuth login for Google/other providers
  async oauthLogin(user: PrismaUser): Promise<AuthResponse> {
    const sharedUser = this.convertToSharedUser(user);

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(sharedUser);

    // Store refresh token hash
    await this.storeRefreshToken(sharedUser.id, refreshToken);

    return {
      user: sharedUser,
      accessToken,
      refreshToken,
    };
  }

  // Verify refresh token (for middleware)
  async verifyRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
    try {
      // Get stored token hash
      // const storedHash = await redis.get(`refresh_token:${userId}`);

      // For now, we'll just verify the token is valid
      jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
      return true;
    } catch (error) {
      return false;
    }
  }
}