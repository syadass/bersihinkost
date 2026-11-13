import prisma from '@/lib/prisma'
import { manualOrderSchema } from '@/lib/validations'
import { combineDateTime } from '@/lib/date'

export async function POST(req) {
  try {
    const body = await req.json()
    const data = manualOrderSchema.parse(body)

    const items = []
    let total = 0
    let estimasi = 0
    for (const it of data.items) {
      const svc = await prisma.service.findUnique({ where: { id: Number(it.service_id) } })
      if (!svc) {
        return Response.json({ message: `Layanan ${it.service_id} tidak ditemukan.` }, { status: 422 })
      }
      const sub = svc.price * it.qty
      total += sub
      estimasi += svc.duration_minutes * it.qty
      items.push({ service: svc, qty: it.qty, sub })
    }

    const tanggal = combineDateTime(data.tanggal_fix, data.jam_fix)

    const order = await prisma.order.create({
      data: {
        customer_name: data.customer_name,
        customer_wa: data.customer_wa || '',
        alamat: data.alamat,
        tanggal_usulan: new Date(tanggal),
        tanggal_fix: new Date(tanggal),
        total_harga: total,
        estimasi_menit: estimasi,
        status: 'confirmed',
        items: {
          create: items.map((r) => ({
            service_id: r.service.id,
            service_name: r.service.name,
            qty: r.qty,
            harga_satuan: r.service.price,
            subtotal: r.sub,
          })),
        },
      },
      include: { items: true },
    })

    return Response.json({ order_id: order.id }, { status: 201 })
  } catch (err) {
    return Response.json({ message: err.message || 'Gagal membuat pesanan manual.' }, { status: 400 })
  }
}
