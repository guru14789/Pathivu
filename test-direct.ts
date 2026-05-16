import pg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: 'apps/api/.env.development' });

async function test() {
  console.log('Connecting to:', process.env.DATABASE_URL);
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log('Connected!');
    const res = await client.query('SELECT email, role FROM users');
    console.log('Users:', res.rows);
    await client.end();
  } catch (err) {
    console.error('Failed:', err);
  }
}
test();
