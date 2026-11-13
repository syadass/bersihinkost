import jwt from 'jsonwebtoken'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { setAuthCookie } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'

export async function POST(req) {
  try {
    const body = await req.json()
    const data = loginSchema.parse(body)

    const user = await prisma.user.findUnique({ where: { email: data.email } })
    if (!user || !(await bcrypt.compare(data.password, user.password))) {
      return NextResponse.json({ message: 'Email atau password salah.' }, { status: 401 })
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET || 'default-secret-change-me',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } })
    setAuthCookie(res, token)
    return res
  } catch (err) {
    return NextResponse.json({ message: 'Gagal masuk: ' + (err?.message ?? String(err)) }, { status: 400 })
  }
}
