import { query } from '../db';

async function fixCorruptedEmails() {
  try {
    console.log('Searching for users with corrupted email fields...');
    
    // Find users with corrupted email field (emails that start with '{')
    const result = await query(
      "SELECT id, email, tier FROM users WHERE email LIKE '{%'"
    );
    
    console.log(`Found ${result.rows.length} users with corrupted email field`);
    
    for (const user of result.rows) {
      console.log('\n---');
      console.log('User ID:', user.id);
      console.log('Corrupted email field:', user.email);
      console.log('Current tier:', user.tier);
      
      try {
        // Try to extract the actual email from the JSON string
        const parsed = JSON.parse(user.email);
        const actualEmail = parsed.email;
        const actualTier = parsed.tier || 'free';
        
        console.log('Extracted email:', actualEmail);
        console.log('Extracted tier:', actualTier);
        
        // Update the user with the correct email and tier
        await query(
          'UPDATE users SET email = $1, tier = $2 WHERE id = $3',
          [actualEmail, actualTier, user.id]
        );
        
        console.log('✅ Fixed user', user.id);
      } catch (e) {
        console.error('❌ Failed to parse email for user', user.id, ':', e);
      }
    }
    
    console.log('\n✅ Done! Fixed', result.rows.length, 'users');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixCorruptedEmails();
