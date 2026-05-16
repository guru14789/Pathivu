import pg from 'pg';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
dotenv.config({ path: 'apps/api/.env.development' });

async function reset() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    const hash = await bcrypt.hash('password123', 12);
    await client.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, 'admin@bewell.com']);
    console.log('Password reset for admin@bewell.com to password123');
    await client.end();
  } catch (err) {
    console.error('Failed:', err);
  }
}
reset();
