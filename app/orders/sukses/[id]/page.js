import PublicLayout from '@/components/layouts/public'
import PublicSuccess from '@/components/public/success'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function SuccessPage({ params }) {
  const id = Number(params.id)

  let order = null
  let setting = { business_name: 'Bersihinkost', operator_name: 'Admin', admin_wa_number: '' }

  try {
    const [o, s] = await Promise.all([
      Number.isNaN(id)
        ? Promise.resolve(null)
        : prisma.order.findUnique({ where: { id }, include: { items: { include: { service: true } } } }),
      prisma.setting.findUnique({ where: { id: 1 } }),
    ])
    order = o
    if (s) setting = { ...setting, ...s }
  } catch {
    // ignore
  }

  return <PublicSuccess order={order} setting={setting} orderId={id} />
}
