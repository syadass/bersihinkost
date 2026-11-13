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
  try {
    const statusFilter = completedOnly ? `WHERE "status" = 'completed'` : ''
    const rows = await prisma.$queryRawUnsafe(`
      SELECT DISTINCT EXTRACT(YEAR FROM COALESCE("tanggal_fix", "tanggal_usulan"))::int AS year
      FROM "Order"
      ${statusFilter}
      ${completedOnly ? 'AND' : 'WHERE'} COALESCE("tanggal_fix", "tanggal_usulan") IS NOT NULL
      ORDER BY year ASC
    `)
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

/** Hitung jumlah hari dalam bulan/tahun untuk laporan rata-rata harian. */
export function daysIn(year, month) {
  return new Date(year, month, 0).getDate()
}
