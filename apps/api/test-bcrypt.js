const bcrypt = require('bcrypt');

async function testPassword() {
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 12);
  console.log('Generated hash:', hash);
  
  const dbHash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/BZs5YKK4N5z9XF.pq';
  console.log('Database hash:', dbHash);
  
  const isValid = await bcrypt.compare(password, dbHash);
  console.log('Password matches database hash:', isValid);
}

testPassword();
