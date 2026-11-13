import fs from 'fs/promises'
import path from 'path'
import prisma from '@/lib/prisma'
import { serviceSchema } from '@/lib/validations'

export async function PUT(req, { params }) {
  try {
    const form = await req.formData()
    const raw = {
      name: form.get('name') || '',
      category: form.get('category') || '',
      price: form.get('price') || 0,
      duration_minutes: form.get('duration_minutes') || 30,
      image_url: form.get('image_url') || '',
      hapus_gambar: form.get('hapus_gambar') === 'on' || form.get('hapus_gambar') === 'true',
      is_active: form.get('is_active') === 'on' || form.get('is_active') === 'true',
    }
    const data = serviceSchema.parse(raw)

    const service = await prisma.service.findUnique({ where: { id: Number(params.id) } })
    if (!service) {
      return Response.json({ message: 'Layanan tidak ditemukan.' }, { status: 404 })
    }

    let newImage = data.image_url || null
    const file = form.get('image_file')
    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase()
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`
      const dir = path.join(process.cwd(), 'public', 'uploads', 'services')
      await fs.mkdir(dir, { recursive: true })
      await fs.writeFile(path.join(dir, fileName), buffer)
      newImage = `/uploads/services/${fileName}`
    }

    // Hapus gambar lama jika ada gambar baru atau dicentang hapus
    if (newImage || data.hapus_gambar) {
      await deleteLocalImage(service)
    }

    await prisma.service.update({
      where: { id: Number(params.id) },
      data: {
        name: data.name,
        category: data.category,
        price: data.price,
        duration_minutes: data.duration_minutes,
        image_url: newImage,
        is_active: data.is_active,
      },
    })

    return Response.json({ ok: true, message: 'Layanan diperbarui.' })
  } catch (err) {
    return Response.json({ message: err.message || 'Gagal memperbarui layanan.' }, { status: 400 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const service = await prisma.service.findUnique({
      where: { id: Number(params.id) },
      include: { order_items: true },
    })
    if (!service) {
      return Response.json({ message: 'Layanan tidak ditemukan.' }, { status: 404 })
    }

    if (service.order_items.length > 0) {
      await prisma.service.update({
        where: { id: Number(params.id) },
        data: { is_active: false },
      })
      await deleteLocalImage(service)
      return Response.json({ ok: true, message: 'Layanan pernah dipesan, jadi dinonaktifkan (tidak dihapus).' })
    }

    await deleteLocalImage(service)
    await prisma.service.delete({ where: { id: Number(params.id) } })
    return Response.json({ ok: true, message: 'Layanan dihapus.' })
  } catch (err) {
    return Response.json({ message: err.message || 'Gagal menghapus layanan.' }, { status: 400 })
  }
}

async function deleteLocalImage(service) {
  if (!service.image_url) return
  if (service.image_url.startsWith('http://') || service.image_url.startsWith('https://')) return
  try {
    const fs = await import('fs/promises')
    await fs.unlink(path.join(process.cwd(), 'public', service.image_url))
  } catch (err) {
    // File mungkin sudah tidak ada, abaikan
  }
}
