import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Password default untuk admin: "password"
  const passwordHash = await bcrypt.hash('password', 10)

  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Administrator',
      email: 'admin@example.com',
      password: passwordHash,
    },
  })

  await prisma.setting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      admin_wa_number: '6281234567890',
      operator_name: 'Syada Saleha',
      is_open: true,
      business_name: 'Bersihinkost',
      jam_mulai: '08:00',
      jam_selesai: '17:00',
      catatan_publik: 'Pemesanan untuk hari yang sama harap konfirmasi 2 jam sebelumnya.',
    },
  })

  const kategoriList = ['Kamar Tidur', 'Kamar Mandi', 'Ruang Tamu', 'Dapur', 'Seluruh Rumah']
  for (const nama of kategoriList) {
    await prisma.category.upsert({
      where: { name: nama },
      update: {},
      create: { name: nama },
    })
  }

  const services = [
    { name: 'Membersihkan Kamar Tidur', category: 'Kamar Tidur', price: 150000, duration_minutes: 60 },
    { name: 'Membersihkan Kamar Mandi', category: 'Kamar Mandi', price: 120000, duration_minutes: 45 },
    { name: 'Membersihkan Ruang Tamu', category: 'Ruang Tamu', price: 100000, duration_minutes: 50 },
    { name: 'Membersihkan Dapur', category: 'Dapur', price: 130000, duration_minutes: 55 },
    { name: 'Paket Seluruh Rumah', category: 'Seluruh Rumah', price: 400000, duration_minutes: 180 },
  ]

  for (const svc of services) {
    await prisma.service.create({
      data: {
        name: svc.name,
        category: svc.category,
        price: svc.price,
        duration_minutes: svc.duration_minutes,
        is_active: true,
      },
    })
  }

  console.log('Seed selesai. Admin:', user.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
