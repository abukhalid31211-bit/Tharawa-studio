import bcrypt from 'bcryptjs';

async function main() {
  const password = process.argv[2];
  if (!password) {
    console.error('Usage: npm run hash-password -- "your-password"');
    process.exit(1);
  }

  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(password, salt);

  console.log('\n=== Password Hash ===');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nUse in your .env file:');
  console.log(`SUPER_ADMIN_PASSWORD_HASH=${hash}`);
  console.log(`SUPER_ADMIN_SALT=${salt}`);
  console.log('\nOr store this hash in users.password_hash in database.\n');
}

main().catch(console.error);
