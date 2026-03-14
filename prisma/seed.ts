import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const username = 'admin'
  const password = process.env.ADMIN_PASSWORD || '123456@Abc'

  const hashedPassword = await bcrypt.hash(password, 10)

  const admin = await prisma.user.upsert({
    where: { username },
    update: {
      password: hashedPassword
    },
    create: {
      name: 'Quản trị viên',
      username: username,
      email: 'admin@nhatnam.vn',
      password: hashedPassword,
      role: 'Admin',
      status: 'active'
    }
  })

  console.log('Admin account ready:')
  console.log(`username: ${admin.username}`)
  console.log(`password: ${password}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })