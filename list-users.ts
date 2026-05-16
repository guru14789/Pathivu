import * as dotenv from 'dotenv';
dotenv.config({ path: 'apps/api/.env.development' });
import { db } from './apps/api/src/db/index.js';
import { users } from './apps/api/src/db/schema/index.js';

async function listUsers() {
  try {
    const allUsers = await db.select().from(users);
    console.log('Users:', allUsers.map(u => ({ email: u.email, role: u.role })));
  } catch (err) {
    console.error('Error listing users:', err);
  }
  process.exit(0);
}
listUsers();
