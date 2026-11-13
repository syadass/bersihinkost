import PesananInvoice from '@/components/admin/pesanan/invoice'

export const dynamic = 'force-dynamic'

export default function InvoicePage({ params }) {
  return <PesananInvoice params={params} />
}
