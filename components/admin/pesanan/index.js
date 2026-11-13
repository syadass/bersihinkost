'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AdminLayout, { useConfirmModal } from '@/components/layouts/admin'

const tabsDef = {
  all: { icon: 'fa-layer-group', color: '', label: 'Semua' },
  'menunggu-acc': { icon: 'fa-clock', color: 'text-amber-500', label: 'Menunggu ACC' },
  terjadwal: { icon: 'fa-calendar-check', color: 'text-lavender-500', label: 'Menunggu Eksekusi' },
  selesai: { icon: 'fa-circle-check', color: 'text-emerald-500', label: 'Selesai' },
  batal: { icon: 'fa-ban', color: 'text-red-500', label: 'Batal' },
}
const miniBadge = {
  pending: 'bg-amber-100 text-amber-700',
  rescheduled: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-lavender-100 text-lavender-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-500',
}
const miniLabel = { pending: 'Menunggu ACC', rescheduled: 'Pindah Tanggal', confirmed: 'Terjadwal', completed: 'Selesai', cancelled: 'Batal' }
const activeCls = 'px-5 py-2.5 rounded-full bg-lavender-600 text-white font-bold text-sm shadow-md flex items-center gap-2 whitespace-nowrap transition-transform hover:scale-105'
const idleCls = 'px-5 py-2.5 rounded-full bg-white text-gray-600 font-bold text-sm shadow-card hover:bg-lavender-50 hover:text-lavender-600 transition-all flex items-center gap-2 whitespace-nowrap'

function toDateValue(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${da}`
}
function toTimeValue(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const h = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${mi}`
}
function fmtDateShort(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtTime(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' })
}

export default function PesananIndex({ userName = 'Administrator' }) {
  return (
    <AdminLayout>
      <PesananIndexInner userName={userName} />
    </AdminLayout>
  )
}

function PesananIndexInner({ userName }) {
  const router = useRouter()
  const confirm = useConfirmModal()
  const [searchParams, setSearchParams] = useState({ tab: 'all', sort: 'terbaru', search: '', bulan: 'all', tahun: 'all', page: '1' })
  const [initialized, setInitialized] = useState(false)
  const [data, setData] = useState({ orders: [], counts: {}, page: 1, totalPages: 1, total: 0, years: [] })
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [setting, setSetting] = useState({ jam_mulai: '08:00', jam_selesai: '17:00' })
  const [services, setServices] = useState([])
  const [displayName, setDisplayName] = useState(userName || 'Administrator')
  const [manualOpen, setManualOpen] = useState(false)
  const [manualForm, setManualForm] = useState({ customer_name: '', customer_wa: '', alamat: '', tanggal_fix: new Date().toISOString().slice(0,10), jam_fix: '09:00', items: [{ service_id: '', qty: 1 }] })
  const [manualErr, setManualErr] = useState('')
  const [openMenuId, setOpenMenuId] = useState(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const [menuAnchor, setMenuAnchor] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const sp = new URLSearchParams(window.location.search)
    const next = {
      tab: sp.get('tab') || 'all',
      sort: sp.get('sort') || 'terbaru',
      search: sp.get('search') || '',
      bulan: sp.get('bulan') || 'all',
      tahun: sp.get('tahun') || 'all',
      page: sp.get('page') || '1',
    }
    setSearchParams(next)
    setSearchInput(next.search)
    setInitialized(true)
  }, [])

  const { tab, sort, search, bulan, tahun, page } = searchParams

  const qs = (params) => {
    const s = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '' && !(k === 'tab' && v === 'all') && !(k === 'sort' && v === 'terbaru') && !(k === 'bulan' && v === 'all') && !(k === 'tahun' && v === 'all') && !(k === 'page' && String(v) === '1')) s.set(k, String(v))
    }
    return s.toString()
  }
  const fullQs = (params) => {
    const s = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') s.set(k, String(v))
    }
    return s.toString()
  }

  const navigateWith = (patch) => {
    const next = { ...searchParams, ...patch }
    if (!('page' in patch)) next.page = '1'
    setSearchParams(next)
    const q = qs(next)
    router.push(`/admin/pesanan${q ? `?${q}` : ''}`)
  }

  async function load() {
    if (!initialized) return
    setLoading(true)
    try {
      const url = `/api/orders?${fullQs({ tab, sort, search, bulan, tahun, page })}`
      const r = await fetch(url, { cache: 'no-store' })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d?.message || 'Gagal memuat pesanan')
      setData(d || { orders: [], counts: {}, page: 1, totalPages: 1, total: 0, years: [] })
    } catch {
      setData({ orders: [], counts: {}, page: 1, totalPages: 1, total: 0, years: [] })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [initialized, tab, sort, search, bulan, tahun, page])

  useEffect(() => {
    fetch('/api/settings', { cache: 'no-store' }).then(r=>r.json()).then(d=>{
      if(d.setting) {
        setSetting(s=>({...s, ...d.setting}))
        if (d.setting.operator_name) setDisplayName(d.setting.operator_name)
      }
    }).catch(()=>{})
    fetch('/api/services', { cache: 'no-store' }).then(r=>r.json()).then(d=>{
      const sv = (d.services || []).map(s=>({id:s.id,name:s.name,price:s.price}))
      setServices(sv)
      setManualForm(f=>({ ...f, items: f.items?.length && f.items[0].service_id ? f.items : [{ service_id: sv[0]?.id || '', qty: 1 }] }))
    }).catch(()=>{})
  }, [])

  useEffect(() => {
    function closeMenu(e){
      if (menuRef.current && e?.target && menuRef.current.contains(e.target)) return
      setOpenMenuId(null); setMenuAnchor(null)
    }
    function onKey(e){ if(e.key==='Escape'){ setOpenMenuId(null); setMenuAnchor(null); setManualOpen(false) } }
    document.addEventListener('click', closeMenu)
    document.addEventListener('keydown', onKey)
    document.addEventListener('scroll', closeMenu, true)
    return () => { document.removeEventListener('click', closeMenu); document.removeEventListener('keydown', onKey); document.removeEventListener('scroll', closeMenu, true) }
  }, [])

  useLayoutEffect(() => {
    if (!openMenuId || !menuRef.current || !menuAnchor) return
    const menu = menuRef.current
    const { height, width } = menu.getBoundingClientRect()
    const menuW = width || 224
    let left = menuAnchor.right - menuW
    left = Math.max(8, Math.min(left, window.innerWidth - menuW - 8))
    let top = menuAnchor.bottom + 6
    if (top + height > window.innerHeight - 8) {
      top = menuAnchor.top - height - 6
    }
    if (top < 8) top = 8
    if (top + height > window.innerHeight - 8) top = Math.max(8, window.innerHeight - height - 8)
    setMenuPos((p) => (p.top === top && p.left === left ? p : { top, left }))
  }, [openMenuId, menuAnchor, data.orders])

  const years = useMemo(() => (Array.isArray(data.years) ? data.years : []).map(String), [data.years])

  function sortLink(asc, desc) {
    const next = sort === asc ? desc : asc
    return { ...searchParams, sort: next, page: '1' }
  }
  function arrow(asc, desc) {
    if (sort === asc) return <i className="fa-solid fa-arrow-up text-[10px] ml-1"></i>
    if (sort === desc) return <i className="fa-solid fa-arrow-down text-[10px] ml-1"></i>
    return <i className="fa-solid fa-sort text-[10px] ml-1 opacity-40"></i>
  }

  async function doPatch(id, body, successMsg) {
    const r = await fetch(`/api/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const d = await r.json().catch(()=>({}))
    if (!r.ok) { alert(d.message || 'Gagal memproses.'); return }
    if (!d.customer_notified && d.customer_wa_link) window.open(d.customer_wa_link, '_blank')
    await load()
  }
  async function doDelete(id) {
    const r = await fetch(`/api/orders/${id}`, { method: 'DELETE' })
    const d = await r.json().catch(()=>({}))
    if (!r.ok) { alert(d.message || 'Gagal menghapus.'); return }
    await load()
  }

  function submitSearch(e) {
    e.preventDefault()
    navigateWith({ search: searchInput })
  }

  async function printLaporan(btn) {
    const q = fullQs({ search, bulan, tahun })
    const url = `/admin/pesanan/laporan${q ? `?${q}` : ''}`
    const original = btn?.innerHTML
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-[10px]"></i> Menyiapkan...' }
    try {
      const res = await fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const html = await res.text()
      const src = new DOMParser().parseFromString(html, 'text/html').getElementById('laporanPdf')
      if (!src) throw new Error('empty')
      const root = document.getElementById('printRoot')
      if (!root) throw new Error('no root')
      root.innerHTML = src.innerHTML
      document.body.classList.add('printing')
      window.print()
    } catch (e) {
      alert('Gagal menyiapkan laporan. Silakan coba lagi.')
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = original || 'Cetak' }
      setTimeout(() => {
        document.body.classList.remove('printing')
        const pr = document.getElementById('printRoot')
        if (pr) pr.innerHTML = ''
      }, 0)
    }
  }

  const initials = (() => {
    const parts = String(displayName || 'A').trim().split(/\s+/)
    return ((parts[0]?.[0] || 'A') + (parts[1]?.[0] || '')).toUpperCase()
  })()

  const fromUrl = typeof window !== 'undefined' ? (window.location.pathname + window.location.search || '/admin/pesanan') : '/admin/pesanan'

  return (
    <>
      {/* Header */}
      <header className="mb-5 sm:mb-6 pt-2">
        <div className="flex flex-col xl:flex-row xl:items-center gap-3">
          <div className="shrink-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">Kelola Pesanan Masuk</h1>
            <p className="text-xs sm:text-sm font-bold text-lavender-500">Daftar booking pembersihan kamar kost dari pemesan</p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 xl:ml-auto min-w-0">
            <div className="flex flex-col min-[480px]:flex-row min-[480px]:items-center gap-2 sm:gap-3 min-w-0">
              <form onSubmit={submitSearch} className="relative flex-1 sm:flex-none sm:w-64 md:w-72 min-w-0">
                <input type="hidden" name="tab" value={tab} />
                <span className="absolute inset-y-0 left-0 flex items-center pl-5 text-gray-400">
                  <i className="fa-solid fa-magnifying-glass"></i>
                </span>
                <input type="text" name="search" value={searchInput} onChange={(e)=>setSearchInput(e.target.value)} id="searchOrderInput" placeholder="Cari nama atau alamat..." className="w-full pl-12 pr-4 py-3 sm:py-3.5 rounded-3xl bg-white border-none shadow-card text-sm font-bold text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lavender-400 transition-all" />
              </form>

              <div className="flex items-center gap-2 shrink-0">
                <button type="button" onClick={()=>{ setManualErr(''); setManualForm({ customer_name: '', customer_wa: '', alamat: '', tanggal_fix: new Date().toISOString().slice(0, 10), jam_fix: '09:00', items: [{ service_id: services[0]?.id ? String(services[0].id) : '', qty: 1 }] }); setManualOpen(true) }} className="flex-1 min-[480px]:flex-none px-4 py-3 rounded-3xl bg-peach-500 text-white font-extrabold text-xs shadow-md hover:bg-peach-600 transition-all flex items-center justify-center gap-2 whitespace-nowrap" title="Buat jadwal manual">
                  <i className="fa-solid fa-plus text-[10px]"></i> Buat Manual
                </button>

                {tab === 'selesai' && (
                  <button type="button" onClick={(e) => printLaporan(e.currentTarget)} className="flex-1 min-[480px]:flex-none px-4 py-3 rounded-3xl bg-emerald-500 text-white font-extrabold text-xs shadow-md hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-70" title="Cetak laporan pemasukan">
                    <i className="fa-solid fa-print text-[10px]"></i> Cetak
                  </button>
                )}
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-3 bg-white pl-3 pr-5 py-2 rounded-full shadow-card border border-lavender-100 shrink-0 xl:self-auto">
              <div className="w-10 h-10 rounded-full bg-peach-100 text-peach-600 flex items-center justify-center font-extrabold border-2 border-white shadow-sm">
                {initials}
              </div>
              <div>
                <p className="text-sm font-extrabold text-gray-800 leading-tight">{displayName}</p>
                <p className="text-[10px] font-extrabold text-peach-500 uppercase tracking-wider">Solo Operator</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-20 flex flex-col sm:flex-row sm:items-center gap-2 mb-7 sm:mb-8">
        {/* Status Filter Tabs */}
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0 flex-1 min-w-0" id="statusFilterContainer">
          {Object.entries(tabsDef).map(([key, t]) => (
            <button key={key} type="button" onClick={()=>navigateWith({ tab: key })} className={tab === key ? activeCls : idleCls}>
              <i className={`fa-solid ${t.icon} text-xs ${tab === key ? '' : t.color}`}></i> {t.label} (<span>{data.counts?.[key] ?? 0}</span>)
            </button>
          ))}
        </div>
        {/* Filter Periode Pengerjaan */}
        <div className="shrink-0 flex items-center gap-2 pb-1 sm:pb-0 sm:ml-auto sm:justify-end">
          <input
            type="month"
            value={(bulan !== 'all' && tahun !== 'all') ? `${tahun}-${String(bulan).padStart(2,'0')}` : ''}
            onChange={(e) => {
              const v = e.target.value
              if (!v) { navigateWith({ bulan: 'all', tahun: 'all' }); return }
              const [y, m] = v.split('-')
              navigateWith({ bulan: String(Number(m)), tahun: String(Number(y)) })
            }}
            title="Pilih bulan & tahun pengerjaan"
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-full bg-white border-none shadow-card text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400 cursor-pointer"
          />
          <button type="button" onClick={() => navigateWith({ bulan: 'all', tahun: 'all' })} className={`px-5 py-2.5 rounded-full text-sm font-bold shadow-card whitespace-nowrap transition-colors ${(bulan === 'all' && tahun === 'all') ? 'bg-lavender-600 text-white' : 'bg-white text-gray-600 hover:bg-lavender-50'}`}>
            Semua Periode
          </button>
        </div>
      </div>

      {/* Orders Table / List Container */}
      <div className="flex-1 overflow-y-auto pb-6 sm:pr-2 min-h-0">
        {/* Mobile cards */}
        <div className="grid gap-3 md:hidden">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-card border border-lavender-50 p-4 animate-fade-in">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-4 w-40 rounded-lg skeleton"></div>
                    <div className="h-3 w-56 max-w-full rounded-lg skeleton"></div>
                  </div>
                  <div className="h-6 w-20 rounded-full skeleton shrink-0"></div>
                </div>
                <div className="h-3 w-full rounded-lg skeleton mb-3"></div>
                <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-100">
                  <div className="h-3 w-28 rounded-lg skeleton"></div>
                  <div className="h-4 w-20 rounded-lg skeleton"></div>
                </div>
              </div>
            ))
          ) : (data.orders || []).length ? (
            <div className="grid gap-3 animate-fade-in">
              {(data.orders || []).map((order) => (
                <Link key={order.id} href={`/admin/pesanan/${order.id}?from=${encodeURIComponent(fromUrl)}`} className="block bg-white rounded-2xl shadow-card border border-lavender-50 p-4 active:scale-[0.99] transition-all duration-200 hover:shadow-md">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-gray-800 truncate">#{order.id} • {order.customer_name}</p>
                      <p className="text-[11px] font-semibold text-gray-400 truncate">{order.alamat}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold whitespace-nowrap shrink-0 ${miniBadge[order.status] || 'bg-gray-100 text-gray-500'}`}>{miniLabel[order.status] || order.status}</span>
                  </div>
                  <p className="text-[11px] font-semibold text-gray-500 truncate mb-2">{(order.items || []).map(i=>`${i.service_name} (${i.qty}x)`).join(', ')}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-100">
                    <span className="text-[11px] font-bold text-gray-400"><i className="fa-regular fa-clock mr-1"></i>{fmtDateShort(order.tanggal_fix || order.tanggal_usulan)}, {fmtTime(order.tanggal_fix || order.tanggal_usulan)}</span>
                    <span className="text-sm font-extrabold text-gray-800">Rp{Number(order.total_harga||0).toLocaleString('id-ID')}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-14 bg-white rounded-2xl shadow-card border border-lavender-50 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-lavender-50 text-lavender-300 flex items-center justify-center text-2xl mb-3 border-2 border-dashed border-lavender-200">
                <i className="fa-solid fa-inbox"></i>
              </div>
              <p className="text-sm font-extrabold text-gray-700">Tidak ada pesanan ditemukan</p>
              <p className="text-[11px] font-medium text-gray-400 mt-1">Pesanan baru dari pemesan kost akan muncul di sini</p>
            </div>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block bg-white rounded-3xl shadow-card border border-lavender-50 transition-all duration-300">
          <div className="table-scroll overflow-x-auto rounded-3xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-lavender-50/50 text-gray-500 text-xs font-extrabold uppercase tracking-wider">
                  <th className="py-4 px-6"><button type="button" onClick={()=>navigateWith(sortLink('id_asc','id_desc'))} className="inline-flex items-center hover:text-lavender-600 transition-colors" title="Urutkan ID">ID {arrow('id_asc','id_desc')}</button></th>
                  <th className="py-4 px-6"><button type="button" onClick={()=>navigateWith(sortLink('nama_asc','nama_desc'))} className="inline-flex items-center hover:text-lavender-600 transition-colors" title="Urutkan nama">Pemesan {arrow('nama_asc','nama_desc')}</button></th>
                  <th className="py-4 px-6">Layanan</th>
                  <th className="py-4 px-6"><button type="button" onClick={()=>navigateWith(sortLink('fix_asc','fix_desc'))} className="inline-flex items-center hover:text-lavender-600 transition-colors" title="Urutkan tanggal pengerjaan (fix)">Jadwal {arrow('fix_asc','fix_desc')}</button></th>
                  <th className="py-4 px-6">Tarif</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody id="ordersTableBody" className={`divide-y divide-gray-100 text-sm font-semibold text-gray-700 transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100 animate-fade-in'}`}>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`s-${i}`}>
                      <td className="py-4 px-6"><div className="h-4 w-10 rounded-lg skeleton"></div></td>
                      <td className="py-4 px-6"><div className="space-y-2"><div className="h-4 w-28 rounded-lg skeleton"></div><div className="h-3 w-40 rounded-lg skeleton"></div></div></td>
                      <td className="py-4 px-6"><div className="h-4 w-44 rounded-lg skeleton"></div></td>
                      <td className="py-4 px-6"><div className="space-y-2"><div className="h-4 w-24 rounded-lg skeleton"></div><div className="h-3 w-20 rounded-lg skeleton"></div></div></td>
                      <td className="py-4 px-6"><div className="h-4 w-20 rounded-lg skeleton"></div></td>
                      <td className="py-4 px-6"><div className="h-6 w-24 rounded-full skeleton"></div></td>
                      <td className="py-4 px-6"><div className="h-8 w-16 mx-auto rounded-xl skeleton"></div></td>
                    </tr>
                  ))
                ) : (data.orders || []).map((order) => {
                  const svcText = (order.items || []).map(i=>`${i.service_name} (${i.qty}x)`).join(', ')
                  const jadwal = order.tanggal_fix || order.tanggal_usulan
                  return (
                    <tr key={order.id} className="hover:bg-lavender-50/30 transition-colors duration-200">
                      <td className="py-4 px-6">
                        <span className="font-extrabold text-gray-800 block whitespace-nowrap">#{order.id}</span>
                      </td>
                      <td className="py-4 px-6 max-w-[220px]">
                        <span className="font-extrabold text-gray-800 block">{order.customer_name}</span>
                        <span className="text-xs font-medium text-gray-400 block truncate" title={order.alamat}>{order.alamat}</span>
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-600 max-w-[220px]" title={svcText}>
                        {svcText.length > 50 ? svcText.slice(0,50)+'…' : svcText}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="text-sm font-extrabold text-gray-800 block">{fmtDateShort(jadwal)}</span>
                        <span className="text-[11px] font-bold text-gray-400 block"><i className="fa-regular fa-clock mr-1"></i>{fmtTime(jadwal)} WIB</span>
                      </td>
                      <td className="py-4 px-6 font-extrabold text-gray-800 whitespace-nowrap">
                        Rp{Number(order.total_harga||0).toLocaleString('id-ID')}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold transition-colors ${miniBadge[order.status] || 'bg-gray-100 text-gray-500'}`}>{miniLabel[order.status] || order.status}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-1.5">
                          {['pending','rescheduled'].includes(order.status) ? (
                            <form onSubmit={(e)=>{ e.preventDefault(); const fd=new FormData(e.currentTarget); confirm.open({ title:'ACC Pesanan?', message:`Pesanan #${order.id} akan di-ACC.`, confirmText:'Ya, ACC', tone:'emerald', icon:'fa-check', onConfirm:()=>doPatch(order.id,{ action:'acc', tanggal_fix:fd.get('tanggal_fix'), jam_fix:fd.get('jam_fix') }) }) }} title={`ACC (fix: ${fmtDateShort(jadwal)}, ${fmtTime(jadwal)})`}>
                              <input type="hidden" name="tanggal_fix" value={toDateValue(jadwal)} />
                              <input type="hidden" name="jam_fix" value={toTimeValue(jadwal)} />
                              <button className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-all duration-200 shadow-sm" title="ACC Pesanan">
                                <i className="fa-solid fa-check text-xs"></i>
                              </button>
                            </form>
                          ) : order.status === 'confirmed' ? (
                            <button onClick={()=>confirm.open({ title:'Tandai Selesai?', message:`Order #${order.id} akan ditandai selesai dan masuk kas.`, confirmText:'Ya, Selesaikan', tone:'emerald', icon:'fa-check-double', onConfirm:()=>doPatch(order.id,{ status:'completed' }) })} className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-all duration-200 shadow-sm" title="Selesaikan Pesanan">
                              <i className="fa-solid fa-check-double text-xs"></i>
                            </button>
                          ) : (
                            <Link href={`/admin/pesanan/${order.id}?from=${encodeURIComponent(fromUrl)}`} title="Detail" className="w-8 h-8 rounded-xl bg-lavender-600 text-white flex items-center justify-center hover:bg-lavender-700 transition-all duration-200 shadow-sm">
                              <i className="fa-solid fa-eye text-xs"></i>
                            </Link>
                          )}

                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e)=>{
                                e.preventDefault()
                                e.stopPropagation()
                                e.nativeEvent?.stopImmediatePropagation?.()
                                if (openMenuId === order.id) { setOpenMenuId(null); setMenuAnchor(null); return }
                                const rect = e.currentTarget.getBoundingClientRect()
                                const menuW = 224
                                let left = rect.right - menuW
                                left = Math.max(8, Math.min(left, window.innerWidth - menuW - 8))
                                const top = Math.min(rect.bottom + 6, window.innerHeight - 16)
                                setMenuPos({ top, left })
                                setMenuAnchor({ top: rect.top, bottom: rect.bottom, right: rect.right })
                                setOpenMenuId(order.id)
                              }}
                              title="Aksi lain"
                              className="w-8 h-8 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-all duration-200"
                            >
                              <i className="fa-solid fa-ellipsis-vertical text-xs"></i>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div id="emptyOrders" className={`${!loading && (data.orders||[]).length===0 ? 'flex' : 'hidden'} flex-col items-center justify-center text-center py-16 animate-fade-in`}>
            <div className="w-20 h-20 rounded-full bg-lavender-50 text-lavender-300 flex items-center justify-center text-3xl mb-3 border-2 border-dashed border-lavender-200">
              <i className="fa-solid fa-inbox"></i>
            </div>
            <p className="text-base font-extrabold text-gray-700">Tidak ada pesanan ditemukan</p>
            <p className="text-xs font-medium text-gray-400 mt-1">Pesanan baru dari pemesan kost akan muncul di sini</p>
          </div>
        </div>

        <div className="mt-4 flex flex-col min-[480px]:flex-row min-[480px]:items-center gap-2 min-[480px]:justify-between">
          <p className="text-xs font-bold text-gray-400 text-center min-[480px]:text-left">
            Menampilkan {((data.page||1)-1)*5 + ((data.orders||[]).length?1:0)}–{((data.page||1)-1)*5 + (data.orders||[]).length} dari {data.total||0} pesanan
          </p>
          <div className="flex items-center justify-center gap-2">
            {(data.page||1) <= 1 ? (
              <span className="px-4 py-2 rounded-full bg-white text-gray-300 font-extrabold text-xs shadow-card cursor-not-allowed select-none">‹ Prev</span>
            ) : (
              <button type="button" onClick={()=>navigateWith({ page: String((data.page||1)-1) })} className="px-4 py-2 rounded-full bg-white text-lavender-600 font-extrabold text-xs shadow-card hover:bg-lavender-600 hover:text-white transition-all">‹ Prev</button>
            )}
            <span className="min-w-[2.5rem] text-center px-4 py-2 rounded-full bg-lavender-600 text-white font-extrabold text-xs shadow-md select-none">{data.page||1}</span>
            {(data.page||1) >= (data.totalPages||1) ? (
              <span className="px-4 py-2 rounded-full bg-white text-gray-300 font-extrabold text-xs shadow-card cursor-not-allowed select-none">Next ›</span>
            ) : (
              <button type="button" onClick={()=>navigateWith({ page: String((data.page||1)+1) })} className="px-4 py-2 rounded-full bg-white text-lavender-600 font-extrabold text-xs shadow-card hover:bg-lavender-600 hover:text-white transition-all">Next ›</button>
            )}
          </div>
        </div>
      </div>

      {openMenuId && (() => {
        const order = (data.orders || []).find(o => o.id === openMenuId)
        if (!order) return null
        return (
          <div ref={menuRef} className="fixed w-56 bg-white rounded-2xl shadow-float border border-lavender-100 p-2 z-[60] max-h-[calc(100vh-16px)] overflow-auto" style={{ top: menuPos.top, left: menuPos.left }} onClick={(e)=>e.stopPropagation()}>
            <Link href={`/admin/pesanan/${order.id}?from=${encodeURIComponent(fromUrl)}`} onClick={()=>setOpenMenuId(null)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-lavender-50 hover:text-lavender-600">
              <i className="fa-solid fa-eye w-4 text-center"></i> Detail Pesanan
            </Link>
            {!['completed','cancelled'].includes(order.status) && (
              <>
                <Link href={`/admin/pesanan/${order.id}/edit?from=${encodeURIComponent(fromUrl)}`} onClick={()=>setOpenMenuId(null)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-lavender-50 hover:text-lavender-600">
                  <i className="fa-solid fa-pen-to-square w-4 text-center"></i> Ubah Pesanan
                </Link>
                <form onSubmit={(e)=>{ e.preventDefault(); const alasan=e.currentTarget.alasan_batal.value; if(!alasan) return; setOpenMenuId(null); confirm.open({ title:'Batalkan Pesanan?', message:`Order #${order.id} akan dibatalkan (fix batal) tanpa mengirim WhatsApp.`, confirmText:'Ya, Batalkan', tone:'red', icon:'fa-ban', onConfirm:()=>doPatch(order.id,{ alasan_batal: alasan }) }) }} className="mt-1 pt-2 border-t border-dashed border-gray-200">
                  <input type="text" name="alasan_batal" required placeholder="Alasan batal..." className="w-full text-[11px] font-bold bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-red-300 mb-1.5" />
                  <button className="w-full py-2 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 flex items-center justify-center gap-1.5">
                    <i className="fa-solid fa-ban"></i> Batalkan Pesanan
                  </button>
                </form>
              </>
            )}
            {['cancelled','completed'].includes(order.status) && (
              <div className="mt-1 pt-2 border-t border-dashed border-gray-200">
                <button onClick={()=>{ setOpenMenuId(null); confirm.open({ title:'Hapus Pesanan?', message:`Riwayat pesanan #${order.id} akan dihapus permanen.`, confirmText:'Ya, Hapus', tone:'red', icon:'fa-trash-can', onConfirm:()=>doDelete(order.id) }) }} className="w-full py-2 rounded-xl bg-red-50 text-red-500 text-xs font-bold hover:bg-red-100 flex items-center justify-center gap-1.5">
                  <i className="fa-solid fa-trash-can"></i> Hapus Pesanan
                </button>
              </div>
            )}
          </div>
        )
      })()}

      {/* Modal Buat Jadwal Manual */}
      {manualOpen && (
        <div id="manualModal" className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto" onClick={(e)=>{ if(e.target.id==='manualModal') setManualOpen(false) }}>
          <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-float w-full max-w-2xl border border-lavender-50 relative my-auto max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center gap-3 p-5 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="text-lg font-extrabold text-gray-800">Buat Jadwal Manual</h3>
                <p className="text-xs font-semibold text-gray-400">Order walk-in / telepon — langsung tercatat <span className="text-emerald-500 font-extrabold">Confirmed</span></p>
              </div>
              <button type="button" onClick={()=>setManualOpen(false)} className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 shrink-0">
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>
            <form onSubmit={async (e)=>{
              e.preventDefault(); setManualErr('')
              try {
                const payload = { customer_name: manualForm.customer_name, customer_wa: manualForm.customer_wa, alamat: manualForm.alamat, tanggal_fix: manualForm.tanggal_fix, jam_fix: manualForm.jam_fix, items: manualForm.items.filter(i=>i.service_id).map(i=>({service_id:String(i.service_id), qty:Number(i.qty||1)})) }
                const r = await fetch('/api/admin/orders/manual', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
                const d = await r.json().catch(()=>({}))
                if(!r.ok) throw new Error(d.message||'Gagal menyimpan jadwal.')
                setManualOpen(false)
                setManualForm({
                  customer_name: '',
                  customer_wa: '',
                  alamat: '',
                  tanggal_fix: new Date().toISOString().slice(0, 10),
                  jam_fix: '09:00',
                  items: [{ service_id: services[0]?.id ? String(services[0].id) : '', qty: 1 }],
                })
                setSearchInput('')
                setSearchParams({ tab: 'terjadwal', sort: 'terbaru', search: '', bulan: 'all', tahun: 'all', page: '1' })
                router.replace('/admin/pesanan?tab=terjadwal')
              } catch(err){ setManualErr(err.message||'Gagal menyimpan jadwal.') }
            }} className="overflow-y-auto p-5 space-y-4">
              {manualErr && <div className="bg-red-50 border border-red-200 text-red-500 text-xs font-bold px-4 py-3 rounded-2xl">{manualErr}</div>}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-gray-600 mb-1">Nama Pemesan <span className="text-peach-500">*</span></label>
                  <input type="text" value={manualForm.customer_name} onChange={(e)=>setManualForm({...manualForm,customer_name:e.target.value})} required className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-peach-400" />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-gray-600 mb-1">Nomor WhatsApp</label>
                  <input type="tel" value={manualForm.customer_wa} onChange={(e)=>setManualForm({...manualForm,customer_wa:e.target.value})} placeholder="Contoh: 081234567890" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-peach-400" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-extrabold text-gray-600 mb-1">Tanggal & Jam Pengerjaan (fix) <span className="text-peach-500">*</span></label>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={manualForm.tanggal_fix} onChange={(e)=>setManualForm({...manualForm,tanggal_fix:e.target.value})} required className="min-w-0 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-peach-400" />
                    <input type="time" min={setting.jam_mulai} max={setting.jam_selesai} value={manualForm.jam_fix} onChange={(e)=>setManualForm({...manualForm,jam_fix:e.target.value})} required className="min-w-0 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-peach-400" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-extrabold text-gray-600 mb-1">Alamat Kost / Kamar <span className="text-peach-500">*</span></label>
                <textarea rows={2} value={manualForm.alamat} onChange={(e)=>setManualForm({...manualForm,alamat:e.target.value})} required className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-peach-400" />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-gray-600 mb-2">Item Layanan</label>
                <div id="manualItemRows" className="space-y-2">
                  {manualForm.items.map((it, idx)=>(
                    <div key={idx} className="flex flex-col min-[420px]:flex-row gap-2">
                      <select value={it.service_id} onChange={(e)=>{ const items=[...manualForm.items]; items[idx]={...items[idx], service_id:e.target.value}; setManualForm({...manualForm, items}) }} required className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-peach-400">
                        <option value="">Pilih layanan</option>
                        {services.map(s=> <option key={s.id} value={String(s.id)}>{s.name} - Rp{Number(s.price).toLocaleString('id-ID')}</option>)}
                      </select>
                      <div className="flex gap-2">
                        <input type="number" value={it.qty} min={1} max={20} onChange={(e)=>{ const items=[...manualForm.items]; items[idx]={...items[idx], qty:e.target.value}; setManualForm({...manualForm, items}) }} required className="flex-1 min-[420px]:w-20 min-[420px]:flex-none px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-peach-400" />
                        <button type="button" onClick={()=>setManualForm({...manualForm, items: manualForm.items.length===1?manualForm.items:manualForm.items.filter((_,i)=>i!==idx)})} className="px-4 min-[420px]:px-3 rounded-xl bg-red-50 text-red-500 font-bold hover:bg-red-100" title="Hapus item">×</button>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={()=>setManualForm({...manualForm, items:[...manualForm.items,{service_id:services[0]?.id||'', qty:1}]})} className="mt-2 px-4 py-2 rounded-full bg-peach-50 text-peach-600 text-xs font-extrabold hover:bg-peach-100 transition-colors">+ Tambah Item</button>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button type="button" onClick={()=>setManualOpen(false)} className="py-3 rounded-2xl bg-gray-100 text-gray-600 font-extrabold text-sm hover:bg-gray-200 transition-colors">Batal</button>
                <button className="py-3 rounded-2xl bg-peach-500 text-white font-extrabold text-sm shadow-md hover:bg-peach-600 transition-all">Simpan Jadwal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
