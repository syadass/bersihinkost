import prisma from '@/lib/prisma'
import { serviceSchema } from '@/lib/validations'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') || 'all'
  const search = searchParams.get('search') || ''

  let where = { is_active: true }
  if (category !== 'all') where.category = category
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ]
  }

  const services = await prisma.service.findMany({
    where,
    orderBy: { id: 'asc' },
    include: { _count: { select: { order_items: true } } },
  })

  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } })

  return Response.json({
    services,
    servicesData: services.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      price: s.price,
      duration_minutes: s.duration_minutes,
      image_url: s.image_url,
      is_active: s.is_active,
      used_count: s._count.order_items,
    })),
    categories,
    categoryNames: categories.map((c) => c.name),
    category,
    search,
  })
}

export async function POST(req) {
  try {
    const form = await req.formData()
    const raw = {
      name: form.get('name') || '',
      category: form.get('category') || '',
      price: form.get('price') || 0,
      duration_minutes: form.get('duration_minutes') || 30,
      image_url: form.get('image_url') || '',
      is_active: form.get('is_active') === 'on' || form.get('is_active') === 'true',
    }
    const data = serviceSchema.parse(raw)

    // Handle file upload (simpan ke public/uploads/services)
    let imageUrl = data.image_url || null
    const file = form.get('image_file')
    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const ext = file.name.split('.').pop()
      const fileName = `services/${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`
      const fs = await import('fs/promises')
      const path = await import('path')
      const dir = path.join(process.cwd(), 'public', 'uploads', 'services')
      await fs.mkdir(dir, { recursive: true })
      await fs.writeFile(path.join(dir, fileName), buffer)
      imageUrl = `/uploads/services/${fileName}`
    }

    await prisma.service.create({
      data: {
        name: data.name,
        category: data.category,
        price: data.price,
        duration_minutes: data.duration_minutes,
        image_url: imageUrl,
        is_active: data.is_active,
      },
    })

    return Response.json({ ok: true, message: 'Layanan ditambahkan.' }, { status: 201 })
  } catch (err) {
    return Response.json({ message: err.message || 'Gagal menambahkan layanan.' }, { status: 400 })
  }
}
