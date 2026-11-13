import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { profilSchema, operasionalSchema, accountSchema } from '@/lib/validations'

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({ where: { id: 1 } })
    return Response.json({ setting })
  } catch (err) {
    console.error('GET /api/settings error:', err)
    return Response.json({ message: err?.message || 'Gagal memuat pengaturan.' }, { status: 500 })
  }
}

async function handleUpdate(req) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action') || 'profil'

    if (action === 'profil') {
      const body = await req.json()
      const data = profilSchema.parse(body)
      data.admin_wa_number = data.admin_wa_number.replace(/\D/g, '')
      await prisma.setting.update({
        where: { id: 1 },
        data: {
          business_name: data.business_name,
          operator_name: data.operator_name,
          admin_wa_number: data.admin_wa_number,
        },
      })
      return Response.json({ ok: true, message: 'Profil usaha disimpan.' })
    }

    if (action === 'operasional') {
      const body = await req.json()
      const data = operasionalSchema.parse(body)
      await prisma.setting.update({
        where: { id: 1 },
        data: {
          is_open: data.is_open,
          jam_mulai: data.jam_mulai,
          jam_selesai: data.jam_selesai,
          catatan_publik: data.catatan_publik ?? null,
        },
      })
      return Response.json({ ok: true, message: 'Jam operasional disimpan.' })
    }

    if (action === 'account') {
      const body = await req.json()
      const parsed = accountSchema.safeParse(body)
      if (!parsed.success) {
        const errors = {}
        for (const issue of parsed.error.issues || []) {
          const key = issue.path?.[0] || 'form'
          if (!errors[key]) errors[key] = []
          errors[key].push(issue.message)
        }
        return Response.json({ message: 'Data akun tidak valid.', errors }, { status: 422 })
      }
      const data = parsed.data
      const user = await prisma.user.findFirst({ orderBy: { id: 'asc' } })
      if (!user) {
        return Response.json({ message: 'User tidak ditemukan.' }, { status: 404 })
      }
      const updateData = {
        name: data.name,
        email: data.email,
      }
      if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10)
      }
      await prisma.user.update({ where: { id: user.id }, data: updateData })
      return Response.json({ ok: true, message: 'Akun login berhasil diperbarui.' })
    }

    return Response.json({ message: 'Aksi tidak dikenal.' }, { status: 400 })
  } catch (err) {
    console.error('UPDATE /api/settings error:', err)
    return Response.json({ message: err?.message || 'Gagal menyimpan pengaturan.' }, { status: 400 })
  }
}

export async function PUT(req) {
  return handleUpdate(req)
}

export async function POST(req) {
  return handleUpdate(req)
}
