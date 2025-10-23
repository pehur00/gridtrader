// Load environment variables first
import './env';

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { query } from '../db';

console.log('[Passport] GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('[Passport] GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '***' : 'NOT SET');
console.log('[Passport] GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL);

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: process.env.GOOGLE_CALLBACK_URL!,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists
    let result = await query(
      'SELECT id, email, tier, is_active, created_at, updated_at FROM users WHERE google_id = $1',
      [profile.id]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      return done(null, {
        ...user,
        tier: typeof user.tier === 'string' ? user.tier.toLowerCase() : user.tier,
      });
    }

    // Create new user
    result = await query(
      `INSERT INTO users (email, google_id, tier)
       VALUES ($1, $2, $3)
       RETURNING id, email, tier, is_active, created_at, updated_at`,
      [profile.emails![0].value, profile.id, 'FREE']
    );

    const user = result.rows[0];

    return done(null, {
      ...user,
      tier: typeof user.tier === 'string' ? user.tier.toLowerCase() : user.tier,
    });
  } catch (error) {
    return done(error, undefined);
  }
}));

// JWT Strategy
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET!,
}, async (payload, done) => {
  try {
    const result = await query(
      'SELECT id, email, tier, is_active, created_at, updated_at FROM users WHERE id = $1',
      [payload.sub]
    );

    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return done(null, false);
    }

    const user = result.rows[0];
    return done(null, {
      ...user,
      tier: typeof user.tier === 'string' ? user.tier.toLowerCase() : user.tier,
    });
  } catch (error) {
    return done(error, false);
  }
}));

// Serialize/deserialize user (required for session management)
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const result = await query(
      'SELECT id, email, tier, is_active, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );

    const user = result.rows[0];
    done(null, user ? {
      ...user,
      tier: typeof user.tier === 'string' ? user.tier.toLowerCase() : user.tier,
    } : null);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
