/* Utilitas tanggal / WIB (Asia/Jakarta). Semua disimpan dalam DB sebagai WIB. */

const optionsDate = { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }
const optionsDateTime = {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
}

/** Format ISO string -> "dd/mm/yyyy" (WIB). */
export function formatDate(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('id-ID', optionsDate)
}

/** Format ISO string -> "dd/mm/yyyy HH:MM" (WIB). */
export function formatDateTime(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('id-ID', optionsDateTime)
}

/** "yyyy-mm-dd" dari Date/ISO (WIB). */
export function toDateString(value) {
  if (!value) return null
  const d = new Date(value)
  return d.toISOString().split('T')[0]
}

/** "HH:MM" dari Date/ISO (WIB). */
export function toTimeString(value) {
  if (!value) return null
  const d = new Date(value)
  return d.toISOString().split('T')[1].slice(0, 5)
}

/** Gabungkan tanggal + jam -> ISO UTC string untuk disimpan DB (dibaca sebagai WIB). */
export function combineDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null
  return `${dateStr}T${timeStr}:00`
}

/** Rupiah Indonesia. */
export function formatRupiah(n) {
  if (n == null) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Number(n))
}

/** Dapatkan daftar tahun unik dari orders (untuk filter laporan). */
export async function getOrderYears(prisma, completedOnly = false) {
  const where = completedOnly ? { status: 'completed' } : {}
  const usulan = await prisma.order.findMany({
    where,
    select: { tanggal_usulan: true },
    distinct: ['tanggal_usulan'],
  })
  const fix = await prisma.order.findMany({
    where: { ...where, tanggal_fix: { not: null } },
    select: { tanggal_fix: true },
    distinct: ['tanggal_fix'],
  })
  const years = new Set()
  for (const r of usulan) {
    const s = toDateString(r.tanggal_usulan)
    if (s) years.add(s.slice(0, 4))
  }
  for (const r of fix) {
    const s = toDateString(r.tanggal_fix)
    if (s) years.add(s.slice(0, 4))
  }
  if (years.size === 0) years.add(new Date().toISOString().slice(0, 4))
  return [...years].sort()
}

/** Hitung jumlah hari dalam bulan/tahun untuk laporan rata-rata harian. */
export function daysIn(year, month) {
  return new Date(year, month, 0).getDate()
}
