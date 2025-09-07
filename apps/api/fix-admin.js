const bcrypt = require('bcrypt');

async function fixAdmin() {
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 12);
  console.log('New hash for admin123:', hash);
  
  // You'll need to run this SQL command with the output
  console.log(`UPDATE users SET password_hash = '${hash}' WHERE email = 'admin@platform.local';`);
}

fixAdmin();
