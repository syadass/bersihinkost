'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import AdminLayout, { useConfirmModal } from '@/components/layouts/admin'
import InvoiceSheet from './_invoice_sheet'

function toDateValue(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function toTimeValue(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

export default function PesananShow({ params }) {
  return (
    <AdminLayout>
      <PesananShowInner params={params} />
    </AdminLayout>
  )
}

function PesananShowInner({ params }) {
  const id = Number(params.id)
  const router = useRouter()
  const sp = useSearchParams()
  const confirm = useConfirmModal()
  const [order, setOrder] = useState(null)
  const [setting, setSetting] = useState({ business_name: 'Bersihinkost', operator_name: 'Admin', jam_mulai: '08:00', jam_selesai: '17:00' })
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [msg, setMsg] = useState(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ customer_name: '', customer_wa: '', alamat: '', tanggal_usulan: '', jam_usulan: '', catatan_admin: '', items: [] })

  const fromRaw = sp?.get('from') || ''
  const from = (() => {
    if (fromRaw) return fromRaw
    if (typeof document !== 'undefined' && document.referrer) {
      try {
        const ref = new URL(document.referrer)
        if (ref.origin === window.location.origin && ref.pathname.startsWith('/admin') && !/\/admin\/pesanan\/\d+/.test(ref.pathname)) {
          return ref.pathname + ref.search
        }
      } catch {}
    }
    return ''
  })()
  const backUrl = from || '/admin/pesanan'
  const fromParam = from ? `?from=${encodeURIComponent(from)}` : ''

  async function load() {
    try {
      const [oRes, sRes, svRes] = await Promise.all([
        fetch(`/api/orders/${id}`, { cache: 'no-store' }),
        fetch('/api/settings', { cache: 'no-store' }),
        fetch('/api/services', { cache: 'no-store' }),
      ])
      if (oRes.ok) {
        const o = (await oRes.json()).order
        setOrder(o)
        setEditForm({
          customer_name: o.customer_name || '',
          customer_wa: o.customer_wa || '',
          alamat: o.alamat || '',
          tanggal_usulan: toDateValue(o.tanggal_usulan),
          jam_usulan: toTimeValue(o.tanggal_usulan),
          catatan_admin: o.catatan_admin || '',
          items: (o.items || []).map(it => ({ service_id: String(it.service_id), qty: it.qty })),
        })
      }
      if (sRes.ok) { const d = await sRes.json(); if (d.setting) setSetting(st => ({ ...st, ...d.setting })) }
      if (svRes.ok) { const d = await svRes.json(); setServices(d.services || []) }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const fmtDateTime = (iso) => {
    if (!iso) return '-'
    return new Date(iso).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB'
  }

  const statusConfig = {
    pending: { label: 'Menunggu ACC', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
    rescheduled: { label: 'Pindah Tanggal', badge: 'bg-blue-100 text-blue-700 border-blue-200' },
    confirmed: { label: 'Terjadwal', badge: 'bg-lavender-100 text-lavender-700 border-lavender-200' },
    completed: { label: 'Selesai', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    cancelled: { label: 'Batal', badge: 'bg-red-100 text-red-500 border-red-200' },
  }

  async function doPatch(body, okMsg) {
    setError(null)
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Gagal memproses.')
      setMsg(data.message || okMsg || 'Berhasil.')
      if (!data.customer_notified && data.customer_wa_link) window.open(data.customer_wa_link, '_blank')
      await load()
    } catch (e) { setError(e.message) }
  }

  function printInvoice() {
    const root = document.getElementById('printRoot')
    const src = document.getElementById('invoicePdf')
    if (!root || !src) return
    root.innerHTML = src.innerHTML
    document.body.classList.add('printing')
    window.print()
    window.addEventListener('afterprint', () => {
      document.body.classList.remove('printing')
      root.innerHTML = ''
    }, { once: true })
  }

  async function downloadPdf() {
    const status = document.getElementById('dlStatus')
    if (status) { status.innerText = 'Menyiapkan PDF, mohon tunggu...'; status.classList.remove('hidden') }
    try {
      const el = document.getElementById('invoicePdf')
      // @ts-ignore
      if (!window.html2pdf) {
        const s = document.createElement('script')
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
        document.body.appendChild(s)
        await new Promise((res, rej)=>{ s.onload=res; s.onerror=rej })
      }
      // @ts-ignore
      await window.html2pdf().set({
        margin: 10,
        filename: `invoice-#${id}-bersihinkost.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).from(el).save()
    } catch {
      if (status) status.innerText = 'Gagal membuat PDF otomatis. Gunakan tombol Print lalu pilih "Save as PDF".'
    } finally {
      if (status) setTimeout(()=>status.classList.add('hidden'), 1500)
    }
  }

  if (loading) return <div className="h-full overflow-y-auto pr-1 sm:pr-2 pb-6"><div className="max-w-4xl mx-auto">Memuat...</div></div>
  if (!order) return <div className="h-full overflow-y-auto pr-1 sm:pr-2 pb-6"><div className="max-w-4xl mx-auto">Pesanan tidak ditemukan.</div></div>

  const sc = statusConfig[order.status] || statusConfig.pending
  const editable = !['cancelled', 'completed'].includes(order.status)
  const fix = order.tanggal_fix || order.tanggal_usulan
  const total = order?.items?.reduce((s, i) => s + (i.subtotal || 0), 0) || order?.total_harga || 0

  return (
    <>
      <div className="h-full overflow-y-auto pr-1 sm:pr-2 pb-6">
        <div className="max-w-4xl mx-auto">
          {msg && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 mb-4 w-full"><i className="fa-solid fa-circle-check"></i> {msg}</div>}
          {error && <div className="bg-red-50 border border-red-200 text-red-600 px-5 py-3 rounded-2xl text-sm font-bold mb-4 w-full">{error}</div>}
          {/* Header & Back Button */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pt-2 gap-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <a href={backUrl} className="w-11 h-11 rounded-2xl bg-white text-lavender-600 shadow-card flex items-center justify-center hover:bg-lavender-50 transition-colors border border-lavender-100 shrink-0">
                <i className="fa-solid fa-arrow-left text-sm"></i>
              </a>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">#{order.id}</h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${sc.badge}`}>{sc.label}</span>
                </div>
                <p className="text-sm font-bold text-lavender-500">Detail pesanan, alamat, jadwal booking, dan aksi pengerjaan</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={printInvoice} className="px-4 sm:px-5 py-3 rounded-2xl bg-white text-lavender-600 border border-lavender-200 font-extrabold text-xs shadow-card hover:bg-lavender-50 transition-all flex items-center gap-2">
                <i className="fa-solid fa-print text-sm"></i> Print Invoice
              </button>
              <button onClick={downloadPdf} className="px-4 sm:px-5 py-3 rounded-2xl bg-peach-500 text-white font-extrabold text-xs shadow-md hover:bg-peach-600 transition-all flex items-center gap-2">
                <i className="fa-solid fa-file-arrow-down text-sm"></i> Unduh PDF
              </button>
            </div>
          </header>

          {/* Single Comprehensive Card Layout */}
          <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-card border border-lavender-50 p-5 sm:p-8 space-y-6">

            {/* Section 1 */}
            <div>
              <h3 className="text-base font-extrabold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                <i className="fa-solid fa-user-tag text-lavender-500"></i> Informasi Pemesan & Alamat Tujuan
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <span className="text-xs font-bold text-gray-400 block mb-1">Nama Lengkap</span>
                  <span className="font-extrabold text-gray-800 text-base">{order.customer_name}</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <span className="text-xs font-bold text-gray-400 block mb-1">Nomor WhatsApp</span>
                  {order.customer_wa ? (
                    <a href={`https://wa.me/${String(order.customer_wa).replace(/[^0-9]/g,'')}`} target="_blank" rel="noopener noreferrer" className="font-extrabold text-emerald-600 text-base hover:underline"><i className="fa-brands fa-whatsapp mr-1"></i>{order.customer_wa}</a>
                  ) : (
                    <span className="font-extrabold text-gray-400 text-base">-</span>
                  )}
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 sm:col-span-2">
                  <span className="text-xs font-bold text-gray-400 block mb-1">Nomor Pesanan</span>
                  <span className="font-extrabold text-gray-800 text-base">#{order.id}</span>
                </div>
                <div className="sm:col-span-2 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <span className="text-xs font-bold text-gray-400 block mb-1">Alamat / Detail Lokasi Kost</span>
                  <span className="font-extrabold text-peach-600 text-base block">{order.alamat}</span>
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div>
              <h3 className="text-base font-extrabold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                <i className="fa-solid fa-calendar-days text-lavender-500"></i> Jadwal & Waktu
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="bg-lavender-50/50 p-4 rounded-2xl border border-lavender-100">
                  <span className="text-xs font-bold text-lavender-600 block mb-1"><i className="fa-solid fa-clock mr-1"></i> Tanggal Order Masuk</span>
                  <span className="font-extrabold text-gray-800 text-base">{fmtDateTime(order.created_at)}</span>
                </div>
                <div className="bg-peach-50/50 p-4 rounded-2xl border border-peach-100">
                  <span className="text-xs font-bold text-peach-600 block mb-1"><i className="fa-solid fa-calendar-check mr-1"></i> Tanggal Booking Pengerjaan {order.tanggal_fix ? '(Fix)' : '(Usulan)'}</span>
                  <span className="font-extrabold text-gray-800 text-base">{fmtDateTime(order.tanggal_fix ?? order.tanggal_usulan)}</span>
                </div>
              </div>
              <div className="mt-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <span className="text-xs font-bold text-gray-400 block mb-1">Catatan Tambahan:</span>
                {order.catatan_admin ? <p className="text-xs font-semibold text-gray-700 italic">"{order.catatan_admin}"</p> : <p className="text-xs font-semibold text-gray-400 italic">Tidak ada catatan tambahan.</p>}
              </div>
              {order.alasan_batal && (
                <div className="mt-3 bg-red-50 p-4 rounded-2xl border border-red-100">
                  <span className="text-xs font-extrabold text-red-500 block mb-1"><i className="fa-solid fa-ban mr-1"></i> Alasan Batal:</span>
                  <p className="text-xs font-semibold text-red-600">{order.alasan_batal}</p>
                </div>
              )}
            </div>

            {/* Section 3 */}
            <div>
              <h3 className="text-base font-extrabold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                <i className="fa-solid fa-basket-shopping text-lavender-500"></i> Rincian Layanan & Estimasi Durasi
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-400 text-xs font-extrabold uppercase border-b border-gray-100">
                      <th className="pb-3">Jenis Layanan</th>
                      <th className="pb-3 text-center">Estimasi Durasi</th>
                      <th className="pb-3 text-center">Jumlah</th>
                      <th className="pb-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                    {(order.items || []).map((it) => (
                      <tr key={it.id}>
                        <td className="py-3 font-extrabold text-gray-800">{it.service_name}</td>
                        <td className="py-3 text-center text-gray-500">{it.service ? (it.service.duration_minutes * it.qty) + ' Menit' : '-'}</td>
                        <td className="py-3 text-center text-gray-800 font-extrabold">{it.qty}x</td>
                        <td className="py-3 text-right font-extrabold text-peach-500">Rp{Number(it.subtotal).toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <span className="text-xs font-bold text-gray-400 block">Total Estimasi Pengerjaan:</span>
                  <span className="text-sm font-extrabold text-lavender-600">{order.estimasi_menit} Menit</span>
                </div>
                <div className="sm:text-right">
                  <span className="text-xs font-bold text-gray-400 block">Total Biaya:</span>
                  <span className="text-2xl font-extrabold text-peach-500">Rp{Number(total).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* Section 4 */}
            {editable ? (
              <div className="pt-4 border-t-2 border-dashed border-lavender-100">
                <h3 className="text-base font-extrabold text-gray-800 mb-1 flex items-center gap-2">
                  <i className="fa-solid fa-sliders text-lavender-500"></i> Kontrol Aksi Pengelola
                </h3>
                <p className="text-xs font-semibold text-gray-400 mb-4">Ubah status pengerjaan atau kelola pesanan ini secara mandiri:</p>

                <div className="grid sm:grid-cols-2 gap-4">
                  <form onSubmit={(e)=>{ e.preventDefault(); const fd=new FormData(e.currentTarget); confirm.open({ title:'ACC Pesanan?', message:`Pesanan #${order.id} akan di-ACC dengan tanggal fix yang dipilih.`, confirmText:'Ya, ACC', tone:'emerald', icon:'fa-check', onConfirm:()=>doPatch({ action:'acc', tanggal_fix:fd.get('tanggal_fix'), jam_fix:fd.get('jam_fix') }) }) }} className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2">
                    <label className="text-xs font-extrabold text-emerald-600">ACC — tanggal & jam fix pengerjaan</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="date" name="tanggal_fix" defaultValue={toDateValue(fix)} className="min-w-0 px-3 py-2.5 rounded-xl bg-white border border-emerald-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                      <input type="time" name="jam_fix" min={setting.jam_mulai} max={setting.jam_selesai} defaultValue={toTimeValue(fix)} className="min-w-0 px-3 py-2.5 rounded-xl bg-white border border-emerald-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                    </div>
                    <button className="w-full py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-extrabold hover:bg-emerald-600 transition-all"><i className="fa-solid fa-check mr-1"></i> ACC Pesanan</button>
                  </form>

                  <form onSubmit={(e)=>{ e.preventDefault(); const fd=new FormData(e.currentTarget); const keterangan=(fd.get('keterangan')||'').toString().trim(); confirm.open({ title:'Ajukan Perubahan Jadwal?', message:`Permintaan perubahan jadwal untuk pesanan #${order.id} akan diajukan ke pelanggan via WhatsApp.`, confirmText:'Ya, Ajukan', tone:'blue', icon:'fa-calendar-days', onConfirm:()=>doPatch({ action:'ajukan_perubahan_jadwal', keterangan }) }) }} className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
                    <label className="text-xs font-extrabold text-blue-600">Ajukan perubahan jadwal</label>
                    <input type="text" name="keterangan" placeholder="Keterangan (opsional)" className="w-full px-4 py-2.5 rounded-xl bg-white border border-blue-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                    <button className="w-full py-2.5 rounded-xl bg-blue-500 text-white text-sm font-extrabold hover:bg-blue-600 transition-all"><i className="fa-solid fa-calendar-days mr-1"></i> Ajukan Perubahan Jadwal</button>
                  </form>

                  <form onSubmit={(e)=>{ e.preventDefault(); const fd=new FormData(e.currentTarget); const alasan=fd.get('alasan_batal'); if(!alasan) return; confirm.open({ title:'Batalkan Pesanan?', message:`Pesanan #${order.id} akan dibatalkan permanen (fix batal) tanpa mengirim WhatsApp.`, confirmText:'Ya, Batalkan', tone:'red', icon:'fa-ban', onConfirm:()=>doPatch({ alasan_batal: alasan }) }) }} className="p-4 rounded-2xl bg-red-50/60 border border-red-100 space-y-2">
                    <label className="text-xs font-extrabold text-red-500">Batalkan pesanan (fix batal)</label>
                    <input type="text" name="alasan_batal" required placeholder="Alasan pembatalan (wajib)" className="w-full px-4 py-2.5 rounded-xl bg-white border border-red-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-300" />
                    <button className="w-full py-2.5 rounded-xl bg-red-500 text-white text-sm font-extrabold hover:bg-red-600 transition-all"><i className="fa-solid fa-ban mr-1"></i> Batalkan Pesanan</button>
                  </form>

                  <div className="p-4 rounded-2xl bg-lavender-50/60 border border-lavender-100 space-y-2">
                    <label className="text-xs font-extrabold text-lavender-600">Selesaikan / ubah data</label>
                    <button type="button" onClick={()=>setEditOpen(true)} className="w-full py-2.5 rounded-xl bg-white border border-lavender-200 text-lavender-600 text-sm font-extrabold hover:bg-lavender-50 transition-all"><i className="fa-solid fa-pen-to-square mr-1"></i> Ubah Pesanan</button>
                    <button type="button" onClick={()=>confirm.open({ title:'Tandai Selesai?', message:`Pesanan #${order.id} akan ditandai selesai dan masuk ke kas.`, confirmText:'Ya, Selesaikan', tone:'lavender', icon:'fa-check-double', onConfirm:()=>doPatch({ status:'completed' }) })} className="w-full py-2.5 rounded-xl bg-lavender-600 text-white text-sm font-extrabold hover:bg-lavender-700 transition-all"><i className="fa-solid fa-check-double mr-1"></i> Tandai Selesai</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pt-4 border-t-2 border-dashed border-lavender-100">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className={`flex-1 ${order.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-500 border-red-100'} p-3.5 rounded-2xl text-center font-extrabold text-xs border flex items-center justify-center gap-2`}>
                    <i className={`fa-solid ${order.status === 'completed' ? 'fa-circle-check' : 'fa-ban'} text-base`}></i>
                    {order.status === 'completed' ? 'Pengerjaan Telah Selesai' : 'Pesanan Telah Dibatalkan'}
                  </div>
                  {order.status === 'cancelled' && (
                    <button onClick={()=>confirm.open({ title:'Hapus Pesanan?', message:`Riwayat pesanan #${order.id} akan dihapus permanen dan tidak bisa dikembalikan.`, confirmText:'Ya, Hapus', tone:'red', icon:'fa-trash-can', onConfirm:async()=>{ const r=await fetch(`/api/orders/${id}`,{method:'DELETE'}); const d=await r.json().catch(()=>({})); if(!r.ok){ setError(d.message||'Gagal menghapus.'); return } router.push(backUrl) } })} className="py-3.5 px-6 rounded-2xl bg-red-50 text-red-500 font-extrabold text-xs hover:bg-red-100 transition-colors flex items-center justify-center gap-2 whitespace-nowrap">
                      <i className="fa-solid fa-trash-can"></i> Hapus
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Invoice tersembunyi: sumber cetak & PDF */}
      <div id="invoicePdf" className="hidden">
        <InvoiceSheet order={order} setting={setting} />
      </div>
      <p id="dlStatus" className="hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] px-5 py-3 rounded-2xl bg-gray-800 text-white text-xs font-extrabold shadow-float">Menyiapkan PDF, mohon tunggu...</p>

      {/* Modal Ubah Pesanan */}
      {editOpen && (
        <div id="editModal" className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto" onClick={(e)=>{ if(e.target.id==='editModal') setEditOpen(false) }}>
          <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-float w-full max-w-2xl border border-lavender-50 relative my-auto max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center gap-3 p-5 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="text-lg font-extrabold text-gray-800">Ubah Pesanan #{order.id}</h3>
                <p className="text-xs font-semibold text-gray-400">Perbarui data pemesan, jadwal, dan layanan</p>
              </div>
              <button type="button" onClick={()=>setEditOpen(false)} className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 shrink-0">
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>
            <form onSubmit={async (e)=>{
              e.preventDefault(); setError(null)
              try {
                const res = await fetch(`/api/orders/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...editForm, items: editForm.items.filter(i=>i.service_id).map(i=>({service_id:i.service_id, qty:Number(i.qty)})), from }) })
                const data = await res.json().catch(()=>({}))
                if(!res.ok) throw new Error(data.message||'Gagal mengubah pesanan.')
                setEditOpen(false); setMsg('Pesanan berhasil diubah.'); await load()
              } catch(err){ setError(err.message) }
            }} className="overflow-y-auto p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-gray-600 mb-1">Nama Pemesan</label>
                  <input type="text" value={editForm.customer_name} onChange={(e)=>setEditForm({...editForm, customer_name:e.target.value})} required className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400" />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-gray-600 mb-1">Nomor WhatsApp</label>
                  <input type="tel" value={editForm.customer_wa} onChange={(e)=>setEditForm({...editForm, customer_wa:e.target.value})} placeholder="Contoh: 081234567890" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-extrabold text-gray-600 mb-1">Tanggal & Jam Usulan</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={editForm.tanggal_usulan} onChange={(e)=>setEditForm({...editForm, tanggal_usulan:e.target.value})} required className="min-w-0 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400" />
                    <input type="time" min={setting.jam_mulai} max={setting.jam_selesai} value={editForm.jam_usulan} onChange={(e)=>setEditForm({...editForm, jam_usulan:e.target.value})} required className="min-w-0 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-extrabold text-gray-600 mb-1">Alamat Kost / Kamar</label>
                <textarea rows={2} value={editForm.alamat} onChange={(e)=>setEditForm({...editForm, alamat:e.target.value})} required className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400" />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-gray-600 mb-1">Catatan Admin</label>
                <input type="text" value={editForm.catatan_admin} onChange={(e)=>setEditForm({...editForm, catatan_admin:e.target.value})} placeholder="Keterangan tambahan (opsional)" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400" />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-gray-600 mb-2">Item Layanan</label>
                <div id="editItemRows" className="space-y-2">
                  {editForm.items.map((it, idx)=>(
                    <div key={idx} className="flex flex-col min-[420px]:flex-row gap-2">
                      <select value={it.service_id} onChange={(e)=>{ const items=[...editForm.items]; items[idx]={...items[idx], service_id:e.target.value}; setEditForm({...editForm, items}) }} required className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                        {services.map(s => <option key={s.id} value={String(s.id)}>{s.name} - Rp{Number(s.price).toLocaleString('id-ID')}</option>)}
                      </select>
                      <div className="flex gap-2">
                        <input type="number" value={it.qty} min={1} max={20} onChange={(e)=>{ const items=[...editForm.items]; items[idx]={...items[idx], qty:e.target.value}; setEditForm({...editForm, items}) }} required className="flex-1 min-[420px]:w-20 min-[420px]:flex-none px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400" />
                        <button type="button" onClick={()=>setEditForm({...editForm, items: editForm.items.length===1?editForm.items:editForm.items.filter((_,i)=>i!==idx)})} className="px-4 min-[420px]:px-3 rounded-xl bg-red-50 text-red-500 font-bold hover:bg-red-100" title="Hapus item">×</button>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={()=>setEditForm({...editForm, items:[...editForm.items,{service_id:services[0]?.id?String(services[0].id):'', qty:1}]})} className="mt-2 px-4 py-2 rounded-full bg-lavender-50 text-lavender-600 text-xs font-extrabold hover:bg-lavender-100 transition-colors">+ Tambah Item</button>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button type="button" onClick={()=>setEditOpen(false)} className="py-3 rounded-2xl bg-gray-100 text-gray-600 font-extrabold text-sm hover:bg-gray-200 transition-colors">Batal</button>
                <button className="py-3 rounded-2xl bg-lavender-600 text-white font-extrabold text-sm shadow-md hover:bg-lavender-700 transition-all">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
