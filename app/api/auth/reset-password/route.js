import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { resetPasswordSchema } from '@/lib/validations'

export async function POST(req) {
  try {
    const body = await req.json()
    const { token, email, password } = resetPasswordSchema.parse(body)

    const reset = await prisma.passwordResetToken.findFirst({
      where: { email, token },
      orderBy: { created_at: 'desc' },
    })
    if (!reset) {
      return Response.json({ message: 'Token reset tidak valid.' }, { status: 400 })
    }

    // Token berlaku 60 menit (mirip Laravel asli)
    const expired = Date.now() - new Date(reset.created_at).getTime() > 60 * 60 * 1000
    if (expired) {
      return Response.json({ message: 'Token reset sudah kedaluwarsa.' }, { status: 400 })
    }

    const hash = await bcrypt.hash(password, 10)
    await prisma.user.update({
      where: { email },
      data: { password: hash },
    })
    await prisma.passwordResetToken.delete({ where: { id: reset.id } })

    return Response.json({ ok: true, message: 'Kata sandi berhasil diganti.' })
  } catch (err) {
    return Response.json({ message: 'Gagal mengganti kata sandi.' }, { status: 400 })
  }
}
