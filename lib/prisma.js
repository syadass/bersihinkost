import { PrismaClient } from '@prisma/client'

// Hindari banyak instance Prisma Client saat hot-reload di development
const prisma = globalThis.__prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalThis.__prisma = prisma

export default prisma
