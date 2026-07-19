/**
 * Hash Password Script
 * Generates secure hash for super admin password
 * Usage: node scripts/hash-password.js yourPassword
 */

const crypto = require('crypto');

function generateSalt(length = 16) {
  return crypto.randomBytes(length).toString('hex');
}

function hashPassword(password, salt) {
  const iterations = 100000;
  const keylen = 32;
  const digest = 'sha256';
  
  const hash = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest);
  return hash.toString('hex');
}

const password = process.argv[2];

if (!password) {
  console.log('Usage: node scripts/hash-password.js <password>');
  console.log('Example: node scripts/hash-password.js MySecurePassword123!');
  process.exit(1);
}

if (password.length < 8) {
  console.error('Password must be at least 8 characters');
  process.exit(1);
}

const salt = generateSalt();
const hash = hashPassword(password, salt);

console.log('\n=== Secure Password Hash Generated ===\n');
console.log(`Password: ${password}`);
console.log(`Salt: ${salt}`);
console.log(`Hash: ${hash}`);
console.log('\nAdd to your .env.local:');
console.log(`VITE_SUPER_ADMIN_EMAIL=admin@tharwah.com`);
console.log(`VITE_SUPER_ADMIN_PASSWORD_HASH=${hash}`);
console.log(`VITE_SUPER_ADMIN_SALT=${salt}`);
console.log('\n⚠️  Keep these values secure and never commit to Git!\n');
