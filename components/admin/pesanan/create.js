'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
// Admin layout disediakan oleh app/admin/layout.js

export default function PesananCreate() {
  const [services, setServices] = useState([])
  const [setting, setSetting] = useState({ jam_mulai: '08:00', jam_selesai: '17:00' })
  const [form, setForm] = useState({
    customer_name: '',
    alamat: '',
    tanggal_fix: new Date().toISOString().split('T')[0],
    jam_fix: '09:00',
    items: [{ service_id: '', qty: 1 }],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/services', { cache: 'no-store' }).then(r => r.json()).then(d => {
      const svcs = d.services || []
      setServices(svcs)
      if (svcs[0]) setForm(f => ({ ...f, items: [{ service_id: String(svcs[0].id), qty: 1 }] }))
    }).catch(() => {})
    fetch('/api/settings', { cache: 'no-store' }).then(r => r.json()).then(d => { if (d.setting) setSetting(s => ({ ...s, ...d.setting })) }).catch(() => {})
  }, [])

  function addRow() {
    setForm(f => ({ ...f, items: [...f.items, { service_id: services[0]?.id ? String(services[0].id) : '', qty: 1 }] }))
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = {
        customer_name: form.customer_name,
        alamat: form.alamat,
        tanggal_fix: form.tanggal_fix,
        jam_fix: form.jam_fix,
        items: form.items.filter(it => it.service_id).map(it => ({ service_id: String(it.service_id), qty: Number(it.qty || 1) })),
      }
      const res = await fetch('/api/admin/orders/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Gagal menyimpan jadwal.')
      window.location.href = '/admin/pesanan?tab=terjadwal'
    } catch (err) {
      setError(err.message || 'Gagal menyimpan jadwal.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto pr-1 pt-2 pb-6 max-w-3xl">
      <Link href="/admin/pesanan" className="text-xs font-extrabold text-lavender-500">← Kembali ke daftar</Link>
      <h1 className="text-2xl font-extrabold text-gray-800 mt-1">Buat Jadwal Manual</h1>
      <p className="text-sm font-bold text-lavender-500">Order walk-in / telepon — langsung tercatat <span className="text-emerald-500">Confirmed</span></p>

      <form onSubmit={submit} className="bg-white rounded-3xl shadow-card border border-lavender-50 p-6 mt-4 space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-500 text-xs font-bold px-4 py-3 rounded-2xl">{error}</div>}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-extrabold text-gray-600 mb-1">Nama Pemesan <span className="text-peach-500">*</span></label>
            <input type="text" name="customer_name" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold" />
          </div>
          <div>
            <label className="block text-xs font-extrabold text-gray-600 mb-1">Tanggal & Jam Pengerjaan (fix) <span className="text-peach-500">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" name="tanggal_fix" value={form.tanggal_fix} onChange={(e) => setForm({ ...form, tanggal_fix: e.target.value })} required className="min-w-0 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold" />
              <input type="time" name="jam_fix" min={setting.jam_mulai} max={setting.jam_selesai} value={form.jam_fix} onChange={(e) => setForm({ ...form, jam_fix: e.target.value })} required className="min-w-0 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold" />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-xs font-extrabold text-gray-600 mb-1">Alamat Kost / Kamar <span className="text-peach-500">*</span></label>
          <textarea name="alamat" rows={2} value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold" />
        </div>
        <div>
          <label className="block text-xs font-extrabold text-gray-600 mb-2">Item Layanan</label>
          <div id="itemRows" className="space-y-2">
            {form.items.map((it, idx) => (
              <div key={idx} className="flex flex-col min-[420px]:flex-row gap-2">
                <select name="items[][service_id]" value={it.service_id} onChange={(e) => { const items = [...form.items]; items[idx] = { ...items[idx], service_id: e.target.value }; setForm({ ...form, items }) }} className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold">
                  {services.map(s => <option key={s.id} value={String(s.id)}>{s.name} - Rp{Number(s.price).toLocaleString('id-ID')}</option>)}
                </select>
                <div className="flex gap-2">
                  <input type="number" name="items[][qty]" value={it.qty} min={1} max={20} onChange={(e) => { const items = [...form.items]; items[idx] = { ...items[idx], qty: e.target.value }; setForm({ ...form, items }) }} className="flex-1 min-[420px]:w-20 min-[420px]:flex-none px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold" />
                  <button type="button" onClick={() => setForm({ ...form, items: form.items.length === 1 ? form.items : form.items.filter((_, i) => i !== idx) })} className="px-4 min-[420px]:px-3 rounded-xl bg-red-50 text-red-500 font-bold">×</button>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addRow} className="mt-2 px-4 py-2 rounded-full bg-lavender-50 text-lavender-600 text-xs font-extrabold">+ Tambah Item</button>
        </div>
        <button disabled={saving} className="w-full py-3 rounded-2xl bg-lavender-600 text-white font-extrabold text-sm">{saving ? 'Menyimpan...' : 'Simpan Jadwal'}</button>
      </form>
    </div>
  )
}
