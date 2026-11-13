import { randomBytes } from 'crypto'
import prisma from '@/lib/prisma'
import { forgotPasswordSchema } from '@/lib/validations'

export async function POST(req) {
  try {
    const body = await req.json()
    const { email } = forgotPasswordSchema.parse(body)

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      // Tidak membedakan apakah email terdaftar (keamanan)
      return Response.json({ ok: true, message: 'Jika email terdaftar, tautan reset akan dikirim.' })
    }

    const token = randomBytes(32).toString('hex')
    await prisma.passwordResetToken.create({
      data: { email, token },
    })

    // Catatan: asli menggunakan email. Di sini kami menyimpan token ke DB.
    // Pengembang dapat menambahkan pengiriman email/SMS sesuai kebutuhan.
    return Response.json({
      ok: true,
      message: 'Token reset dibuat.',
      // Debug only (hapus saat production): token
    })
  } catch (err) {
    return Response.json({ message: 'Gagal memproses permintaan reset.' }, { status: 400 })
  }
}
