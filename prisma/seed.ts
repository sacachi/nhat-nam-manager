import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const existingAdmin = await prisma.user.findUnique({
    where: { username: 'admin' }
  })

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('123456', 10)
    await prisma.user.create({
      data: {
        name: 'Quản trị viên',
        username: 'admin',
        email: 'admin@nhatnam.vn',
        password: hashedPassword,
        role: 'Admin',
        status: 'active'
      }
    })
    console.log('Tạo tài khoản Admin thành công: admin / 123456')
  } else {
    const hashedPassword = await bcrypt.hash('123456', 10)
    await prisma.user.update({
      where: { username: 'admin' },
      data: { password: hashedPassword }
    })
    console.log('Update mật khẩu Admin thành công: admin / 123456')
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
