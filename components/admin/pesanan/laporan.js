'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function PesananLaporan() {
  const sp = useSearchParams()
  const [rows, setRows] = useState([])
  const [setting, setSetting] = useState({ business_name: 'Bersihinkost', operator_name: 'Admin' })
  const [loading, setLoading] = useState(true)

  const search = sp?.get('search') || ''
  const bulan = sp?.get('bulan') || 'all'
  const tahun = sp?.get('tahun') || 'all'

  useEffect(() => {
    async function load() {
      try {
        const qs = new URLSearchParams({ tab: 'selesai', search, bulan, tahun, page: '1' })
        // fetch all pages roughly by requesting large-ish? API pages by 5; easier fetch first page and also compute totals from counts - but Blade showed all rows. We'll fetch multiple pages.
        let all = []
        let page = 1
        let totalPages = 1
        while (page <= totalPages && page <= 50) {
          qs.set('page', String(page))
          const r = await fetch(`/api/orders?${qs.toString()}`, { cache: 'no-store' })
          const d = await r.json().catch(() => ({}))
          all = all.concat(d.orders || [])
          totalPages = d.totalPages || 1
          page++
          if ((d.orders || []).length === 0) break
        }
        setRows(all)
        const sr = await fetch('/api/settings', { cache: 'no-store' })
        if (sr.ok) { const sd = await sr.json(); if (sd.setting) setSetting(sd.setting) }
      } finally { setLoading(false) }
    }
    load()
  }, [search, bulan, tahun])

  const now = new Date()
  const monthNames = ['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
  const periodeLabel = (bulan === 'all' ? 'Semua Bulan' : (monthNames[Number(bulan)] || bulan)) + ' ' + (tahun === 'all' ? 'Semua Tahun' : tahun)
  const totalPeriode = rows.reduce((s, o) => s + Number(o.total_harga || 0), 0)
  const yearForDays = tahun === 'all' ? now.getFullYear() : Number(tahun)
  let days
  if (bulan !== 'all') days = new Date(yearForDays, Number(bulan), 0).getDate()
  else if (tahun !== 'all') days = ((yearForDays % 4 === 0 && yearForDays % 100 !== 0) || yearForDays % 400 === 0) ? 366 : 365
  else days = 30
  const rataHarian = days > 0 ? Math.round(totalPeriode / days) : 0
  const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric' }) : '-'

  useEffect(() => {
    if (!loading && sp?.get('cetak')) window.print()
  }, [loading, sp])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 animate-fade-in" style={{ fontFamily: "'Nunito', sans-serif", background: '#F9F8FC' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-16 h-16 rounded-full bg-white shadow-card border border-lavender-100 flex items-center justify-center">
            <div className="absolute inset-1.5 rounded-full border-4 border-lavender-100 border-t-lavender-500 animate-spin" aria-hidden="true" />
            <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-lavender-500 to-lavender-700 text-white flex items-center justify-center shadow-inner">
              <i className="fa-solid fa-broom text-sm animate-pulse" />
            </div>
          </div>
          <p className="text-sm font-extrabold text-lavender-500">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-6 px-4" style={{ fontFamily: "'Nunito', sans-serif", background: '#F9F8FC', color: '#2D3748' }}>
      <style>{`
        @media print {
          body { background: #fff; }
          * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          .laporan-sheet { box-shadow: none !important; border: none !important; border-radius: 0 !important; max-width: 100% !important; margin: 0 !important; }
          @page { margin: 12mm; }
        }
      `}</style>
      <div className="laporan-sheet max-w-4xl mx-auto bg-white rounded-3xl shadow-card border border-lavender-50 overflow-hidden">
        <div id="laporanPdf">
          <div className="text-gray-900 px-6 sm:px-10 py-8 print:p-0">
            <div className="flex flex-col min-[480px]:flex-row justify-between min-[480px]:items-start gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-lavender-700 shrink-0">
                  <i className="fa-solid fa-broom text-xl"></i>
                </div>
                <div>
                  <p className="text-xl font-black text-gray-900">{setting.business_name}</p>
                  <p className="text-xs font-semibold text-gray-500">Laporan Rekapitulasi Pemasukan Jasa Kebersihan Kost</p>
                </div>
              </div>
              <div className="text-left min-[480px]:text-right shrink-0">
                <p className="text-sm font-extrabold text-gray-900">Periode: {periodeLabel}</p>
                <p className="text-xs font-semibold text-gray-500">Dicetak pada: {fmtDate(new Date().toISOString())}</p>
              </div>
            </div>
            <div className="mt-4 border-b border-gray-200"></div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mt-6 mb-8">
              <div className="rounded-2xl bg-gray-100/80 p-5" style={{ flex: 1, background: '#f3f4f6', borderRadius: '1rem', padding: '1.25rem' }}>
                <p className="text-[11px] font-bold text-gray-500">TOTAL PEMASUKAN</p>
                <p className="text-lg font-black mt-1">Rp {totalPeriode.toLocaleString('id-ID')}</p>
              </div>
              <div className="rounded-2xl bg-gray-100/80 p-5" style={{ flex: 1, background: '#f3f4f6', borderRadius: '1rem', padding: '1.25rem' }}>
                <p className="text-[11px] font-bold text-gray-500">KAMAR SELESAI</p>
                <p className="text-lg font-black mt-1">{rows.length} Kamar</p>
              </div>
              <div className="rounded-2xl bg-gray-100/80 p-5" style={{ flex: 1, background: '#f3f4f6', borderRadius: '1rem', padding: '1.25rem' }}>
                <p className="text-[11px] font-bold text-gray-500">RATA-RATA PER HARI</p>
                <p className="text-lg font-black mt-1">Rp {rataHarian.toLocaleString('id-ID')}</p>
                <p className="text-[11px] font-semibold text-gray-400">÷ {days} hari</p>
              </div>
            </div>

            <p className="text-sm font-black tracking-wide mb-2">RINCIAN TRANSAKSI MASUK</p>
            <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
              <table className="w-full text-sm border-collapse min-w-[560px]">
                <thead>
                  <tr className="text-gray-500 text-xs font-bold border-b border-gray-200">
                    <th className="px-4 py-3 text-left">ID & TANGGAL</th>
                    <th className="px-4 py-3 text-left">PEMESAN & ALAMAT</th>
                    <th className="px-4 py-3 text-left">LAYANAN</th>
                    <th className="px-4 py-3 text-right">NOMINAL</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && rows.length ? rows.map((o) => (
                    <tr key={o.id} className="border-b border-gray-100">
                      <td className="px-4 py-4 align-top">
                        <span className="font-extrabold block whitespace-nowrap">ORD-{String(o.id).padStart(3, '0')}</span>
                        <span className="text-xs text-gray-400">{fmtDate(o.updated_at)}</span>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span className="font-extrabold block">{o.customer_name}</span>
                        <span className="text-xs text-gray-500 block">{o.alamat}</span>
                      </td>
                      <td className="px-4 py-4 align-top text-gray-600 text-[13px]">{(o.items || []).map(it => `${it.service_name} (${it.qty}x)`).join(', ')}</td>
                      <td className="px-4 py-4 text-right align-top font-extrabold whitespace-nowrap">Rp {Number(o.total_harga||0).toLocaleString('id-ID')}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center font-bold text-gray-400">Belum ada pemasukan pada periode ini.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-12 text-sm">
              <div className="text-center">
                <p className="text-gray-500">Pengelola Bersihinkost,</p>
                <div className="h-20"></div>
                <p className="font-extrabold border-t border-gray-800 pt-1 px-6">{setting.operator_name}</p>
                <p className="text-xs text-gray-400">Solo Operator</p>
              </div>
            </div>
          </div>
        </div>

        <div className="no-print px-6 sm:px-10 pb-7 flex flex-col sm:flex-row gap-3">
          <button onClick={() => window.print()} className="flex-1 py-3.5 rounded-2xl bg-lavender-600 text-white font-extrabold text-sm shadow-md hover:bg-lavender-700 transition-all flex items-center justify-center gap-2">
            <i className="fa-solid fa-print"></i> Cetak
          </button>
          <button onClick={() => window.close()} className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-600 font-extrabold text-sm hover:bg-gray-200 transition-colors">
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
