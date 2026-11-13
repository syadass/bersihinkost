'use client'

import Link from 'next/link'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useConfirmModal } from '@/components/layouts/admin'

function fmtRupiah(n) {
  return 'Rp' + Number(n || 0).toLocaleString('id-ID')
}

function fmtDateWIB(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function fmtDateLongWIB() {
  return new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtMonthYear(year, month) {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export default function Dashboard({
  user, setting, kasBulanIni, selesaiBulanIni, totalPesananBulanIni,
  pendingCount, pendingTotal, jadwalHariIni, month, weeks, pendingOrders,
  chartBulan, chartTahun, years, trendLabels, trendValues, trendTotalPenghasilan, trendTotalPesanan, trendRataHarian,
  pieTotal, pieData, pieLabels, pieQtys, pieColors,
}) {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const trendRef = useRef(null)
  const pieRef = useRef(null)
  const trendChartRef = useRef(null)
  const pieChartRef = useRef(null)

  const baseUrl = pathname || '/admin'

  function dashUrl(extra) {
    const p = new URLSearchParams(sp?.toString() || '')
    Object.entries(extra).forEach(([k, v]) => {
      if (v === undefined || v === null) return
      p.set(k, String(v))
    })
    return `${baseUrl}?${p.toString()}`
  }

  useEffect(() => {
    const Chart = window.Chart
    if (!Chart || !trendRef.current) return
    if (trendChartRef.current) trendChartRef.current.destroy()
    Chart.defaults.font.family = "'Nunito', sans-serif"
    trendChartRef.current = new Chart(trendRef.current.getContext('2d'), {
      type: 'line',
      data: {
        labels: trendLabels || [],
        datasets: [{
          label: 'Order masuk',
          data: trendValues || [],
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#8b5cf6',
          pointBorderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' }, color: '#9ca3af', maxTicksLimit: 12 } },
          y: { beginAtZero: true, ticks: { font: { size: 10, weight: 'bold' }, color: '#9ca3af', precision: 0 }, grid: { color: '#f3f4f6' } }
        }
      }
    })
    return () => { if (trendChartRef.current) { trendChartRef.current.destroy(); trendChartRef.current = null } }
  }, [trendLabels, trendValues])

  useEffect(() => {
    const Chart = window.Chart
    if (!Chart || !pieRef.current || !(pieTotal > 0)) return
    if (pieChartRef.current) pieChartRef.current.destroy()
    pieChartRef.current = new Chart(pieRef.current.getContext('2d'), {
      type: 'pie',
      data: {
        labels: pieLabels || [],
        datasets: [{
          data: pieQtys || [],
          backgroundColor: pieColors || [],
          borderColor: '#ffffff',
          borderWidth: 3,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = (ctx.dataset.data || []).reduce((a, b) => a + b, 0)
                const pct = total ? (ctx.parsed / total * 100).toFixed(1) : 0
                return ' ' + ctx.label + ': ' + ctx.parsed + 'x (' + pct + '%)'
              }
            }
          }
        }
      }
    })
    return () => { if (pieChartRef.current) { pieChartRef.current.destroy(); pieChartRef.current = null } }
  }, [pieLabels, pieQtys, pieColors, pieTotal])

  function handleSearchKey(e) {
    if (e.key === 'Enter' && e.target.value.trim() !== '') {
      router.push(`/admin/pesanan?search=${encodeURIComponent(e.target.value.trim())}`)
    }
  }

  const initials = (() => {
    const n = (user?.name || 'A').trim()
    const parts = n.split(/\s+/)
    return ((parts[0]?.[0] || 'A') + (parts[1]?.[0] || '')).toUpperCase()
  })()

  const chip = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-emerald-100 text-emerald-600',
    rescheduled: 'bg-blue-100 text-blue-600',
    completed: 'bg-lavender-100 text-lavender-600',
    cancelled: 'bg-red-100 text-red-400 line-through'
  }
  const dotc = {
    pending: 'bg-amber-400',
    confirmed: 'bg-emerald-400',
    rescheduled: 'bg-blue-400',
    completed: 'bg-lavender-400',
    cancelled: 'bg-red-400'
  }

  // right panel exported as DashboardRightPanel for layout composition

  return (
    <>
      {/* Header & Solo Owner Profile */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 pt-2 shrink-0 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">Bersihinkost Dashboard</h1>
          <p className="text-sm font-bold text-lavender-500">{fmtDateLongWIB()}</p>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative flex-1 sm:flex-none sm:w-64 md:w-72">
            <span className="absolute inset-y-0 left-0 flex items-center pl-5 text-gray-400">
              <i className="fa-solid fa-magnifying-glass"></i>
            </span>
            <input type="text" id="searchInput" onKeyDown={handleSearchKey} placeholder="Cari nama atau alamat..." className="w-full pl-12 pr-4 py-3.5 rounded-3xl bg-white border-none shadow-card text-sm font-bold text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lavender-400 transition-all" />
          </div>

          <div className="hidden sm:flex items-center gap-3 bg-white pl-3 pr-5 py-2 rounded-full shadow-card cursor-pointer hover:bg-lavender-50 transition-colors border border-lavender-100 shrink-0">
            <div className="w-10 h-10 rounded-full bg-peach-100 text-peach-600 flex items-center justify-center font-extrabold border-2 border-white shadow-sm">
              {initials}
            </div>
            <div>
              <p className="text-sm font-extrabold text-gray-800 leading-tight">{user?.name || 'Administrator'}</p>
              <p className="text-[10px] font-extrabold text-peach-500 uppercase tracking-wider">Solo Operator</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-0 lg:pb-6 pr-1 sm:pr-2 min-h-0 space-y-5">
        {/* 1. Stat Cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-peach-400 to-peach-500 rounded-3xl shadow-card p-4 sm:p-5 text-white relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><i className="fa-solid fa-wallet text-sm"></i></span>
              <h3 className="text-[11px] sm:text-xs font-bold text-white/85 leading-tight">Pendapatan Bulan Ini</h3>
            </div>
            <p className="text-lg sm:text-2xl font-extrabold truncate">{fmtRupiah(kasBulanIni)}</p>
            <p className="text-[11px] sm:text-xs font-semibold text-white/90 mt-1"><i className="fa-solid fa-circle-check mr-1"></i>{selesaiBulanIni} kamar selesai</p>
          </div>
          <div className="bg-white rounded-3xl shadow-card p-4 sm:p-5 border border-lavender-50">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-8 h-8 rounded-xl bg-lavender-50 text-lavender-600 flex items-center justify-center shrink-0"><i className="fa-solid fa-clipboard-list text-sm"></i></span>
              <h3 className="text-[11px] sm:text-xs font-bold text-gray-500 leading-tight">Total Pesanan Bulan Ini</h3>
            </div>
            <p className="text-lg sm:text-2xl font-extrabold text-gray-800">{totalPesananBulanIni} <span className="text-xs font-bold text-gray-400">pesanan</span></p>
            <p className="text-[11px] sm:text-xs font-semibold text-gray-400 mt-1">{new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
          </div>
          <a href="/admin/pesanan?tab=menunggu-acc" className="bg-white rounded-3xl shadow-card p-4 sm:p-5 border border-amber-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0"><i className="fa-solid fa-clock text-sm"></i></span>
              <h3 className="text-[11px] sm:text-xs font-bold text-gray-500 leading-tight">Menunggu Persetujuan</h3>
            </div>
            <p className="text-lg sm:text-2xl font-extrabold text-gray-800">{pendingCount} <span className="text-xs font-bold text-gray-400">order</span></p>
            <p className="text-[11px] sm:text-xs font-bold text-amber-600 mt-1">{fmtRupiah(pendingTotal)} →</p>
          </a>
          <a href="#kalender" className="bg-white rounded-3xl shadow-card p-4 sm:p-5 border border-lavender-50 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><i className="fa-solid fa-calendar-day text-sm"></i></span>
              <h3 className="text-[11px] sm:text-xs font-bold text-gray-500 leading-tight">Jadwal Hari Ini</h3>
            </div>
            <p className="text-lg sm:text-2xl font-extrabold text-gray-800">{jadwalHariIni} <span className="text-xs font-bold text-gray-400">jadwal</span></p>
            <p className="text-[11px] sm:text-xs font-semibold text-gray-400 mt-1">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </a>
        </div>

        {/* 2. Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-5">
          <div className="xl:col-span-3 bg-white rounded-3xl shadow-card p-4 sm:p-5 border border-lavender-50 min-w-0">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
              <h3 className="text-sm font-extrabold text-gray-800">Tren Pemesan Bulanan</h3>
              <div className="flex items-center gap-2">
                <input
                  type="month"
                  value={`${chartTahun}-${String(chartBulan).padStart(2, '0')}`}
                  onChange={(e) => {
                    const v = e.target.value
                    if (!v) return
                    const [y, m] = v.split('-')
                    router.push(dashUrl({ g_bulan: String(Number(m)), g_tahun: String(Number(y)) }))
                  }}
                  title="Pilih bulan & tahun"
                  className="px-3 py-2 rounded-full bg-gray-50 border border-gray-200 text-xs font-extrabold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400 cursor-pointer"
                />
              </div>
            </div>
            <div className="h-52 sm:h-60 w-full"><canvas id="trendChart" ref={trendRef}></canvas></div>
            <p className="text-[11px] font-semibold text-gray-400 mt-2">Jumlah order masuk per hari · {fmtMonthYear(chartTahun, chartBulan)}</p>
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-3">
              <div className="rounded-2xl bg-emerald-50/70 border border-emerald-100 px-3 py-2.5 flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-xl bg-emerald-500 text-white hidden sm:flex items-center justify-center shrink-0"><i className="fa-solid fa-wallet text-xs"></i></span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-emerald-600 leading-tight">Total Penghasilan</p>
                  <p className="text-[13px] sm:text-sm font-extrabold text-gray-800 truncate">{fmtRupiah(trendTotalPenghasilan)}</p>
                </div>
              </div>
              <div className="rounded-2xl bg-lavender-50/70 border border-lavender-100 px-3 py-2.5 flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-xl bg-lavender-600 text-white hidden sm:flex items-center justify-center shrink-0"><i className="fa-solid fa-clipboard-list text-xs"></i></span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-lavender-500 leading-tight">Total Pesanan</p>
                  <p className="text-[13px] sm:text-sm font-extrabold text-gray-800 truncate">{trendTotalPesanan} <span className="text-[10px] font-bold text-gray-400">pesanan</span></p>
                </div>
              </div>
              <div className="rounded-2xl bg-peach-50/70 border border-peach-100 px-3 py-2.5 flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-xl bg-peach-500 text-white hidden sm:flex items-center justify-center shrink-0"><i className="fa-solid fa-calendar-day text-xs"></i></span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-peach-600 leading-tight">Rata-rata / Hari</p>
                  <p className="text-[13px] sm:text-sm font-extrabold text-gray-800 truncate">{fmtRupiah(trendRataHarian)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-2 bg-white rounded-3xl shadow-card p-4 sm:p-5 border border-lavender-50 min-w-0 flex flex-col">
            <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
              <h3 className="text-[13px] sm:text-sm font-extrabold text-gray-800 whitespace-nowrap shrink-0">Perbandingan Layanan</h3>
            </div>
            {pieTotal > 0 ? (
              <>
                <div className="h-40 sm:h-44 w-full flex justify-center shrink-0"><canvas id="pieChart" ref={pieRef}></canvas></div>
                <ul className="mt-2 flex-1 grid grid-cols-2 gap-x-3 content-evenly overflow-y-auto pr-1">
                  {pieData.map((p) => (
                    <li key={p.label} className="flex items-center gap-2 text-xs font-bold text-gray-600">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: p.color }}></span>
                      <span className="flex-1 truncate" title={p.label}>{p.label}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-center text-gray-400">
                <i className="fa-solid fa-chart-pie text-3xl mb-2 text-lavender-200"></i>
                <p className="text-xs font-bold">Belum ada data pesanan pada periode ini</p>
              </div>
            )}
          </div>
        </div>

        {/* 3. Kalender Jadwal Orderan */}
        <div id="kalender" className="bg-white rounded-3xl shadow-card border border-lavender-50 p-4 sm:p-5 scroll-mt-4">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <h3 className="font-extrabold text-gray-800 text-sm sm:text-base">Kalender Jadwal</h3>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => { const d = new Date(month.year, month.month - 2, 1); router.push(dashUrl({ bulan: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` })) }} className="w-8 h-8 rounded-full bg-lavender-50 text-lavender-600 flex items-center justify-center hover:bg-lavender-100 shrink-0" title="Bulan sebelumnya"><i className="fa-solid fa-chevron-left text-xs"></i></button>
              <input
                type="month"
                value={`${month.year}-${String(month.month).padStart(2, '0')}`}
                onChange={(e) => {
                  const v = e.target.value
                  if (!v) return
                  router.push(dashUrl({ bulan: v }))
                }}
                title="Pilih bulan & tahun"
                className="px-3 py-2 rounded-full bg-gray-50 border border-gray-200 text-xs font-extrabold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400 cursor-pointer"
              />
              <button type="button" onClick={() => { const d = new Date(month.year, month.month, 1); router.push(dashUrl({ bulan: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` })) }} className="w-8 h-8 rounded-full bg-lavender-50 text-lavender-600 flex items-center justify-center hover:bg-lavender-100 shrink-0" title="Bulan berikutnya"><i className="fa-solid fa-chevron-right text-xs"></i></button>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mb-4 text-[11px] font-extrabold">
            <span className="flex items-center gap-1.5 text-gray-500"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>Menunggu ACC</span>
            <span className="flex items-center gap-1.5 text-gray-500"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>Confirmed</span>
            <span className="flex items-center gap-1.5 text-gray-500"><span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>Reschedule</span>
            <span className="flex items-center gap-1.5 text-gray-500"><span className="w-2.5 h-2.5 rounded-full bg-lavender-400"></span>Selesai</span>
            <span className="flex items-center gap-1.5 text-gray-500"><span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>Batal</span>
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((dname) => (
              <div key={dname} className="text-center text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-lavender-400 pb-1">{dname}</div>
            ))}
            {weeks.map((week, wi) => week.map((day, di) => (
              <div key={`${wi}-${di}`} className={`rounded-xl sm:rounded-2xl border p-1 sm:p-2 min-h-[64px] sm:min-h-[92px] ${day.isToday ? 'border-lavender-400 ring-2 ring-lavender-200 bg-lavender-50/50' : 'border-gray-100 bg-gray-50/50'} ${day.inMonth ? '' : 'opacity-40'}`}>
                <p className={`text-[11px] sm:text-xs font-extrabold ${day.isToday ? 'text-lavender-600' : 'text-gray-500'} mb-1`}>{String(day.day).padStart(2, '0')}</p>
                <div className="space-y-1 hidden sm:block">
                  {(day.orders || []).slice(0, 3).map((o) => (
                    <a key={o.id} href={`/admin/pesanan/${o.id}?from=${encodeURIComponent(typeof window !== 'undefined' ? (window.location.pathname + window.location.search || '/admin') : '/admin')}`} title={`#${o.id} • ${o.customer_name} • ${fmtDateWIB(o.tanggal_fix || o.tanggal_usulan)} • ${fmtRupiah(o.total_harga)}`} className={`block truncate text-[10px] font-extrabold px-2 py-0.5 rounded-full ${chip[o.status] || 'bg-gray-100 text-gray-500'}`}>{o.customer_name}</a>
                  ))}
                  {(day.orders || []).length > 3 && <p className="text-[10px] font-bold text-gray-400 pl-2">+{day.orders.length - 3} lagi</p>}
                </div>
                {(day.orders || []).length > 0 && (
                  <div className="sm:hidden flex gap-0.5 flex-wrap">
                    {(day.orders || []).slice(0, 4).map((o) => (
                      <span key={o.id} className={`w-1.5 h-1.5 rounded-full ${dotc[o.status] || 'bg-gray-300'}`}></span>
                    ))}
                  </div>
                )}
              </div>
            )))}
          </div>
        </div>
      </div>
    </>
  )
}

export function DashboardRightPanel({ pendingCount, pendingTotal, pendingOrders, setting }) {
  const confirm = useConfirmModal()
  const [openMenuId, setOpenMenuId] = useState(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const [menuAnchor, setMenuAnchor] = useState(null)
  const menuRef = useRef(null)

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

  useEffect(() => {
    function closeMenu(e) {
      if (menuRef.current && e?.target && menuRef.current.contains(e.target)) return
      setOpenMenuId(null); setMenuAnchor(null)
    }
    function onKey(e) { if (e.key === 'Escape') { setOpenMenuId(null); setMenuAnchor(null) } }
    document.addEventListener('click', closeMenu)
    document.addEventListener('keydown', onKey)
    document.addEventListener('scroll', closeMenu, true)
    return () => {
      document.removeEventListener('click', closeMenu)
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('scroll', closeMenu, true)
    }
  }, [])

  useLayoutEffect(() => {
    if (!openMenuId || !menuRef.current || !menuAnchor) return
    const menu = menuRef.current
    const { height, width } = menu.getBoundingClientRect()
    const menuW = width || 224
    let left = menuAnchor.right - menuW
    left = Math.max(8, Math.min(left, window.innerWidth - menuW - 8))
    let top = menuAnchor.bottom + 6
    if (top + height > window.innerHeight - 8) top = menuAnchor.top - height - 6
    if (top < 8) top = 8
    if (top + height > window.innerHeight - 8) top = Math.max(8, window.innerHeight - height - 8)
    setMenuPos((p) => (p.top === top && p.left === left ? p : { top, left }))
  }, [openMenuId, menuAnchor, pendingOrders])

  async function doPatch(orderId, body) {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(data.message || 'Gagal memproses.')
      return
    }
    if (!data.customer_notified && data.customer_wa_link) window.open(data.customer_wa_link, '_blank')
    window.location.reload()
  }

  async function submitAcc(e, orderId) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const tanggal_fix = fd.get('tanggal_fix')
    const jam_fix = fd.get('jam_fix')
    try {
      await doPatch(orderId, { action: 'acc', tanggal_fix, jam_fix })
    } catch {
      alert('Gagal ACC pesanan.')
    }
  }

  const from = typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname + window.location.search || '/admin') : encodeURIComponent('/admin')

  return (
    <aside className="w-full xl:w-[380px] shrink-0 bg-white rounded-3xl xl:rounded-[2.5rem] shadow-card flex flex-col z-10 overflow-hidden border border-lavender-50 lg:max-h-full">
      {/* Header Panel */}
      <div className="px-6 sm:px-7 pt-6 sm:pt-7 pb-4 bg-white">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-800"> Pesanan Masuk</h2>
          <a href="/admin/pesanan?tab=menunggu-acc" className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center hover:bg-amber-200 transition-colors font-extrabold text-sm" title="Lihat semua menunggu ACC">{pendingCount}</a>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="bg-amber-100 text-amber-600 text-xs font-bold px-3 py-1 rounded-full">{pendingCount} Menunggu ACC</span>
          <span className="bg-peach-100 text-peach-600 text-xs font-bold px-3 py-1 rounded-full">{fmtRupiah(pendingTotal)}</span>
        </div>
      </div>

      {/* Pending Order List */}
      <div id="pendingList" className="xl:flex-1 xl:overflow-y-auto xl:min-h-0 max-h-[60vh] xl:max-h-none overflow-y-auto px-4 sm:px-5 py-2 space-y-3 sm:space-y-4">
        {pendingOrders && pendingOrders.length ? pendingOrders.map((o) => {
          const fix = o.tanggal_fix || o.tanggal_usulan
          return (
            <div key={o.id} className="bg-white p-3 rounded-2xl shadow-sm border border-amber-100">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <h4 className="text-sm font-extrabold text-gray-800 leading-tight">#{o.id} • {o.customer_name}</h4>
                  <p className="text-[11px] font-bold text-gray-400 mt-0.5 truncate">{o.alamat}</p>
                  <p className="text-[11px] font-bold text-gray-400"><i className="fa-regular fa-calendar mr-1"></i>Usulan: {fmtDateWIB(o.tanggal_usulan)}</p>
                  <p className="text-[11px] font-semibold text-gray-400 truncate">{(o.items || []).map((i) => `${i.service_name} (${i.qty}x)`).join(', ')}</p>
                </div>
                <span className="text-xs font-extrabold text-peach-500 whitespace-nowrap">{fmtRupiah(o.total_harga)}</span>
              </div>
              <div className="mt-3">
                <form onSubmit={(e) => submitAcc(e, o.id)} className="flex flex-nowrap items-center gap-1 bg-emerald-50 rounded-2xl p-1.5 w-full">
                  <input type="date" name="tanggal_fix" defaultValue={toDateValue(fix)} className="min-w-0 flex-[1.15] text-[10px] font-bold bg-white rounded-full px-2 py-1.5 border border-emerald-200 focus:outline-none" />
                  <input type="time" name="jam_fix" min={setting?.jam_mulai || '08:00'} max={setting?.jam_selesai || '17:00'} defaultValue={toTimeValue(fix)} className="min-w-0 flex-1 text-[10px] font-bold bg-white rounded-full px-2 py-1.5 border border-emerald-200 focus:outline-none" />
                  <button className="shrink-0 px-2.5 py-1.5 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold hover:bg-emerald-600 whitespace-nowrap"><i className="fa-solid fa-check mr-0.5"></i>ACC</button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault(); e.stopPropagation(); e.nativeEvent?.stopImmediatePropagation?.()
                      if (openMenuId === o.id) { setOpenMenuId(null); setMenuAnchor(null); return }
                      const rect = e.currentTarget.getBoundingClientRect()
                      const menuW = 224
                      let left = rect.right - menuW
                      left = Math.max(8, Math.min(left, window.innerWidth - menuW - 8))
                      const top = Math.min(rect.bottom + 6, window.innerHeight - 16)
                      setMenuPos({ top, left })
                      setMenuAnchor({ top: rect.top, bottom: rect.bottom, right: rect.right })
                      setOpenMenuId(o.id)
                    }}
                    title="Aksi lain"
                    className="w-7 h-7 shrink-0 rounded-full bg-white text-gray-500 border border-emerald-200 flex items-center justify-center hover:bg-gray-50"
                  >
                    <i className="fa-solid fa-ellipsis-vertical text-[10px]"></i>
                  </button>
                </form>
              </div>
            </div>
          )
        }) : (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-70 py-10">
            <div className="w-24 h-24 rounded-full bg-emerald-50 text-emerald-300 flex items-center justify-center text-4xl mb-4 border-2 border-dashed border-emerald-200">
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <p className="text-lg font-extrabold text-gray-700">Tidak ada order menunggu</p>
            <p className="text-sm font-semibold text-gray-400 mt-1">Semua jadwal sudah terkonfirmasi</p>
          </div>
        )}
      </div>

      {/* Summary & Action Button */}
      <div className="p-5 sm:p-6 pb-16 sm:pb-20 lg:pb-6 bg-gray-50/50 border-t border-gray-100 rounded-t-[2rem]">
        <div className="flex justify-between items-center text-sm font-bold text-gray-500 mb-4">
          <span>Order Menunggu ACC</span>
          <span>{pendingCount} order</span>
        </div>

        <a href="/admin/pesanan" className="w-full py-3.5 sm:py-4 rounded-3xl bg-lavender-600 text-white font-extrabold text-base sm:text-lg shadow-lg shadow-lavender-200 hover:bg-lavender-700 hover:shadow-xl hover:-translate-y-0.5 transition-all flex justify-center items-center gap-3">
          <i className="fa-solid fa-calendar-check"></i>
          Kelola Semua Pesanan
        </a>
      </div>

      {openMenuId && (() => {
        const order = (pendingOrders || []).find(o => o.id === openMenuId)
        if (!order) return null
        return (
          <div ref={menuRef} className="fixed w-56 bg-white rounded-2xl shadow-float border border-lavender-100 p-2 z-[60] max-h-[calc(100vh-16px)] overflow-auto" style={{ top: menuPos.top, left: menuPos.left }} onClick={(e)=>e.stopPropagation()}>
            <a href={`/admin/pesanan/${order.id}?from=${from}`} onClick={()=>{ setOpenMenuId(null); setMenuAnchor(null) }} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-lavender-50 hover:text-lavender-600">
              <i className="fa-solid fa-eye w-4 text-center"></i> Lihat Detail
            </a>
            <form onSubmit={(e)=>{ e.preventDefault(); const ket=(e.currentTarget.keterangan?.value||'').toString().trim(); setOpenMenuId(null); setMenuAnchor(null); confirm.open({ title:'Ajukan Perubahan Jadwal?', message:`Permintaan perubahan jadwal untuk pesanan #${order.id} akan diajukan ke pelanggan via WhatsApp.`, confirmText:'Ya, Ajukan', tone:'blue', icon:'fa-calendar-days', onConfirm:()=>doPatch(order.id,{ action:'ajukan_perubahan_jadwal', keterangan: ket }) }) }} className="mt-1 pt-2 border-t border-dashed border-gray-200">
              <label className="block px-1 text-[11px] font-extrabold text-blue-600 mb-1">Ubah Jadwal (Ajukan Perubahan)</label>
              <input type="text" name="keterangan" placeholder="Keterangan (opsional)" className="w-full text-[11px] font-bold bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-300 mb-1.5" />
              <button className="w-full py-2 rounded-xl bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 flex items-center justify-center gap-1.5">
                <i className="fa-solid fa-calendar-days"></i> Ajukan Perubahan Jadwal
              </button>
            </form>
            <form onSubmit={(e)=>{ e.preventDefault(); const alasan=e.currentTarget.alasan_batal.value; if(!alasan) return; setOpenMenuId(null); setMenuAnchor(null); confirm.open({ title:'Batalkan Pesanan?', message:`Order #${order.id} akan dibatalkan (fix batal) tanpa mengirim WhatsApp.`, confirmText:'Ya, Batalkan', tone:'red', icon:'fa-ban', onConfirm:()=>doPatch(order.id,{ alasan_batal: alasan }) }) }} className="mt-1 pt-2 border-t border-dashed border-gray-200">
              <input type="text" name="alasan_batal" required placeholder="Alasan batal..." className="w-full text-[11px] font-bold bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-red-300 mb-1.5" />
              <button className="w-full py-2 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 flex items-center justify-center gap-1.5">
                <i className="fa-solid fa-ban"></i> Batalkan Pesanan
              </button>
            </form>
          </div>
        )
      })()}
    </aside>
  )
}
