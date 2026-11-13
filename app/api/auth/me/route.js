import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req) {
  const token = getTokenFromCookies(req.headers.get('cookie'))
  const payload = verifyToken(token)
  if (!payload) {
    return Response.json({ user: null }, { status: 401 })
  }
  const user = await prisma.user.findUnique({
    where: { id: Number(payload.sub) },
    select: { id: true, name: true, email: true },
  })
  if (!user) return Response.json({ user: null }, { status: 401 })
  return Response.json({ user })
}
