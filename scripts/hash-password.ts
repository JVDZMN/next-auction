import bcrypt from 'bcryptjs'

const password = process.argv[2] || 'password123'

async function hashPassword() {
  const hashed = await bcrypt.hash(password, 12)
  console.log('\n===================')
  console.log('Original Password:', password)
  console.log('Hashed Password:', hashed)
  console.log('===================\n')
}

hashPassword()
