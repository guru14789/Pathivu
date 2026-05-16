import bcrypt from 'bcryptjs';

async function hash() {
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash('password123', salt);
  console.log(hash);
}

hash();
