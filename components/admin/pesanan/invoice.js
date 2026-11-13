'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import InvoiceSheet from './_invoice_sheet'
import LoadingState from '@/components/ui/loading-state'

export default function PesananInvoice({ params }) {
  const id = Number(params.id)
  const sp = useSearchParams()
  const [order, setOrder] = useState(null)
  const [setting, setSetting] = useState({ business_name: 'Bersihinkost', operator_name: 'Admin' })
  const [loading, setLoading] = useState(true)
  const [dlStatus, setDlStatus] = useState('')

  useEffect(() => {
    Promise.all([
      fetch(`/api/orders/${id}`, { cache: 'no-store' }),
      fetch('/api/settings', { cache: 'no-store' }),
    ]).then(async ([oRes, sRes]) => {
      if (oRes.ok) setOrder((await oRes.json()).order || null)
      if (sRes.ok) { const d = await sRes.json(); if (d.setting) setSetting(d.setting) }
    }).finally(() => setLoading(false))
  }, [id])

  async function downloadPdf() {
    setDlStatus('Menyiapkan PDF, mohon tunggu...')
    try {
      const el = document.getElementById('invoicePdf')
      // @ts-ignore
      if (!window.html2pdf) {
        const s = document.createElement('script')
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
        document.body.appendChild(s)
        await new Promise((res, rej) => { s.onload = res; s.onerror = rej })
      }
      // @ts-ignore
      await window.html2pdf().set({
        margin: 10,
        filename: `invoice-${(order?.order_number || `#${id}`).replace(/[^a-zA-Z0-9-_]/g, '-')}-bersihinkost.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).from(el).save()
      setDlStatus('')
    } catch {
      setDlStatus('Gagal membuat PDF otomatis. Gunakan tombol Cetak lalu pilih "Save as PDF".')
    }
  }

  useEffect(() => {
    if (!order) return
    if (sp?.get('cetak')) window.print()
    if (sp?.get('unduh')) setTimeout(downloadPdf, 600)
  }, [order, sp])

  if (loading) return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: '#F9F8FC' }}>
      <LoadingState size="lg" className="min-h-screen flex items-center justify-center p-6 animate-fade-in" />
    </div>
  )
  if (!order) return <div className="min-h-screen flex items-center justify-center p-6 text-gray-400 font-bold" style={{ fontFamily: "'Nunito', sans-serif", background: '#F9F8FC' }}>Pesanan tidak ditemukan.</div>

  return (
    <div className="min-h-screen py-6 px-4" style={{ fontFamily: "'Nunito', sans-serif", background: '#F9F8FC', color: '#2D3748' }}>
      <style>{`
        @media print {
          body { background: #fff; }
          .no-print { display: none !important; }
          .invoice-sheet { box-shadow: none !important; border: none !important; border-radius: 0 !important; max-width: 100% !important; margin: 0 !important; }
          @page { margin: 14mm; }
        }
      `}</style>
      <div id="invoicePdf" className="invoice-sheet max-w-3xl mx-auto bg-white rounded-3xl shadow-card border border-lavender-50 overflow-hidden">
        <InvoiceSheet order={order} setting={setting} />

        <div className="px-6 sm:px-10 pb-7">
          <div className="no-print flex flex-col sm:flex-row gap-3 pt-2" data-html2canvas-ignore="true">
            <button onClick={() => window.print()} className="flex-1 py-3.5 rounded-2xl bg-lavender-600 text-white font-extrabold text-sm shadow-md hover:bg-lavender-700 transition-all flex items-center justify-center gap-2">
              <i className="fa-solid fa-print"></i> Cetak
            </button>
            <button onClick={downloadPdf} className="flex-1 py-3.5 rounded-2xl bg-peach-500 text-white font-extrabold text-sm shadow-md hover:bg-peach-600 transition-all flex items-center justify-center gap-2">
              <i className="fa-solid fa-file-arrow-down"></i> Unduh PDF
            </button>
            <button onClick={() => window.close()} className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-600 font-extrabold text-sm hover:bg-gray-200 transition-colors">
              Tutup
            </button>
          </div>
          <p id="dlStatus" className={`no-print text-center text-xs font-extrabold text-lavender-600 ${dlStatus ? '' : 'hidden'}`}>{dlStatus || 'Menyiapkan PDF, mohon tunggu...'}</p>
        </div>
      </div>
    </div>
  )
}
