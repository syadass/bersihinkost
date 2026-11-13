import prisma from '@/lib/prisma'
import { orderUpdateSchema, accRescheduleSchema, cancelSchema } from '@/lib/validations'
import { combineDateTime } from '@/lib/date'
import { attachDisplayNumbers, displayOrderNumber } from '@/lib/order-number'

function fmtDateWIB(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB'
}

function normalizeWa(num) {
  const n = String(num || '').replace(/[^0-9]/g, '')
  if (!n) return ''
  return n.startsWith('0') ? '62' + n.slice(1) : n
}

function waToCustomer(customerWa, lines) {
  const num = normalizeWa(customerWa)
  if (!num) return null
  return `https://wa.me/${num}?text=${encodeURIComponent(lines.join('\n'))}`
}

async function sendFonnteMessage(target, message) {
  const token = process.env.FONNTE_TOKEN
  const to = normalizeWa(target)
  if (!token || !to || !message) return { sent: false }
  try {
    const res = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { Authorization: token },
      body: new URLSearchParams({ target: to, message }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || data?.status === false) {
      console.error('Fonnte send failed:', data)
      return { sent: false, detail: data }
    }
    return { sent: true, detail: data }
  } catch (e) {
    console.error('Fonnte send error:', e)
    return { sent: false }
  }
}

export async function GET(req, { params }) {
  const order = await prisma.order.findUnique({
    where: { id: Number(params.id) },
    include: { items: { include: { service: true } } },
  })
  if (!order) {
    return Response.json({ message: 'Pesanan tidak ditemukan.' }, { status: 404 })
  }
  const [enriched] = await attachDisplayNumbers([order], prisma)
  return Response.json({ order: enriched || order })
}

export async function PUT(req, { params }) {
  try {
    const body = await req.json()
    const data = orderUpdateSchema.parse(body)

    const order = await prisma.order.findUnique({ where: { id: Number(params.id) } })
    if (!order) {
      return Response.json({ message: 'Pesanan tidak ditemukan.' }, { status: 404 })
    }
    if (order.status === 'cancelled' || order.status === 'completed') {
      return Response.json({ message: 'Pesanan yang sudah selesai/batal tidak bisa diubah.' }, { status: 422 })
    }

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

    const tanggalUsulan = combineDateTime(data.tanggal_usulan, data.jam_usulan)

    await prisma.order.update({
      where: { id: Number(params.id) },
      data: {
        customer_name: data.customer_name,
        ...(data.customer_wa !== undefined ? { customer_wa: String(data.customer_wa || '') } : {}),
        alamat: data.alamat,
        tanggal_usulan: new Date(tanggalUsulan),
        catatan_admin: data.catatan_admin ?? null,
        total_harga: total,
        estimasi_menit: estimasi,
      },
    })

    // Hapus item lama, buat baru
    await prisma.orderItem.deleteMany({ where: { order_id: Number(params.id) } })
    await prisma.orderItem.createMany({
      data: items.map((r) => ({
        order_id: Number(params.id),
        service_id: r.service.id,
        service_name: r.service.name,
        qty: r.qty,
        harga_satuan: r.service.price,
        subtotal: r.sub,
      })),
    })

    return Response.json({ ok: true, message: 'Pesanan berhasil diubah.' })
  } catch (err) {
    return Response.json({ message: err.message || 'Gagal mengubah pesanan.' }, { status: 400 })
  }
}

export async function PATCH(req, { params }) {
  try {
    const body = await req.json()
    const order = await prisma.order.findUnique({ where: { id: Number(params.id) }, include: { items: true } })
    if (!order) {
      return Response.json({ message: 'Pesanan tidak ditemukan.' }, { status: 404 })
    }
    if (order.status === 'cancelled' || order.status === 'completed') {
      return Response.json({ message: 'Pesanan yang sudah selesai/batal tidak bisa diubah.' }, { status: 422 })
    }

    const setting = await prisma.setting.findUnique({ where: { id: 1 } })
    const business = setting?.business_name || 'Bersihinkost'

    // ACC
    if (body.tanggal_fix && body.jam_fix && body.action === 'acc') {
      const data = accRescheduleSchema.parse(body)
      const tanggalFix = combineDateTime(data.tanggal_fix, data.jam_fix)
      await prisma.order.update({
        where: { id: Number(params.id) },
        data: {
          tanggal_fix: new Date(tanggalFix),
          status: 'confirmed',
          alasan_batal: null,
        },
      })
      const code = await displayOrderNumber(order, prisma)
      return Response.json({
        ok: true,
        message: `Pesanan ${code} di-ACC untuk ${data.tanggal_fix} pukul ${data.jam_fix}.`,
        customer_notified: true,
      })
    }

    // Ajukan perubahan jadwal (tanpa set tanggal/jam baru, minta customer usulkan jadwal)
    if (body.action === 'ajukan_perubahan_jadwal') {
      const keterangan = typeof body.keterangan === 'string' ? body.keterangan.trim() : ''
      await prisma.order.update({
        where: { id: Number(params.id) },
        data: {
          status: 'rescheduled',
          alasan_batal: null,
          ...(keterangan ? { catatan_admin: keterangan } : {}),
        },
      })
      const code = await displayOrderNumber(order, prisma)
      const jadwalSaatIni = fmtDateWIB(order.tanggal_fix || order.tanggal_usulan)
      const lines = [
        `Halo Kak ${order.customer_name},`,
        `Terkait pesanan ${code} di *${business}* (jadwal saat ini: ${jadwalSaatIni}), kami ingin mengajukan perubahan jadwal.`,
        ...(keterangan ? [`Keterangan: ${keterangan}`] : []),
        '',
        'Mohon balas pesan ini dengan usulan tanggal dan jam baru yang Anda inginkan. Terima kasih.',
      ]
      return Response.json({
        ok: true,
        message: `Permintaan perubahan jadwal untuk pesanan ${code} diajukan.`,
        customer_wa_link: waToCustomer(order.customer_wa, lines),
        customer_notified: false,
      })
    }

    // Batalkan pesanan (fix batal, tanpa direct WA, alasan opsional)
    if (body.alasan_batal !== undefined || body.action === 'cancel') {
      const parsed = cancelSchema.safeParse(body || {})
      const alasan = parsed.success ? (parsed.data.alasan_batal || '').trim() : ''
      await prisma.order.update({
        where: { id: Number(params.id) },
        data: { status: 'cancelled', alasan_batal: alasan || null },
      })
      const code = await displayOrderNumber(order, prisma)
      return Response.json({
        ok: true,
        message: `Pesanan ${code} dibatalkan.`,
        customer_notified: true,
      })
    }

    if (body.status === 'completed' || body.action === 'complete') {
      if (order.status !== 'confirmed') {
        return Response.json({ message: 'Pesanan harus berstatus ACC/terkonfirmasi sebelum diselesaikan.' }, { status: 422 })
      }
      const proof = typeof body.payment_proof_url === 'string' ? body.payment_proof_url : (typeof body.bukti_pembayaran === 'string' ? body.bukti_pembayaran : '')
      const payment_status = typeof body.payment_status === 'string' ? body.payment_status : null
      const payment_method = typeof body.payment_method === 'string' ? body.payment_method : null
      const methodIsTf = (payment_method || '').toLowerCase() === 'transfer'
      await prisma.order.update({
        where: { id: Number(params.id) },
        data: {
          status: 'completed',
          ...(payment_status ? { payment_status } : {}),
          ...(payment_method ? { payment_method } : {}),
          ...(proof && methodIsTf ? { payment_proof_url: proof } : {}),
        },
      })
      const code = await displayOrderNumber(order, prisma)
      return Response.json({ ok: true, message: `Pesanan ${code} selesai.` })
    }

    return Response.json({ message: 'Aksi tidak dikenal.' }, { status: 400 })
  } catch (err) {
    return Response.json({ message: err.message || 'Gagal memproses aksi.' }, { status: 400 })
  }
}

export async function DELETE(req, { params }) {
  const order = await prisma.order.findUnique({ where: { id: Number(params.id) } })
  if (!order) {
    return Response.json({ message: 'Pesanan tidak ditemukan.' }, { status: 404 })
  }
  if (order.status !== 'cancelled') {
    return Response.json({ message: 'Hanya riwayat batal yang bisa dihapus.' }, { status: 422 })
  }
  await prisma.order.delete({ where: { id: Number(params.id) } })
  return Response.json({ ok: true, message: `Riwayat order #${params.id} dihapus.` })
}
