import { query, closePool } from '../db';

async function setPremium(email: string) {
  try {
    // Check if user exists
    const result = await query(
      'SELECT id, email, tier FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      // Create new user with PREMIUM tier
      const createResult = await query(
        `INSERT INTO users (email, tier, is_active)
         VALUES ($1, $2, $3)
         RETURNING id, email, tier, is_active`,
        [email, 'PREMIUM', true]
      );
      console.log('✅ Created new user with PREMIUM tier:', createResult.rows[0]);
    } else {
      // Update existing user
      const updateResult = await query(
        'UPDATE users SET tier = $1 WHERE email = $2 RETURNING id, email, tier',
        ['PREMIUM', email]
      );
      console.log('✅ Updated user to PREMIUM tier:', updateResult.rows[0]);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await closePool();
  }
}

// Run the script
const email = process.argv[2] || 'oudejans@gmail.com';
setPremium(email);
