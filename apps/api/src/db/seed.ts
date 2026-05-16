import { db } from './index.js';
import { hospitals, users } from './schema/index.js';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Seeding database...');

  // Create a default hospital
  const [hospital] = await db.insert(hospitals).values({
    name: 'BeWell Main Hospital',
    code: 'BMH',
    city: 'Chennai',
    address: '123 Hospital Road, Chennai',
  }).returning();

  console.log('Created Hospital:', hospital.name);

  // Create an admin user
  const passwordHash = await bcrypt.hash('password123', 12);
  const [admin] = await db.insert(users).values({
    hospital_id: hospital.hospital_id,
    full_name: 'Super Admin',
    email: 'admin@bewell.in',
    password_hash: passwordHash,
    role: 'super_admin',
  }).returning();

  console.log('Created Admin User:', admin.email);

  console.log('Seeding complete!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
