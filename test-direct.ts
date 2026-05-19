import pg from 'pg';

const urlLocal = 'postgresql://localhost:5432/bewell_db';

async function testUrl(name: string, connectionString: string) {
  console.log(`\nTesting: ${name}`);
  const client = new pg.Client({
    connectionString,
  });
  try {
    await client.connect();
    console.log(`SUCCESS connected to ${name}`);
    const res = await client.query('SELECT current_user, now()');
    console.log('Result:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error(`FAILED connected to ${name}:`, err);
  }
}

async function main() {
  await testUrl('Local PostgreSQL', urlLocal);
}

main();


