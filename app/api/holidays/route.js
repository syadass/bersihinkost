import prisma from '@/lib/prisma'
import { holidaySchema } from '@/lib/validations'
import { toDateString } from '@/lib/date'

export async function POST(req) {
  try {
    const body = await req.json()
    const data = holidaySchema.parse(body)
    const tanggal = toDateString(data.tanggal)

    const existing = await prisma.closureDate.findUnique({ where: { tanggal: new Date(tanggal + 'T00:00:00Z') } })
    if (existing) {
      return Response.json({ message: 'Tanggal tersebut sudah terdaftar sebagai libur.' }, { status: 422 })
    }

    await prisma.closureDate.create({
      data: { tanggal: new Date(tanggal + 'T00:00:00Z'), keterangan: data.keterangan ?? null },
    })
    return Response.json({ ok: true, message: 'Tanggal libur ditambahkan. Pemesan tidak bisa memilih tanggal tersebut.' }, { status: 201 })
  } catch (err) {
    return Response.json({ message: err.message || 'Gagal menambahkan tanggal libur.' }, { status: 400 })
  }
}

export async function GET() {
  const dates = await prisma.closureDate.findMany({ orderBy: { tanggal: 'asc' } })
  return Response.json({ dates: dates.map((d) => ({ id: d.id, tanggal: toDateString(d.tanggal), keterangan: d.keterangan })) })
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url)
    const id = Number(searchParams.get('id'))
    if (!id) {
      return Response.json({ message: 'ID libur wajib diisi.' }, { status: 400 })
    }
    await prisma.closureDate.delete({ where: { id } })
    return Response.json({ ok: true, message: 'Tanggal libur dihapus.' })
  } catch (err) {
    return Response.json({ message: err.message || 'Gagal menghapus tanggal libur.' }, { status: 400 })
  }
}
