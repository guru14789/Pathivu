import pg from 'pg';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Try standard env file locations depending on run context
dotenv.config({ path: 'apps/api/.env.development' });
dotenv.config({ path: '.env.development' });
dotenv.config({ path: '.env' });
dotenv.config({ path: '../../.env' });


async function reset() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('Error: DATABASE_URL not defined in environment.');
    process.exit(1);
  }

  const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  const client = new pg.Client({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    const hash = await bcrypt.hash('password123', 12);
    
    const hospitalRes = await client.query('SELECT hospital_id FROM hospitals LIMIT 1');
    const hospitalId = hospitalRes.rows[0]?.hospital_id;
    
    if (hospitalId) {
      const userRes = await client.query('SELECT user_id FROM users WHERE email = $1', ['admin@bewell.com']);
      if (userRes.rows.length === 0) {
        await client.query(
          `INSERT INTO users (hospital_id, full_name, email, password_hash, role, is_active) 
           VALUES ($1, $2, $3, $4, $5, true)`,
          [hospitalId, 'Admin User', 'admin@bewell.com', hash, 'super_admin']
        );
        console.log('Created admin@bewell.com with password123');
      } else {
        await client.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, 'admin@bewell.com']);
        console.log('Password reset for admin@bewell.com to password123');
      }
    } else {
      console.error('No hospital found. Please run seed script first.');
    }
    await client.end();
  } catch (err) {
    console.error('Failed:', err);
  }
}
reset();


