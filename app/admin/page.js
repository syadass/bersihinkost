import AdminLayout from '@/components/layouts/admin'
import Dashboard, { DashboardRightPanel } from '@/components/admin/dashboard'
import prisma from '@/lib/prisma'
import { attachDisplayNumbers } from '@/lib/order-number'

export const dynamic = 'force-dynamic'

function startEndOfMonth(year, month1) {
  const start = new Date(Date.UTC(year, month1 - 1, 1, 0, 0, 0))
  const end = new Date(Date.UTC(year, month1, 0, 23, 59, 59, 999))
  return { start, end }
}

function inRange(d, start, end) {
  if (!d) return false
  const t = new Date(d).getTime()
  return t >= start.getTime() && t <= end.getTime()
}

function toYMD(d) {
  const x = new Date(d)
  return x.toISOString().slice(0, 10)
}

function buildWeeks(monthDate, orders) {
  // monthDate: Date for 1st of month (local-ish via UTC parts not critical; use year/month)
  const year = monthDate.getUTCFullYear()
  const monthIdx = monthDate.getUTCMonth()
  const first = new Date(Date.UTC(year, monthIdx, 1))
  const last = new Date(Date.UTC(year, monthIdx + 1, 0))
  // Monday-based week like typical ID calendars? Blade used weeks grid with Sen..Min headers.
  const dayOfWeekMon0 = (d) => (d.getUTCDay() + 6) % 7 // Mon=0..Sun=6
  const start = new Date(first)
  start.setUTCDate(first.getUTCDate() - dayOfWeekMon0(first))
  const end = new Date(last)
  end.setUTCDate(last.getUTCDate() + (6 - dayOfWeekMon0(last)))

  const todayStr = new Date().toISOString().slice(0, 10)
  const byDate = new Map()
  for (const o of orders) {
    const eff = o.tanggal_fix || o.tanggal_usulan
    const key = toYMD(eff)
    if (!byDate.has(key)) byDate.set(key, [])
    byDate.get(key).push(o)
  }

  const weeks = []
  let cur = new Date(start)
  while (cur <= end) {
    const week = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(cur)
      const ds = toYMD(d)
      week.push({
        date: ds,
        day: d.getUTCDate(),
        inMonth: d.getUTCMonth() === monthIdx,
        isToday: ds === todayStr,
        orders: (byDate.get(ds) || []).map((o) => ({
          id: o.id,
          customer_name: o.customer_name,
          status: o.status,
          total_harga: o.total_harga,
          tanggal_fix: o.tanggal_fix ? o.tanggal_fix.toISOString() : null,
          tanggal_usulan: o.tanggal_usulan ? o.tanggal_usulan.toISOString() : null,
        })),
      })
      cur.setUTCDate(cur.getUTCDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

export default async function AdminDashboardPage({ searchParams }) {
  const sp = searchParams || {}
  const now = new Date()
  const bulanParam = sp.bulan || `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  const [by, bm] = String(bulanParam).split('-').map((x) => parseInt(x, 10))
  const calYear = Number.isFinite(by) ? by : now.getUTCFullYear()
  const calMonth = Number.isFinite(bm) ? bm : (now.getUTCMonth() + 1)
  const monthDate = new Date(Date.UTC(calYear, calMonth - 1, 1))

  const chartBulan = sp.g_bulan ? parseInt(sp.g_bulan, 10) : (now.getUTCMonth() + 1)
  const chartTahun = sp.g_tahun ? parseInt(sp.g_tahun, 10) : now.getUTCFullYear()

  const { start: mStart, end: mEnd } = startEndOfMonth(now.getUTCFullYear(), now.getUTCMonth() + 1)
  const todayStr = new Date().toISOString().slice(0, 10)
  const todayStart = new Date(`${todayStr}T00:00:00.000Z`)
  const todayEnd = new Date(`${todayStr}T23:59:59.999Z`)
  const { start: calStart, end: calEnd } = startEndOfMonth(calYear, calMonth)
  const { start: tStart, end: tEnd } = startEndOfMonth(chartTahun, chartBulan)
  const { start: pieStart, end: pieEnd } = startEndOfMonth(chartTahun, chartBulan)

  const [
    setting,
    yearRows,
    ordersThisMonth,
    pendingOrdersRaw,
    jadwalHariIni,
    calOrders,
    trendOrders,
    pieOrders,
  ] = await Promise.all([
    prisma.setting.findUnique({ where: { id: 1 } }).catch(() => null),
    prisma.$queryRaw`
      SELECT DISTINCT EXTRACT(YEAR FROM COALESCE("tanggal_fix", "tanggal_usulan"))::int AS year
      FROM "Order"
      WHERE COALESCE("tanggal_fix", "tanggal_usulan") IS NOT NULL
      ORDER BY year ASC
    `.catch(() => []),
    prisma.order.findMany({
      where: { created_at: { gte: mStart, lte: mEnd } },
      select: { id: true, status: true, total_harga: true },
    }).catch(() => []),
    prisma.order.findMany({
      where: { status: { in: ['pending', 'rescheduled'] } },
      include: { items: true },
      orderBy: { created_at: 'desc' },
      take: 20,
    }).catch(() => []),
    prisma.order.count({
      where: {
        status: 'confirmed',
        OR: [
          { tanggal_fix: { gte: todayStart, lte: todayEnd } },
          { tanggal_fix: null, tanggal_usulan: { gte: todayStart, lte: todayEnd } },
        ],
      },
    }).catch(() => 0),
    prisma.order.findMany({
      where: {
        OR: [
          { tanggal_fix: { gte: calStart, lte: calEnd } },
          { tanggal_fix: null, tanggal_usulan: { gte: calStart, lte: calEnd } },
        ],
      },
      select: { id: true, customer_name: true, status: true, total_harga: true, tanggal_usulan: true, tanggal_fix: true },
    }).catch(() => []),
    prisma.order.findMany({
      where: { created_at: { gte: tStart, lte: tEnd } },
      select: { created_at: true, total_harga: true, status: true },
    }).catch(() => []),
    prisma.order.findMany({
      where: {
        status: { not: 'cancelled' },
        created_at: { gte: pieStart, lte: pieEnd },
      },
      include: { items: true },
    }).catch(() => []),
  ])

  const safeSetting = setting || { business_name: 'Bersihinkost', operator_name: 'Admin', jam_mulai: '08:00', jam_selesai: '17:00' }

  const yearSet = new Set([now.getUTCFullYear(), chartTahun, calYear])
  for (const r of (Array.isArray(yearRows) ? yearRows : [])) {
    const y = Number(r?.year)
    if (Number.isFinite(y)) yearSet.add(y)
  }
  const years = Array.from(yearSet).filter(Number.isFinite).sort((a, b) => a - b)

  const completedThisMonth = ordersThisMonth.filter((o) => o.status === 'completed')
  const kasBulanIni = completedThisMonth.reduce((s, o) => s + (o.total_harga || 0), 0)
  const selesaiBulanIni = completedThisMonth.length
  const totalPesananBulanIni = ordersThisMonth.length

  const pendingCount = pendingOrdersRaw.length
  const pendingTotal = pendingOrdersRaw.reduce((s, o) => s + (o.total_harga || 0), 0)

  const weeks = buildWeeks(monthDate, calOrders)

  const daysInMonth = new Date(Date.UTC(chartTahun, chartBulan, 0)).getUTCDate()
  const trendLabels = Array.from({ length: daysInMonth }, (_, i) => String(i + 1))
  const countsByDay = Array(daysInMonth).fill(0)
  let trendTotalPenghasilan = 0
  for (const o of trendOrders) {
    const d = new Date(o.created_at)
    const day = d.getUTCDate()
    if (day >= 1 && day <= daysInMonth) countsByDay[day - 1] += 1
    if (o.status === 'completed') trendTotalPenghasilan += (o.total_harga || 0)
  }
  const trendValues = countsByDay
  const trendTotalPesanan = trendOrders.length
  const trendRataHarian = daysInMonth ? Math.round(trendTotalPenghasilan / daysInMonth) : 0

  const colorPalette = ['#8b5cf6', '#fb7185', '#34d399', '#f59e0b', '#60a5fa', '#a78bfa', '#f472b6', '#10b981']
  const agg = new Map()
  for (const o of pieOrders) {
    for (const it of (o.items || [])) {
      const label = it.service_name || 'Layanan'
      agg.set(label, (agg.get(label) || 0) + (it.qty || 0))
    }
  }
  const pieEntries = Array.from(agg.entries()).map(([label, qty], idx) => ({ label, qty, color: colorPalette[idx % colorPalette.length] }))
  const pieData = pieEntries
  const pieLabels = pieEntries.map((p) => p.label)
  const pieQtys = pieEntries.map((p) => p.qty)
  const pieColors = pieEntries.map((p) => p.color)
  const pieTotal = pieQtys.reduce((a, b) => a + b, 0)

  const pendingOrdersSerialized = pendingOrdersRaw.map((o) => ({
    ...o,
    created_at: o.created_at?.toISOString?.() || null,
    updated_at: o.updated_at?.toISOString?.() || null,
    tanggal_usulan: o.tanggal_usulan?.toISOString?.() || null,
    tanggal_fix: o.tanggal_fix?.toISOString?.() || null,
    items: (o.items || []).map((it) => ({ ...it, created_at: it.created_at?.toISOString?.() || null, updated_at: it.updated_at?.toISOString?.() || null })),
  }))
  const pendingOrders = await attachDisplayNumbers(pendingOrdersSerialized, prisma)

  const props = {
    user: { name: safeSetting.operator_name || 'Administrator' },
    setting: { ...safeSetting, created_at: null, updated_at: null },
    kasBulanIni,
    selesaiBulanIni,
    totalPesananBulanIni,
    pendingCount,
    pendingTotal,
    jadwalHariIni,
    month: { year: calYear, month: calMonth, labelParam: `${calYear}-${String(calMonth).padStart(2, '0')}` },
    weeks,
    pendingOrders,
    chartBulan,
    chartTahun,
    years,
    trendLabels,
    trendValues,
    trendTotalPenghasilan,
    trendTotalPesanan,
    trendRataHarian,
    pieTotal,
    pieData,
    pieLabels,
    pieQtys,
    pieColors,
  }

  return (
    <AdminLayout rightPanel={<DashboardRightPanel pendingCount={pendingCount} pendingTotal={pendingTotal} pendingOrders={pendingOrders} setting={safeSetting} />}>
      <Dashboard {...props} />
    </AdminLayout>
  )
}
