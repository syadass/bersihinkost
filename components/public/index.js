'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

export default function PublicIndex() {
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState([])
  const [setting, setSetting] = useState({
    business_name: 'Bersihinkost',
    operator_name: 'Admin',
    admin_wa_number: '',
    is_open: true,
    jam_mulai: '08:00',
    jam_selesai: '17:00',
    catatan_publik: '',
  })
  const [closedDates, setClosedDates] = useState([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState([])
  const [filter, setFilter] = useState('All')
  const [form, setForm] = useState({ customer_name: '', customer_wa: '', alamat: '', tanggal_usulan: '', jam_usulan: '' })
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [sRes, setRes, hRes] = await Promise.all([
          fetch('/api/services', { cache: 'no-store' }),
          fetch('/api/settings', { cache: 'no-store' }),
          fetch('/api/holidays', { cache: 'no-store' }),
        ])
        const sData = await sRes.json().catch(() => ({}))
        const setData = await setRes.json().catch(() => ({}))
        const hData = await hRes.json().catch(() => ({}))
        if (cancelled) return
        const svcs = Array.isArray(sData.services) ? sData.services.filter((s) => s.is_active !== false) : []
        setServices(svcs)
        const cats = Array.isArray(sData.categories)
          ? sData.categories.map((c) => c.name || c).filter(Boolean)
          : Array.from(new Set(svcs.map((s) => s.category).filter(Boolean)))
        setCategories(cats)
        const st = setData.setting || {}
        const merged = { business_name: 'Bersihinkost', operator_name: 'Admin', admin_wa_number: '', is_open: true, jam_mulai: '08:00', jam_selesai: '17:00', catatan_publik: '', ...st }
        setSetting(merged)
        const dates = Array.isArray(hData.dates) ? hData.dates : (Array.isArray(hData.holidays) ? hData.holidays.map((h) => h.tanggal || h.date).filter(Boolean) : [])
        setClosedDates(dates.map((d) => String(d).slice(0, 10)))
        const today = new Date().toISOString().slice(0, 10)
        const defaultJam = (merged.jam_mulai <= '09:00' && '09:00' <= merged.jam_selesai) ? '09:00' : (merged.jam_mulai || '08:00')
        setForm((f) => ({ ...f, tanggal_usulan: f.tanggal_usulan || today, jam_usulan: f.jam_usulan || defaultJam }))
      } catch {
        // keep defaults
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const minTanggal = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n || 0))

  const filteredServices = useMemo(() => {
    if (filter === 'All') return services
    return services.filter((s) => s.category === filter)
  }, [services, filter])

  const totals = useMemo(() => {
    let sub = 0, mins = 0
    for (const item of cart) sub += Number(item.price || 0) * Number(item.qty || 0)
    for (const item of cart) mins += Number(item.duration_minutes || item.durationMin || 0) * Number(item.qty || 0)
    return { sub, mins }
  }, [cart])

  function addToCart(service) {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.id === service.id)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 }
        return copy
      }
      return [...prev, { id: service.id, name: service.name, price: Number(service.price || 0), qty: 1, duration_minutes: Number(service.duration_minutes || 0), image_url: service.image_url || '' }]
    })
  }

  function updateQty(id, delta) {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.id === id)
      if (idx < 0) return prev
      const copy = [...prev]
      const nextQty = copy[idx].qty + delta
      if (nextQty <= 0) copy.splice(idx, 1)
      else copy[idx] = { ...copy[idx], qty: nextQty }
      return copy
    })
  }

  function clearCart() { setCart([]) }

  async function checkoutOrder(e) {
    e?.preventDefault()
    setMsg({ type: '', text: '' })
    const name = form.customer_name.trim()
    const customerWa = (form.customer_wa || '').replace(/[^0-9]/g, '').replace(/^0/, '62')
    const alamat = form.alamat.trim()
    const tanggal = form.tanggal_usulan
    const jam = form.jam_usulan
    if (!name || !alamat || !tanggal || !jam) {
      setMsg({ type: 'error', text: 'Mohon isi Nama, WhatsApp, Alamat, Tanggal, dan Jam Usulan!' })
      return
    }
    if (!customerWa || customerWa.length < 9) {
      setMsg({ type: 'error', text: 'Mohon isi nomor WhatsApp yang valid (contoh: 081234567890).' })
      return
    }
    if (tanggal < minTanggal) {
      setMsg({ type: 'error', text: 'Tanggal tersebut belum bisa dipilih.' })
      return
    }
    if (closedDates.includes(tanggal)) {
      setMsg({ type: 'error', text: 'Tanggal tersebut libur/tutup. Pilih tanggal lain.' })
      return
    }
    if (jam < setting.jam_mulai || jam > setting.jam_selesai) {
      setMsg({ type: 'error', text: `Jam pengerjaan hanya ${setting.jam_mulai}–${setting.jam_selesai} WIB.` })
      return
    }
    if (!cart.length) {
      setMsg({ type: 'error', text: 'Pilih minimal satu layanan.' })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          customer_name: name,
          customer_wa: customerWa,
          alamat,
          tanggal_usulan: tanggal,
          jam_usulan: jam,
          items: cart.map((c) => ({ service_id: String(c.id), qty: Number(c.qty) })),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Gagal menyimpan pesanan.')
      window.location.href = data.success_url || `/orders/sukses/${data.order_id}`
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Gagal menyimpan pesanan.' })
    } finally {
      setSubmitting(false)
    }
  }

  const categoryButtons = ['All', ...categories]

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-lavender-100 px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-2 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-lavender-600 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0">
            <i className="fa-solid fa-broom text-sm"></i>
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-extrabold text-gray-800 tracking-tight truncate">{setting.business_name}</h1>
            <p className="text-[10px] sm:text-[11px] font-bold text-lavender-500 truncate">Layanan Kebersihan Khusus Anak Kost</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {setting.is_open ? (
            <span className="hidden sm:inline-block text-xs font-bold bg-lavender-50 text-lavender-600 px-4 py-2 rounded-full border border-lavender-100">
              <i className="fa-solid fa-circle text-[8px] text-emerald-500 mr-1.5 animate-pulse"></i> Buka Hari Ini · {setting.jam_mulai}–{setting.jam_selesai}
            </span>
          ) : (
            <span className="hidden sm:inline-block text-xs font-bold bg-red-50 text-red-500 px-4 py-2 rounded-full border border-red-100">Tutup Sementara</span>
          )}
          <Link href="/login" className="px-3 sm:px-4 py-2 rounded-full bg-peach-500 text-white font-extrabold text-[11px] sm:text-xs shadow-md hover:bg-peach-600 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
            <i className="fa-solid fa-lock text-[10px]"></i> <span className="hidden min-[400px]:inline">Login Pengelola</span><span className="min-[400px]:hidden">Login</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col min-w-0">
          <div className="bg-gradient-to-r from-lavender-600 to-lavender-800 rounded-3xl p-5 sm:p-8 text-white mb-4 sm:mb-6 shadow-float relative overflow-hidden flex flex-col justify-center">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            <span className="bg-white/20 text-white w-max px-3.5 py-1 rounded-full text-[11px] sm:text-xs font-bold mb-3 backdrop-blur-sm">Kost Bersih, Pikiran Tenang ✨</span>
            <h2 className="text-xl sm:text-3xl font-extrabold mb-2 leading-tight">Kamar Berantakan? Panggil Jasa Bersih Sekarang!</h2>
            <p className="text-lavender-100 text-xs sm:text-sm max-w-xl font-medium">Pilih paket pembersihan favoritmu, isi data & tanggal usulan — pesanan langsung masuk ke sistem dan menunggu konfirmasi admin. Admin akan menghubungi kamu via WhatsApp.</p>
          </div>

          <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-5 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
            {categoryButtons.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                className={filter === cat
                  ? 'px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-lavender-600 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 whitespace-nowrap'
                  : 'px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white text-gray-600 font-bold text-xs sm:text-sm shadow-card hover:bg-lavender-50 hover:text-lavender-600 transition-all flex items-center gap-2 whitespace-nowrap'}
              >
                {cat === 'All' ? <><i className="fa-solid fa-star text-[10px] sm:text-xs"></i> Semua Layanan</> : cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 pb-6">
            {loading ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 gap-3 animate-fade-in">
                <div className="relative w-16 h-16 rounded-full bg-white shadow-card border border-lavender-100 flex items-center justify-center">
                  <div className="absolute inset-1.5 rounded-full border-4 border-lavender-100 border-t-lavender-500 animate-spin" aria-hidden="true" />
                  <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-lavender-500 to-lavender-700 text-white flex items-center justify-center shadow-inner">
                    <i className="fa-solid fa-broom text-sm animate-pulse" />
                  </div>
                </div>
                <p className="text-sm font-extrabold text-lavender-500">Memuat layanan...</p>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="col-span-full text-center py-10 text-gray-400 font-bold">Layanan tidak tersedia.</div>
            ) : (
              filteredServices.map((p) => (
                <div key={p.id} onClick={() => addToCart(p)} className="bg-white p-2.5 sm:p-3.5 rounded-2xl sm:rounded-3xl shadow-card hover:shadow-lg transition-all cursor-pointer flex flex-col h-full border border-lavender-50 group min-w-0">
                  <div className="w-full h-24 sm:h-32 rounded-xl sm:rounded-2xl mb-2 sm:mb-3 overflow-hidden relative bg-lavender-50 flex items-center justify-center">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <i className="fa-solid fa-broom text-lavender-300 text-2xl"></i>
                    )}
                    <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-white/90 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold text-lavender-700">{p.duration_minutes} mnt</div>
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[9px] sm:text-[10px] font-extrabold uppercase text-lavender-400 tracking-wider mb-0.5 sm:mb-1 truncate">{p.category}</span>
                    <h4 className="text-xs sm:text-sm font-extrabold text-gray-800 leading-tight mb-1 sm:mb-2 line-clamp-2">{p.name}</h4>
                    <div className="mt-auto flex justify-between items-center gap-1 pt-1 sm:pt-2">
                      <span className="text-xs sm:text-sm font-extrabold text-peach-500 truncate">{fmt(p.price)}</span>
                      <span className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 rounded-full bg-lavender-50 text-lavender-600 flex items-center justify-center group-hover:bg-lavender-600 group-hover:text-white transition-colors"><i className="fa-solid fa-plus text-[10px] sm:text-xs"></i></span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-card p-4 sm:p-6 flex flex-col h-fit border border-lavender-50 lg:sticky lg:top-24">
          <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
            <h3 className="text-xl font-extrabold text-gray-800">Detail Pesananmu</h3>
            <button type="button" onClick={clearCart} className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 px-2.5 py-1 rounded-full transition-colors">Kosongkan</button>
          </div>

          <form onSubmit={checkoutOrder} className="space-y-3 mb-4">
            <div>
              <label className="block text-xs font-extrabold text-gray-600 mb-1">Nama <span className="text-peach-500">*</span></label>
              <input type="text" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} placeholder="Contoh: Budi Santoso" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400" />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-gray-600 mb-1">Nomor WhatsApp <span className="text-peach-500">*</span></label>
              <input type="tel" value={form.customer_wa} onChange={(e) => setForm({ ...form, customer_wa: e.target.value })} placeholder="Contoh: 081234567890" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400" />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-gray-600 mb-1">Alamat Kost / Kamar <span className="text-peach-500">*</span></label>
              <textarea rows={2} value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} placeholder="Contoh: Kost Mawar Jl. Slamet Riyadi No.12, Kamar 5" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400" />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-gray-600 mb-1">Tanggal &amp; Jam Usulan <span className="text-peach-500">*</span></label>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={form.tanggal_usulan} min={minTanggal} onChange={(e) => setForm({ ...form, tanggal_usulan: e.target.value })} className="min-w-0 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400" />
                <input type="time" value={form.jam_usulan} min={setting.jam_mulai} max={setting.jam_selesai} onChange={(e) => setForm({ ...form, jam_usulan: e.target.value })} className="min-w-0 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400" />
              </div>
              {setting.catatan_publik ? (
                <p className="text-[11px] text-gray-400 font-semibold mt-1">{setting.catatan_publik}</p>
              ) : null}
              {!setting.is_open ? (
                <p className="text-[11px] font-extrabold text-amber-600 mt-1">Sedang tutup — order tetap kami terima, pengerjaan paling cepat besok.</p>
              ) : (
                <p className="text-[11px] text-gray-400 font-semibold mt-1">Pengerjaan pukul {setting.jam_mulai}–{setting.jam_selesai} WIB. Tanggal libur tidak bisa dipilih.</p>
              )}
            </div>
          </form>

          <div className="flex-1 max-h-60 overflow-y-auto space-y-3 mb-4 pr-1">
            {cart.length === 0 ? (
              <div className="py-8 text-center text-gray-400">
                <i className="fa-solid fa-cart-shopping text-3xl mb-2 text-lavender-200"></i>
                <p className="text-sm font-bold">Belum ada layanan dipilih</p>
                <p className="text-xs text-gray-400">Klik salah satu layanan di samping</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="bg-gray-50 p-3 rounded-2xl flex items-center justify-between border border-gray-100">
                  <div className="flex-1 pr-2 min-w-0">
                    <h5 className="text-xs font-extrabold text-gray-800 truncate">{item.name}</h5>
                    <p className="text-[11px] font-bold text-peach-500">{fmt(item.price * item.qty)}</p>
                  </div>
                  <div className="flex items-center bg-white rounded-full p-1 border border-gray-200 shadow-sm shrink-0">
                    <button type="button" onClick={() => updateQty(item.id, -1)} className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-red-50 hover:text-red-500"><i className="fa-solid fa-minus text-[8px]"></i></button>
                    <span className="w-5 text-center text-xs font-bold text-gray-800">{item.qty}</span>
                    <button type="button" onClick={() => updateQty(item.id, 1)} className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-lavender-50 hover:text-lavender-500"><i className="fa-solid fa-plus text-[8px]"></i></button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2 mb-5 border-t border-dashed border-gray-200 pt-4">
            <div className="flex justify-between items-center text-sm font-bold text-gray-500">
              <span>Estimasi Pengerjaan</span><span>{totals.mins} Menit</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-base font-extrabold text-gray-800">Total Biaya</span>
              <span className="text-xl font-extrabold text-lavender-600">{fmt(totals.sub)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={checkoutOrder}
            disabled={!cart.length || submitting}
            className="w-full py-3.5 rounded-2xl bg-lavender-600 text-white font-extrabold text-sm shadow-lg shadow-lavender-200 hover:bg-lavender-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2"
          >
            <i className="fa-solid fa-paper-plane"></i> <span>{submitting ? 'Mengirim...' : 'Kirim Pesanan'}</span>
          </button>
          {msg.text ? (
            <p className={`text-xs font-bold text-center mt-2 ${msg.type === 'error' ? 'text-red-500' : 'text-emerald-600'}`}>{msg.text}</p>
          ) : null}
        </div>
      </main>

      <footer className="text-center py-6 text-xs font-bold text-gray-400 border-t border-lavender-100 mt-auto">
        &copy; {new Date().getFullYear()} {setting.business_name} {setting.operator_name}. Dikelola Secara Mandiri.
      </footer>
    </>
  )
}
