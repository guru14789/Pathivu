import pg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: 'apps/api/.env.development' });

async function check() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });
  try {
    await client.connect();
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    console.log('Columns in users:', res.rows.map(r => r.column_name));
    await client.end();
  } catch (err) {
    console.error(err);
  }
}
check();
