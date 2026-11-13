import prisma from '@/lib/prisma'
import { categorySchema, renameCategorySchema, deleteCategorySchema } from '@/lib/validations'

export async function GET(req) {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  })
  // Hitung jumlah layanan per kategori (category disimpan sebagai string di Service)
  const counts = await prisma.service.groupBy({
    by: ['category'],
    _count: { category: true },
  })
  const countMap = Object.fromEntries(counts.map((c) => [c.category, c._count.category]))
  const categoriesWithCount = categories.map((c) => ({ ...c, service_count: countMap[c.name] || 0 }))
  return Response.json({ categories: categoriesWithCount })
}

export async function POST(req) {
  try {
    const body = await req.json()
    const data = categorySchema.parse(body)
    await prisma.category.create({ data: { name: data.name } })
    return Response.json({ ok: true, message: `Kategori "${data.name}" ditambahkan.` }, { status: 201 })
  } catch (err) {
    return Response.json({ message: err.message || 'Gagal menambahkan kategori.' }, { status: 400 })
  }
}

export async function PUT(req) {
  try {
    const body = await req.json()
    const { old, new: newName } = renameCategorySchema.parse(body)
    await prisma.$transaction([
      prisma.category.update({ where: { name: old }, data: { name: newName } }),
      prisma.service.updateMany({ where: { category: old }, data: { category: newName } }),
    ])
    return Response.json({ ok: true, message: `Kategori "${old}" diubah menjadi "${newName}".` })
  } catch (err) {
    return Response.json({ message: err.message || 'Gagal mengubah nama kategori.' }, { status: 400 })
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category') || ''
    const data = deleteCategorySchema.parse({ category })

    const used = await prisma.service.findFirst({ where: { category: data.category } })
    if (used) {
      return Response.json(
        { message: `Kategori "${data.category}" sedang digunakan layanan. Ubah atau hapus layanannya terlebih dahulu.` },
        { status: 422 }
      )
    }
    await prisma.category.delete({ where: { name: data.category } })
    return Response.json({ ok: true, message: `Kategori "${data.category}" dihapus.` })
  } catch (err) {
    return Response.json({ message: err.message || 'Gagal menghapus kategori.' }, { status: 400 })
  }
}
