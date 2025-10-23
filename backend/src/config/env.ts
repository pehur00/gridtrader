// Load environment variables before anything else
import dotenv from 'dotenv';
import path from 'path';

// Try multiple possible locations for .env file
const possiblePaths = [
  path.join(__dirname, '../../.env'),
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), 'backend/.env'),
];

let loaded = false;
for (const envPath of possiblePaths) {
  const result = dotenv.config({ path: envPath });
  if (!result.error) {
    console.log(`[ENV] Loaded from: ${envPath}`);
    loaded = true;
    break;
  }
}

if (!loaded) {
  console.warn('[ENV] No .env file found, using system environment variables');
}

export {};
