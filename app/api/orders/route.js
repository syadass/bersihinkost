import prisma from '@/lib/prisma'
import { orderSchema } from '@/lib/validations'
import { toDateString } from '@/lib/date'
import { attachDisplayNumbers, displayOrderNumber } from '@/lib/order-number'

const TAB_MAP = {
  'menunggu-acc': ['pending', 'rescheduled'],
  terjadwal: ['confirmed'],
  selesai: ['completed'],
  batal: ['cancelled'],
  menunggu: ['pending', 'rescheduled'],
  proses: ['confirmed'],
}

const ALLOWED_SORTS = [
  'terbaru', 'terlama', 'id_asc', 'id_desc', 'nama_asc', 'nama_desc',
  'usulan_asc', 'usulan_desc', 'fix_asc', 'fix_desc',
]

function monthRange(year, month) {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0))
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
  return { start, end }
}

function yearRange(year) {
  const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0))
  const end = new Date(Date.UTC(year + 1, 0, 0, 23, 59, 59, 999))
  return { start, end }
}

function dayStartEnd(dateStr, endOfDay = false) {
  if (!dateStr) return null
  const d = new Date(`${dateStr}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}`)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Tambahkan filter periode pada where.
   Prioritas: from/to (rentang tanggal). Fallback: bulan/tahun (kompatibilitas).
   Logika: tanggal_fix ?? tanggal_usulan. */
function applyPeriode(where, bulan, tahun, from, to) {
  const and = []
  const start = dayStartEnd(from, false)
  const end = dayStartEnd(to, true)

  if (start || end) {
    const range = {}
    if (start) range.gte = start
    if (end) range.lte = end
    and.push({
      OR: [
        { tanggal_fix: { not: null, ...range } },
        { tanggal_fix: null, tanggal_usulan: range },
      ],
    })
  } else {
    const hasBulan = bulan !== 'all' && !Number.isNaN(Number(bulan))
    const hasTahun = tahun !== 'all' && !Number.isNaN(Number(tahun))

    if (hasBulan && hasTahun) {
      const { start: s, end: e } = monthRange(Number(tahun), Number(bulan))
      and.push({
        OR: [
          { tanggal_fix: { not: null, gte: s, lte: e } },
          { tanggal_fix: null, tanggal_usulan: { gte: s, lte: e } },
        ],
      })
    } else if (hasBulan) {
      const year = new Date().getFullYear()
      const { start: s, end: e } = monthRange(year, Number(bulan))
      and.push({
        OR: [
          { tanggal_fix: { not: null, gte: s, lte: e } },
          { tanggal_fix: null, tanggal_usulan: { gte: s, lte: e } },
        ],
      })
    } else if (hasTahun) {
      const { start: s, end: e } = yearRange(Number(tahun))
      and.push({
        OR: [
          { tanggal_fix: { not: null, gte: s, lte: e } },
          { tanggal_fix: null, tanggal_usulan: { gte: s, lte: e } },
        ],
      })
    }
  }

  if (and.length) {
    where.AND = and
  }
  return where
}

function getOrderBy(sort) {
  switch (sort) {
    case 'terlama': return { created_at: 'asc' }
    case 'id_asc': return { id: 'asc' }
    case 'id_desc': return { id: 'desc' }
    case 'nama_asc': return { customer_name: 'asc' }
    case 'nama_desc': return { customer_name: 'desc' }
    case 'usulan_asc': return [{ tanggal_usulan: 'asc' }, { id: 'asc' }]
    case 'usulan_desc': return [{ tanggal_usulan: 'desc' }, { id: 'desc' }]
    case 'fix_asc': return [{ tanggal_fix: 'asc' }, { id: 'asc' }]
    case 'fix_desc': return [{ tanggal_fix: 'desc' }, { id: 'desc' }]
    default: return { created_at: 'desc' }
  }
}

async function getCounts() {
  const [all, menungguAcc, terjadwal, selesai, batal] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: ['pending', 'rescheduled'] } } }),
    prisma.order.count({ where: { status: 'confirmed' } }),
    prisma.order.count({ where: { status: 'completed' } }),
    prisma.order.count({ where: { status: 'cancelled' } }),
  ])
  return {
    all,
    'menunggu-acc': menungguAcc,
    terjadwal,
    selesai,
    batal,
  }
}

async function getOrderYears() {
  try {
    const rows = await prisma.$queryRaw`
      SELECT DISTINCT EXTRACT(YEAR FROM COALESCE("tanggal_fix", "tanggal_usulan"))::int AS year
      FROM "Order"
      WHERE COALESCE("tanggal_fix", "tanggal_usulan") IS NOT NULL
      ORDER BY year ASC
    `
    const years = (Array.isArray(rows) ? rows : [])
      .map((r) => String(r.year))
      .filter(Boolean)
    if (years.length === 0) years.push(String(new Date().getFullYear()))
    return years
  } catch {
    const fallbackYear = String(new Date().getFullYear())
    return [fallbackYear]
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    let tab = searchParams.get('tab') || 'all'
    let sort = searchParams.get('sort') || 'terbaru'
    const search = searchParams.get('search') || ''
    const bulan = searchParams.get('bulan') || 'all'
    const tahun = searchParams.get('tahun') || 'all'
    const from = searchParams.get('from') || ''
    const to = searchParams.get('to') || ''
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
    const perPageRaw = parseInt(searchParams.get('perPage') || '5', 10)
    const perPage = Math.min(Math.max(Number.isFinite(perPageRaw) ? perPageRaw : 5, 1), 200)
    const skipMeta = searchParams.get('skipMeta') === '1'

    if (!ALLOWED_SORTS.includes(sort)) sort = 'terbaru'
    if (!TAB_MAP[tab] && tab !== 'all') tab = 'all'

    let where = {}
    if (TAB_MAP[tab]) {
      where.status = { in: TAB_MAP[tab] }
    }
    if (search) {
      where.OR = [
        { customer_name: { contains: search, mode: 'insensitive' } },
        { alamat: { contains: search, mode: 'insensitive' } },
      ]
    }
    where = applyPeriode(where, bulan, tahun, from, to)

    const listQuery = prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: getOrderBy(sort),
      skip: (page - 1) * perPage,
      take: perPage,
    })
    const countQuery = prisma.order.count({ where })

    const [orders, total, counts, years] = skipMeta
      ? [...await Promise.all([listQuery, countQuery]), null, []]
      : await Promise.all([listQuery, countQuery, getCounts(), getOrderYears()])

    const ordersWithNumbers = await attachDisplayNumbers(orders, prisma)

    return Response.json({
      orders: ordersWithNumbers,
      counts,
      tab,
      sort,
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
      years,
      fBulan: bulan,
      fTahun: tahun,
      from,
      to,
    })
  } catch (err) {
    console.error('GET /api/orders error:', err)
    return Response.json({ message: err?.message || 'Gagal memuat pesanan.' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const data = orderSchema.parse(body)

    const items = []
    let total = 0
    let estimasi = 0
    for (const it of data.items) {
      const svc = await prisma.service.findUnique({ where: { id: Number(it.service_id) } })
      if (!svc) {
        return Response.json({ message: `Layanan ${it.service_id} tidak ditemukan.` }, { status: 422 })
      }
      if (!svc.is_active) {
        return Response.json({ message: `Layanan ${svc.name} sedang nonaktif.` }, { status: 422 })
      }
      const sub = svc.price * it.qty
      total += sub
      estimasi += svc.duration_minutes * it.qty
      items.push({ service: svc, qty: it.qty, sub })
    }

    const tanggalUsulan = data.tanggal_usulan + 'T' + data.jam_usulan + ':00'

    const order = await prisma.order.create({
      data: {
        customer_name: data.customer_name,
        customer_wa: data.customer_wa || '',
        alamat: data.alamat,
        tanggal_usulan: new Date(tanggalUsulan),
        total_harga: total,
        estimasi_menit: estimasi,
        status: 'pending',
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

    const displayNo = await displayOrderNumber(order, prisma)
    const orderForMsg = { ...order, order_number: displayNo }
    const setting = await prisma.setting.findUnique({ where: { id: 1 } })
    const adminNotifyWaLink = composeAdminNotifyWaLink(orderForMsg, setting)

    return Response.json({
      order_id: order.id,
      order_number: displayNo,
      admin_notify_wa_link: adminNotifyWaLink,
      success_url: `/orders/sukses/${order.id}`,
    }, { status: 201 })
  } catch (err) {
    return Response.json({ message: err.message || 'Gagal membuat pesanan.' }, { status: 400 })
  }
}

function composeAdminNotifyMessage(order, setting) {
  const lines = []
  lines.push(`*Pesanan Baru Masuk* ${displayOrderNumber(order)}`)
  lines.push(`Nama: ${order.customer_name}`)
  lines.push(`WA Customer: ${order.customer_wa || '-'}`)
  lines.push(`Alamat: ${order.alamat}`)
  lines.push(`Tanggal Usulan: ${formatDateWIB(order.tanggal_usulan)} WIB`)
  lines.push('')
  lines.push('*Detail Layanan:*')
  for (const item of (order.items || [])) {
    lines.push(`- ${item.service_name} (${item.qty}x) - Rp${Number(item.subtotal).toLocaleString('id-ID')}`)
  }
  lines.push('')
  lines.push(`*Total:* Rp${Number(order.total_harga).toLocaleString('id-ID')}`)
  lines.push(`Estimasi: ${order.estimasi_menit} Menit`)
  lines.push('')
  lines.push('Silakan cek dashboard untuk ACC/tolak dan hubungi customer.')
  return lines.join('\n')
}

function composeAdminNotifyWaLink(order, setting) {
  const text = encodeURIComponent(composeAdminNotifyMessage(order, setting))
  const adminWa = (setting?.admin_wa_number || process.env.FONNTE_TARGET || '').replace(/[^0-9]/g, '')
  return `https://wa.me/${adminWa}?text=${text}`
}

function formatDateWIB(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
  })
}
