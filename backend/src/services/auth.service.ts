import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import { User, AuthResponse, UserTier } from '@gridtrader/shared';

interface DbUser {
  id: string;
  email: string;
  password_hash?: string;
  google_id?: string;
  tier: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class AuthService {

  // Convert DB user to shared User type
  private convertToSharedUser(dbUser: DbUser): User {
    const normalizedTier = typeof dbUser.tier === 'string'
      ? (dbUser.tier.toLowerCase() as UserTier)
      : UserTier.FREE;
    return {
      id: dbUser.id,
      email: dbUser.email,
      tier: normalizedTier,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
    };
  }

  // Register new user
  async register(email: string, password: string): Promise<AuthResponse> {
    // Check if user already exists
    const existingUserResult = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUserResult.rows.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const result = await query(
      `INSERT INTO users (email, password_hash, tier)
       VALUES ($1, $2, $3)
       RETURNING id, email, tier, created_at, updated_at`,
      [email, passwordHash, 'FREE']
    );

    const user = result.rows[0];

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
    const result = await query(
      'SELECT id, email, password_hash, tier, is_active, created_at, updated_at FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    if (!user.password_hash) {
      throw new Error('Please login with Google OAuth');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Remove password hash from user object
    const { password_hash: _, ...userWithoutPassword } = user;

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(userWithoutPassword);

    // Store refresh token hash
    await this.storeRefreshToken(user.id, refreshToken);

    return {
      user: this.convertToSharedUser(user),
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
      const result = await query(
        'SELECT id, email, tier, is_active, created_at, updated_at FROM users WHERE id = $1',
        [decoded.sub]
      );

      if (result.rows.length === 0 || !result.rows[0].is_active) {
        throw new Error('User not found or inactive');
      }

      const user = result.rows[0];

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
    const result = await query(
      'SELECT id, password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0 || !result.rows[0].password_hash) {
      throw new Error('User not found or uses OAuth login');
    }

    const user = result.rows[0];

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, userId]
    );
  }

  // Private methods
  private generateTokens(user: Partial<User>): { accessToken: string; refreshToken: string } {
    const payload = {
      sub: user.id,
      email: user.email,
      tier: typeof user.tier === 'string' ? user.tier.toLowerCase() : UserTier.FREE,
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
  async oauthLogin(email: string, googleId: string): Promise<AuthResponse> {
    // Try to find existing user
    let result = await query(
      'SELECT id, email, tier, is_active, created_at, updated_at FROM users WHERE google_id = $1 OR email = $2',
      [googleId, email]
    );

    let user;
    if (result.rows.length === 0) {
      // Create new user
      result = await query(
        `INSERT INTO users (email, google_id, tier)
         VALUES ($1, $2, $3)
         RETURNING id, email, tier, is_active, created_at, updated_at`,
        [email, googleId, 'FREE']
      );
      user = result.rows[0];
    } else {
      user = result.rows[0];
      // Update google_id if not set
      if (!user.google_id) {
        await query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, user.id]);
      }
    }

    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

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
