import pg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: 'apps/api/.env.development' });

async function test() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log('Connected to DB!');
    await client.end();
  } catch (err) {
    console.error('Failed to connect to DB:', err);
  }
}
test();
