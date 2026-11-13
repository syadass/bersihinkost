'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
// Admin layout disediakan oleh app/admin/layout.js

function toDateValue(iso) {
  if (!iso) return ''
  const d = new Date(iso); const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const da=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${da}`
}
function toTimeValue(iso) {
  if (!iso) return ''
  const d = new Date(iso); const h=String(d.getHours()).padStart(2,'0'); const mi=String(d.getMinutes()).padStart(2,'0'); return `${h}:${mi}`
}

export default function PesananEdit({ params }) {
  const id = Number(params.id)
  const sp = useSearchParams()
  const from = sp?.get('from') || ''
  const backToDetail = `/admin/pesanan/${id}${from ? `?from=${encodeURIComponent(from)}` : ''}`
  const [order, setOrder] = useState(null)
  const [services, setServices] = useState([])
  const [setting, setSetting] = useState({ jam_mulai: '08:00', jam_selesai: '17:00' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ customer_name: '', customer_wa: '', alamat: '', tanggal_usulan: '', jam_usulan: '', catatan_admin: '', items: [] })

  useEffect(() => {
    Promise.all([
      fetch(`/api/orders/${id}`, { cache: 'no-store' }),
      fetch('/api/services', { cache: 'no-store' }),
      fetch('/api/settings', { cache: 'no-store' }),
    ]).then(async ([oRes, sRes, stRes]) => {
      const sData = sRes.ok ? await sRes.json() : {}
      const svcs = sData.services || []
      setServices(svcs)
      if (stRes.ok) setSetting((await stRes.json()).setting || { jam_mulai: '08:00', jam_selesai: '17:00' })
      if (oRes.ok) {
        const o = (await oRes.json()).order
        setOrder(o)
        setForm({
          customer_name: o.customer_name || '',
          customer_wa: o.customer_wa || '',
          alamat: o.alamat || '',
          tanggal_usulan: toDateValue(o.tanggal_usulan),
          jam_usulan: toTimeValue(o.tanggal_usulan),
          catatan_admin: o.catatan_admin || '',
          items: (o.items || []).map((i) => ({ service_id: String(i.service_id), qty: i.qty })),
        })
      }
    }).finally(() => setLoading(false))
  }, [id])

  function addRow(sid = '', qty = 1) {
    setForm(f => ({ ...f, items: [...f.items, { service_id: sid || String(services[0]?.id || ''), qty }] }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null); setSaving(true)
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.customer_name,
          customer_wa: form.customer_wa || '',
          alamat: form.alamat,
          tanggal_usulan: form.tanggal_usulan,
          jam_usulan: form.jam_usulan,
          catatan_admin: form.catatan_admin || null,
          items: form.items.filter((it) => it.service_id).map((it) => ({ service_id: it.service_id, qty: Number(it.qty) })),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Gagal mengubah pesanan.')
      window.location.href = backToDetail
    } catch (err) {
      setError(err.message || 'Gagal mengubah pesanan.')
    } finally { setSaving(false) }
  }

  if (loading) return (
    <div className="h-full min-h-[60vh] flex items-center justify-center p-6 animate-fade-in">
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
  if (!order) return <div className="h-full overflow-y-auto pr-1 pt-2 pb-32 sm:pb-36 lg:pb-6 max-w-3xl text-center py-16 text-gray-400 font-bold">Pesanan tidak ditemukan.</div>

  return (
      <div className="h-full overflow-y-auto pr-1 pt-2 pb-32 sm:pb-36 lg:pb-6 max-w-3xl">
        <Link href={backToDetail} className="text-xs font-extrabold text-lavender-500">← Kembali ke detail</Link>
        <h1 className="text-2xl font-extrabold text-gray-800 mt-1">Ubah Pesanan #{id}</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-card border border-lavender-50 p-6 mt-4 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-500 text-xs font-bold px-4 py-3 rounded-2xl">{error}</div>}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-gray-600 mb-1">Nama</label>
              <input type="text" name="customer_name" value={form.customer_name} onChange={(e)=>setForm({...form, customer_name:e.target.value})} required className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold" />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-gray-600 mb-1">Nomor WhatsApp</label>
              <input type="tel" name="customer_wa" value={form.customer_wa} onChange={(e)=>setForm({...form, customer_wa:e.target.value})} placeholder="Contoh: 081234567890" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-extrabold text-gray-600 mb-1">Tanggal & Jam Usulan</label>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" name="tanggal_usulan" value={form.tanggal_usulan} onChange={(e)=>setForm({...form, tanggal_usulan:e.target.value})} required className="min-w-0 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold" />
                <input type="time" name="jam_usulan" min={setting.jam_mulai} max={setting.jam_selesai} value={form.jam_usulan} onChange={(e)=>setForm({...form, jam_usulan:e.target.value})} required className="min-w-0 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-extrabold text-gray-600 mb-1">Alamat</label>
            <textarea name="alamat" rows={2} value={form.alamat} onChange={(e)=>setForm({...form, alamat:e.target.value})} required className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold" />
          </div>
          <div>
            <label className="block text-xs font-extrabold text-gray-600 mb-1">Catatan Admin</label>
            <input type="text" name="catatan_admin" value={form.catatan_admin} onChange={(e)=>setForm({...form, catatan_admin:e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold" />
          </div>
          <div>
            <label className="block text-xs font-extrabold text-gray-600 mb-2">Item Layanan</label>
            <div id="itemRows" className="space-y-2">
              {form.items.map((it, idx) => (
                <div key={idx} className="flex flex-col min-[420px]:flex-row gap-2">
                  <select name="items[][service_id]" value={it.service_id} onChange={(e)=>{ const items=[...form.items]; items[idx]={...items[idx], service_id:e.target.value}; setForm({...form, items}) }} className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold">
                    {services.map(s => <option key={s.id} value={String(s.id)}>{s.name} - Rp{Number(s.price).toLocaleString('id-ID')}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <input type="number" name="items[][qty]" value={it.qty} min={1} max={20} onChange={(e)=>{ const items=[...form.items]; items[idx]={...items[idx], qty:e.target.value}; setForm({...form, items}) }} className="flex-1 min-[420px]:w-20 min-[420px]:flex-none px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold" />
                    <button type="button" onClick={()=>setForm({...form, items: form.items.length===1?form.items:form.items.filter((_,i)=>i!==idx)})} className="px-4 min-[420px]:px-3 rounded-xl bg-red-50 text-red-500 font-bold">×</button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={()=>addRow()} className="mt-2 px-4 py-2 rounded-full bg-lavender-50 text-lavender-600 text-xs font-extrabold">+ Tambah Item</button>
          </div>
          <button disabled={saving} className="w-full py-3 rounded-2xl bg-lavender-600 text-white font-extrabold text-sm">{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
        </form>
      </div>
  )
}
