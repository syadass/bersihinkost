import prisma from '@/lib/prisma'

function pad4(n) {
  return String(n).padStart(4, '0')
}

function monthKeyWIB(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date)
  const y = parts.find((p) => p.type === 'year')?.value || String(date.getFullYear())
  const m = parts.find((p) => p.type === 'month')?.value || String(date.getMonth() + 1).padStart(2, '0')
  return `${y}${m}`
}

export function formatOrderCodeFromSeq(createdAt, seq) {
  const ym = monthKeyWIB(createdAt ? new Date(createdAt) : new Date())
  return `ORD-${ym}-${pad4(seq || 0)}`
}

export async function getOrderSeq(order, tx = prisma) {
  if (!order?.id || !order?.created_at) return null
  try {
    const rows = await tx.$queryRaw`
      SELECT COUNT(*)::int AS seq
      FROM "Order"
      WHERE date_trunc('month', "created_at" AT TIME ZONE 'Asia/Jakarta') = date_trunc('month', ${new Date(order.created_at)} AT TIME ZONE 'Asia/Jakarta')
        AND ("created_at" < ${new Date(order.created_at)} OR ("created_at" = ${new Date(order.created_at)} AND "id" <= ${order.id}))
    `
    const seq = Array.isArray(rows) ? Number(rows[0]?.seq || 0) : 0
    return seq || null
  } catch {
    return null
  }
}

export async function displayOrderNumber(order, tx = prisma) {
  if (!order) return '-'
  const seq = await getOrderSeq(order, tx)
  if (seq) return formatOrderCodeFromSeq(order.created_at, seq)
  return order?.id ? `#${order.id}` : '-'
}

export async function attachDisplayNumbers(orders, tx = prisma) {
  const list = Array.isArray(orders) ? orders : []
  // compute per order (simple approach)
  const enriched = await Promise.all(list.map(async (o) => {
    if (!o) return o
    const code = await displayOrderNumber(o, tx)
    return { ...o, order_number: code, invoice_number: code }
  }))
  return enriched
}
