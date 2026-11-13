'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import InvoiceSheet from '@/components/admin/pesanan/_invoice_sheet'
import { AdminPageTitle, AdminUserBadge } from '@/components/admin/header-parts'
import LoadingState from '@/components/ui/loading-state'

const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

function fmtRupiah(n) {
  return 'Rp ' + Number(n || 0).toLocaleString('id-ID')
}

function fmtDate(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDateLong(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric' })
}

function renderPembayaran(o) {
  const stKey = o?.payment_status || ''
  const st = { lunas: 'Lunas', belum_lunas: 'Belum Lunas' }[stKey] || ''
  const mt = { tunai: 'Tunai', transfer: 'Transfer (TF)', qris: 'QRIS', lainnya: 'Lainnya' }[o?.payment_method] || ''
  if (!st && !mt) return <span className="text-gray-400">-</span>
  const badgeClass = stKey === 'lunas'
    ? 'bg-emerald-100 text-emerald-700'
    : stKey === 'belum_lunas'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-gray-100 text-gray-600'
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {st ? <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold whitespace-nowrap ${badgeClass}`}>{st}</span> : null}
      {mt ? <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">{mt}</span> : null}
    </div>
  )
}

async function fetchAllOrders(params) {
  const perPage = 100
  const base = { ...params, perPage: String(perPage), skipMeta: '1' }
  const fetchPage = async (page) => {
    const qs = new URLSearchParams({ ...base, page: String(page) })
    const r = await fetch(`/api/orders?${qs.toString()}`, { cache: 'no-store' })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(d?.message || 'Gagal memuat data.')
    return d
  }

  const first = await fetchPage(1)
  let all = Array.isArray(first.orders) ? [...first.orders] : []
  const totalPages = Math.min(Number(first.totalPages || 1), 200)

  if (totalPages > 1 && all.length > 0) {
    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) => fetchPage(i + 2))
    )
    for (const d of rest) {
      if (Array.isArray(d.orders) && d.orders.length) all = all.concat(d.orders)
    }
  }

  return all
}

export default function LaporanKeuangan() {
  const router = useRouter()
  const sp = useSearchParams()
  const [bulan, setBulan] = useState(sp.get('bulan') || 'all')
  const [tahun, setTahun] = useState(sp.get('tahun') || 'all')
  const [search, setSearch] = useState(sp.get('search') || '')
  const [searchInput, setSearchInput] = useState(sp.get('search') || '')
  const [setting, setSetting] = useState({ business_name: 'Bersihinkost', operator_name: 'Admin' })
  const [doneOrders, setDoneOrders] = useState([])
  const [cancelledOrders, setCancelledOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [invoiceOrder, setInvoiceOrder] = useState(null)
  const [page, setPage] = useState(1)
  const pageSize = 5
  const trendRef = useRef(null)
  const trendChartRef = useRef(null)
  const ordersTrendRef = useRef(null)
  const ordersTrendChartRef = useRef(null)

  function printInvoice(order) {
    setInvoiceOrder(order)
    setTimeout(() => {
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
    }, 80)
  }

  function printLaporan() {
    setTimeout(() => {
      const root = document.getElementById('printRoot')
      const src = document.getElementById('laporanPdf')
      if (!root || !src) return
      root.innerHTML = src.innerHTML
      document.body.classList.add('printing')
      window.print()
      window.addEventListener('afterprint', () => {
        document.body.classList.remove('printing')
        root.innerHTML = ''
      }, { once: true })
    }, 30)
  }

  useEffect(() => {
    const b = sp.get('bulan') || 'all'
    const t = sp.get('tahun') || 'all'
    const s = sp.get('search') || ''
    setBulan(b)
    setTahun(t)
    setSearch(s)
    setSearchInput(s)
  }, [sp])

  useEffect(() => { setPage(1) }, [search, bulan, tahun])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true); setErr('')
      try {
        const base = { search, bulan, tahun }
        const [done, batal, sr] = await Promise.all([
          fetchAllOrders({ ...base, tab: 'selesai' }),
          fetchAllOrders({ ...base, tab: 'batal' }),
          fetch('/api/settings', { cache: 'no-store' }),
        ])
        if (cancelled) return
        setDoneOrders(done)
        setCancelledOrders(batal)
        if (sr.ok) {
          const sd = await sr.json().catch(() => ({}))
          if (sd.setting) setSetting((s) => ({ ...s, ...sd.setting }))
        }
      } catch (e) {
        if (!cancelled) setErr(e?.message || 'Gagal memuat data laporan.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [search, bulan, tahun])

  function navigateWith(patch = {}) {
    const next = {
      bulan: patch.bulan !== undefined ? patch.bulan : bulan,
      tahun: patch.tahun !== undefined ? patch.tahun : tahun,
      search: patch.search !== undefined ? patch.search : search,
    }
    const qs = new URLSearchParams()
    if (next.bulan && next.bulan !== 'all') qs.set('bulan', next.bulan)
    if (next.tahun && next.tahun !== 'all') qs.set('tahun', next.tahun)
    if (next.search) qs.set('search', next.search)
    router.replace(`/admin/laporan${qs.toString() ? `?${qs.toString()}` : ''}`)
  }

  function submitSearch(e) {
    e.preventDefault()
    navigateWith({ search: searchInput })
  }

  const periodeLabel = useMemo(() => {
    const b = bulan === 'all' ? 'Semua Bulan' : (monthNames[Number(bulan)] || String(bulan))
    const t = tahun === 'all' ? 'Semua Tahun' : String(tahun)
    return `${b} ${t}`
  }, [bulan, tahun])

  const operatorName = setting.operator_name || 'Admin'

  const keuangan = useMemo(() => {
    const total = doneOrders.reduce((s, o) => s + Number(o.total_harga || 0), 0)
    const now = new Date()
    const yearForDays = tahun === 'all' ? now.getFullYear() : Number(tahun)
    let days
    if (bulan !== 'all') days = new Date(yearForDays, Number(bulan), 0).getDate()
    else if (tahun !== 'all') days = ((yearForDays % 4 === 0 && yearForDays % 100 !== 0) || yearForDays % 400 === 0) ? 366 : 365
    else days = 30
    const batalTotal = cancelledOrders.reduce((s, o) => s + Number(o.total_harga || 0), 0)
    return { total, count: doneOrders.length, rata: days > 0 ? Math.round(total / days) : 0, days, batalCount: cancelledOrders.length, batalTotal }
  }, [doneOrders, cancelledOrders, bulan, tahun])

  const trendData = useMemo(() => {
    const getDate = (o) => o?.updated_at || o?.tanggal_fix || o?.tanggal_usulan || o?.created_at
    const toKeyDate = (iso) => {
      if (!iso) return null
      const d = new Date(iso)
      if (isNaN(d)) return null
      const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d)
      const map = Object.fromEntries(parts.map(p => [p.type, p.value]))
      return { y: Number(map.year), m: Number(map.month), d: Number(map.day) }
    }

    const sumIncome = (orders, pred) => orders.reduce((s, o) => pred(o) ? s + Number(o.total_harga || 0) : s, 0)
    const countOrders = (orders, pred) => orders.reduce((s, o) => pred(o) ? s + 1 : s, 0)

    if (bulan !== 'all' && tahun !== 'all') {
      const y = Number(tahun), m = Number(bulan)
      const daysInMonth = new Date(y, m, 0).getDate()
      const incomeValues = Array(daysInMonth).fill(0)
      const doneCounts = Array(daysInMonth).fill(0)
      const cancelCounts = Array(daysInMonth).fill(0)
      for (const o of doneOrders) {
        const kd = toKeyDate(getDate(o)); if (!kd || kd.y !== y || kd.m !== m) continue
        incomeValues[kd.d - 1] += Number(o.total_harga || 0)
        doneCounts[kd.d - 1] += 1
      }
      for (const o of cancelledOrders) {
        const kd = toKeyDate(getDate(o)); if (!kd || kd.y !== y || kd.m !== m) continue
        cancelCounts[kd.d - 1] += 1
      }
      return {
        labels: Array.from({ length: daysInMonth }, (_, i) => String(i + 1)),
        incomeValues, doneCounts, cancelCounts,
        incomeSubtitle: `Penghasilan per hari · ${monthNames[m]} ${y}`,
        ordersSubtitle: `Total pesanan per hari · ${monthNames[m]} ${y}`,
      }
    }

    if (tahun !== 'all') {
      const y = Number(tahun)
      const incomeValues = Array(12).fill(0)
      const doneCounts = Array(12).fill(0)
      const cancelCounts = Array(12).fill(0)
      for (const o of doneOrders) {
        const kd = toKeyDate(getDate(o)); if (!kd || kd.y !== y) continue
        incomeValues[kd.m - 1] += Number(o.total_harga || 0)
        doneCounts[kd.m - 1] += 1
      }
      for (const o of cancelledOrders) {
        const kd = toKeyDate(getDate(o)); if (!kd || kd.y !== y) continue
        cancelCounts[kd.m - 1] += 1
      }
      return {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
        incomeValues, doneCounts, cancelCounts,
        incomeSubtitle: `Penghasilan per bulan · ${y}`,
        ordersSubtitle: `Total pesanan per bulan · ${y}`,
      }
    }

    const map = new Map()
    const ensure = (k) => { if (!map.has(k)) map.set(k, { income: 0, done: 0, cancel: 0 }); return map.get(k) }
    for (const o of doneOrders) {
      const kd = toKeyDate(getDate(o)); if (!kd) continue
      const key = `${kd.y}-${String(kd.m).padStart(2, '0')}`
      const e = ensure(key); e.income += Number(o.total_harga || 0); e.done += 1
    }
    for (const o of cancelledOrders) {
      const kd = toKeyDate(getDate(o)); if (!kd) continue
      const key = `${kd.y}-${String(kd.m).padStart(2, '0')}`
      const e = ensure(key); e.cancel += 1
    }
    const keys = Array.from(map.keys()).sort()
    const shortMonths = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
    return {
      labels: keys.map(k => { const [yy, mm] = k.split('-'); return `${shortMonths[Number(mm)-1]} ${String(yy).slice(-2)}` }),
      incomeValues: keys.map(k => map.get(k).income),
      doneCounts: keys.map(k => map.get(k).done),
      cancelCounts: keys.map(k => map.get(k).cancel),
      incomeSubtitle: 'Penghasilan per bulan · Semua Periode',
      ordersSubtitle: 'Total pesanan per bulan · Semua Periode',
    }
  }, [doneOrders, cancelledOrders, bulan, tahun])

  useEffect(() => {
    const Chart = window.Chart
    if (!Chart || !trendRef.current) return
    if (trendChartRef.current) { trendChartRef.current.destroy(); trendChartRef.current = null }
    const labels = trendData.labels || []
    const values = trendData.incomeValues || []
    if (!labels.length) return
    Chart.defaults.font.family = "'Nunito', sans-serif"
    trendChartRef.current = new Chart(trendRef.current.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Penghasilan',
          data: values,
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#8b5cf6',
          pointBorderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ' ' + fmtRupiah(ctx.parsed.y ?? ctx.parsed) } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' }, color: '#9ca3af', maxTicksLimit: 12 } },
          y: {
            beginAtZero: true,
            ticks: {
              font: { size: 10, weight: 'bold' }, color: '#9ca3af',
              callback: (v) => {
                const n = Number(v)
                if (n >= 1000000) return 'Rp ' + (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1) + 'jt'
                if (n >= 1000) return 'Rp ' + (n / 1000).toFixed(0) + 'rb'
                return 'Rp ' + n
              }
            },
            grid: { color: '#f3f4f6' }
          }
        }
      }
    })
    return () => { if (trendChartRef.current) { trendChartRef.current.destroy(); trendChartRef.current = null } }
  }, [trendData])

  useEffect(() => {
    const Chart = window.Chart
    if (!Chart || !ordersTrendRef.current) return
    if (ordersTrendChartRef.current) { ordersTrendChartRef.current.destroy(); ordersTrendChartRef.current = null }
    const labels = trendData.labels || []
    if (!labels.length) return
    const done = trendData.doneCounts || []
    const cancel = trendData.cancelCounts || []
    Chart.defaults.font.family = "'Nunito', sans-serif"
    ordersTrendChartRef.current = new Chart(ordersTrendRef.current.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Selesai',
            data: done,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#10b981',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 6,
          },
          {
            label: 'Dibatalkan',
            data: cancel,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#ef4444',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 6,
          },
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'bottom', labels: { boxWidth: 10, usePointStyle: true, pointStyle: 'circle', font: { size: 11, weight: 'bold' }, color: '#6b7280' } },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y ?? ctx.parsed} pesanan` } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' }, color: '#9ca3af', maxTicksLimit: 12 } },
          y: { beginAtZero: true, ticks: { font: { size: 10, weight: 'bold' }, color: '#9ca3af', precision: 0 }, grid: { color: '#f3f4f6' } }
        }
      }
    })
    return () => { if (ordersTrendChartRef.current) { ordersTrendChartRef.current.destroy(); ordersTrendChartRef.current = null } }
  }, [trendData])

  const totalPages = Math.max(1, Math.ceil((doneOrders.length || 0) / pageSize))
  const safePage = Math.min(page, totalPages)
  const pagedDoneOrders = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return doneOrders.slice(start, start + pageSize)
  }, [doneOrders, safePage])

  useEffect(() => {
    if (page !== safePage) setPage(safePage)
  }, [page, safePage])

  if (loading) {
    return <LoadingState size="lg" className="h-full min-h-[60vh] flex items-center justify-center p-6 animate-fade-in" />
  }

  return (
    <>

      <header className="flex flex-col xl:flex-row xl:items-center gap-3 mb-6 shrink-0 pr-1">
        <AdminPageTitle title="Laporan" subtitle="Rekap keuangan pesanan berdasarkan periode." subtitleClassName="text-gray-400 mt-1 text-sm" />

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 xl:ml-auto min-w-0 w-full xl:w-auto">
          <form onSubmit={submitSearch} className="relative flex-1 sm:flex-none sm:w-64 md:w-72 min-w-0">
            <span className="absolute inset-y-0 left-0 flex items-center pl-5 text-gray-400">
              <i className="fa-solid fa-magnifying-glass"></i>
            </span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama atau alamat..."
              className="w-full pl-12 pr-4 py-3 sm:py-3.5 rounded-3xl bg-white border-none shadow-card text-sm font-bold text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lavender-400 transition-all"
            />
          </form>

          <div className="shrink-0 flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <input
              type="month"
              value={(bulan !== 'all' && tahun !== 'all') ? `${tahun}-${String(bulan).padStart(2, '0')}` : ''}
              onChange={(e) => {
                const v = e.target.value
                if (!v) { navigateWith({ bulan: 'all', tahun: 'all' }); return }
                const [y, m] = v.split('-')
                navigateWith({ bulan: String(Number(m)), tahun: String(Number(y)) })
              }}
              title="Pilih bulan & tahun"
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-full bg-white border-none shadow-card text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400 cursor-pointer"
            />
            <button
              type="button"
              onClick={() => navigateWith({ bulan: 'all', tahun: 'all' })}
              className={`px-5 py-2.5 rounded-full text-sm font-bold shadow-card whitespace-nowrap transition-colors ${(bulan === 'all' && tahun === 'all') ? 'bg-lavender-600 text-white' : 'bg-white text-gray-600 hover:bg-lavender-50'}`}
            >
              Semua Periode
            </button>
            <button
              type="button"
              onClick={printLaporan}
              className="px-4 py-2.5 rounded-3xl bg-peach-500 text-white font-extrabold text-sm shadow-md hover:bg-peach-600 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
              title="Cetak laporan"
            >
              <i className="fa-solid fa-print text-[10px]"></i> Cetak
            </button>
          </div>

          <AdminUserBadge name={operatorName} />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-32 sm:pb-36 lg:pb-6 pr-1 sm:pr-2 min-h-0 space-y-5">
        {err ? (
          <div className="bg-white rounded-3xl shadow-card border border-red-100 p-4 text-sm font-bold text-red-500">{err}</div>
        ) : null}

        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-gradient-to-br from-peach-400 to-peach-500 rounded-3xl shadow-card p-4 sm:p-5 text-white relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
                <div className="flex items-center gap-2 mb-1.5 relative">
                  <span className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><i className="fa-solid fa-wallet text-sm"></i></span>
                  <h3 className="text-[11px] sm:text-xs font-bold text-white/85 leading-tight">Total Pemasukan</h3>
                </div>
                <p className="text-lg sm:text-2xl font-extrabold truncate relative">{fmtRupiah(keuangan.total)}</p>
                <p className="text-[11px] sm:text-xs font-semibold text-white/90 mt-1 relative">Dari pesanan selesai</p>
              </div>
              <div className="bg-white rounded-3xl shadow-card p-4 sm:p-5 border border-lavender-50">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><i className="fa-solid fa-circle-check text-sm"></i></span>
                  <h3 className="text-[11px] sm:text-xs font-bold text-gray-500 leading-tight">Pesanan Selesai</h3>
                </div>
                <p className="text-lg sm:text-2xl font-extrabold text-gray-800">{keuangan.count} <span className="text-xs font-bold text-gray-400">pesanan</span></p>
                <p className="text-[11px] sm:text-xs font-semibold text-gray-400 mt-1">Transaksi pada periode</p>
              </div>
              <div className="bg-white rounded-3xl shadow-card p-4 sm:p-5 border border-lavender-50">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-8 h-8 rounded-xl bg-lavender-50 text-lavender-600 flex items-center justify-center shrink-0"><i className="fa-solid fa-chart-line text-sm"></i></span>
                  <h3 className="text-[11px] sm:text-xs font-bold text-gray-500 leading-tight">Rata-rata / Hari</h3>
                </div>
                <p className="text-lg sm:text-2xl font-extrabold text-gray-800 truncate">{fmtRupiah(keuangan.rata)}</p>
                <p className="text-[11px] sm:text-xs font-semibold text-gray-400 mt-1">÷ {keuangan.days} hari</p>
              </div>
              <div className="bg-white rounded-3xl shadow-card p-4 sm:p-5 border border-red-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-8 h-8 rounded-xl bg-red-100 text-red-500 flex items-center justify-center shrink-0"><i className="fa-solid fa-ban text-sm"></i></span>
                  <h3 className="text-[11px] sm:text-xs font-bold text-gray-500 leading-tight">Pesanan Batal</h3>
                </div>
                <p className="text-lg sm:text-2xl font-extrabold text-gray-800">{keuangan.batalCount} <span className="text-xs font-bold text-gray-400">pesanan</span></p>
                <p className="text-[11px] sm:text-xs font-semibold text-red-500 mt-1">Nominal: {fmtRupiah(keuangan.batalTotal)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5">
              <div className="bg-white rounded-3xl shadow-card p-4 sm:p-5 border border-lavender-50 min-w-0">
                <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                  <h3 className="text-sm font-extrabold text-gray-800">Tren Penghasilan</h3>
                  <span className="text-[11px] font-semibold text-gray-400">Periode: {periodeLabel}</span>
                </div>
                <div className="h-52 sm:h-60 w-full"><canvas ref={trendRef}></canvas></div>
              </div>
              <div className="bg-white rounded-3xl shadow-card p-4 sm:p-5 border border-lavender-50 min-w-0">
                <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                  <h3 className="text-sm font-extrabold text-gray-800">Tren Total Pesanan</h3>
                  <span className="text-[11px] font-semibold text-gray-400">Periode: {periodeLabel}</span>
                </div>
                <div className="h-52 sm:h-60 w-full"><canvas ref={ordersTrendRef}></canvas></div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-card border border-lavender-50 p-4 sm:p-5">
              <div className="mb-4">
                <h2 className="text-lg font-extrabold text-gray-800">Rincian Transaksi Selesai</h2>
                <p className="text-xs font-semibold text-gray-400">Periode: {periodeLabel}</p>
              </div>
              <div className="overflow-x-auto -mx-1 px-1">
                <table className="w-full text-left border-collapse text-sm min-w-[980px]">
                  <thead>
                    <tr className="border-b border-gray-100 bg-lavender-50/50 text-gray-500 text-xs font-extrabold uppercase tracking-wider">
                      <th className="py-4 px-6 whitespace-nowrap">No. Pesanan & Tanggal</th>
                      <th className="py-4 px-6 whitespace-nowrap">Pelanggan</th>
                      <th className="py-4 px-6 whitespace-nowrap">No. WA</th>
                      <th className="py-4 px-6 whitespace-nowrap">Layanan</th>
                      <th className="py-4 px-6 whitespace-nowrap">Nominal</th>
                      <th className="py-4 px-6 whitespace-nowrap">Pembayaran</th>
                      <th className="py-4 px-6 whitespace-nowrap">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                    {pagedDoneOrders.length ? pagedDoneOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-lavender-50/30 transition-colors duration-200">
                        <td className="py-4 px-6 align-top">
                          <span className="font-extrabold block whitespace-nowrap text-gray-800">{o.order_number || `ORD-#${o.id}`}</span>
                          <span className="text-xs text-gray-400 font-medium">{fmtDate(o.updated_at || o.tanggal_fix || o.tanggal_usulan)}</span>
                        </td>
                        <td className="py-4 px-6 align-top">
                          <span className="font-extrabold text-gray-800 block">{o.customer_name}</span>
                          <span className="text-xs font-medium text-gray-500 block mt-0.5">{o.alamat || '-'}</span>
                        </td>
                        <td className="py-4 px-6 align-top text-gray-700 font-semibold whitespace-nowrap">{o.customer_wa || '-'}</td>
                        <td className="py-4 px-6 align-top text-gray-600 text-[13px] font-medium">{(o.items || []).map(it => `${it.service_name} (${it.qty}x)`).join(', ') || '-'}</td>
                        <td className="py-4 px-6 align-top font-extrabold whitespace-nowrap text-gray-800">{fmtRupiah(o.total_harga)}</td>
                        <td className="py-4 px-6 align-top text-xs">{renderPembayaran(o)}</td>
                        <td className="py-4 px-6 align-top">
                          <button type="button" onClick={() => printInvoice(o)} className="w-9 h-9 inline-flex items-center justify-center rounded-xl bg-lavender-600 text-white hover:bg-lavender-700 transition-colors shadow-sm" title="Cetak Invoice" aria-label="Cetak Invoice">
                            <i className="fa-solid fa-print text-xs"></i>
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={7} className="py-10 text-center font-bold text-gray-400">Belum ada transaksi selesai pada periode ini.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex flex-col min-[480px]:flex-row min-[480px]:items-center gap-2 min-[480px]:justify-between">
                <p className="text-xs font-bold text-gray-400 text-center min-[480px]:text-left">
                  Menampilkan {doneOrders.length ? (safePage - 1) * pageSize + 1 : 0}–{Math.min(safePage * pageSize, doneOrders.length)} dari {doneOrders.length} transaksi
                </p>
                <div className="flex items-center justify-center gap-2">
                  {safePage <= 1 ? (
                    <span className="px-4 py-2 rounded-full bg-white text-gray-300 font-extrabold text-xs shadow-card cursor-not-allowed select-none">‹ Prev</span>
                  ) : (
                    <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-4 py-2 rounded-full bg-white text-lavender-600 font-extrabold text-xs shadow-card hover:bg-lavender-600 hover:text-white transition-all">‹ Prev</button>
                  )}
                  <span className="min-w-[2.5rem] text-center px-4 py-2 rounded-full bg-lavender-600 text-white font-extrabold text-xs shadow-md select-none">{safePage}</span>
                  {safePage >= totalPages ? (
                    <span className="px-4 py-2 rounded-full bg-white text-gray-300 font-extrabold text-xs shadow-card cursor-not-allowed select-none">Next ›</span>
                  ) : (
                    <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-4 py-2 rounded-full bg-white text-lavender-600 font-extrabold text-xs shadow-card hover:bg-lavender-600 hover:text-white transition-all">Next ›</button>
                  )}
                </div>
              </div>
            </div>
        </>
      </div>

      <div id="laporanPdf" className="hidden">
        <div className="bg-white text-gray-900" style={{ fontFamily: "'Nunito', sans-serif", fontSize: '12px', lineHeight: 1.45, color: '#111827' }}>
          <div style={{ padding: '24px 32px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#7c3aed', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="fa-solid fa-broom" style={{ fontSize: '22px' }}></i>
                </div>
                <div>
                  <p style={{ fontSize: '30px', fontWeight: 800, lineHeight: 1.1, margin: 0, letterSpacing: '-0.02em' }}>{setting.business_name || 'BersihinKost'}</p>
                  <p style={{ fontSize: '16px', fontWeight: 600, color: '#6b7280', margin: '2px 0 0 0', lineHeight: 1.2 }}>Layanan Kebersihan Kost</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '0.08em', margin: 0, color: '#111827' }}>LAPORAN KEUANGAN</p>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', margin: '6px 0 0 0' }}>Periode: {periodeLabel}</p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e5e7eb', margin: '20px 0' }}></div>

            {/* Ringkasan */}
            <p style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.08em', color: '#9ca3af', margin: '0 0 10px 0' }}>RINGKASAN KINERJA KEUANGAN</p>
            <div style={{ display: 'grid', rowGap: '6px', fontSize: '13px', color: '#111827' }}>
              <div style={{ display: 'flex' }}><span style={{ width: '220px', color: '#4b5563', fontWeight: 600 }}>Total Pemasukan</span><span style={{ fontWeight: 800 }}>: {fmtRupiah(keuangan.total)}</span></div>
              <div style={{ display: 'flex' }}><span style={{ width: '220px', color: '#4b5563', fontWeight: 600 }}>Pesanan Selesai</span><span style={{ fontWeight: 800 }}>: {keuangan.count} pesanan</span></div>
              <div style={{ display: 'flex' }}><span style={{ width: '220px', color: '#4b5563', fontWeight: 600 }}>Rata-rata / Hari</span><span style={{ fontWeight: 800 }}>: {fmtRupiah(keuangan.rata)} ({keuangan.days} hari)</span></div>
              <div style={{ display: 'flex' }}><span style={{ width: '220px', color: '#4b5563', fontWeight: 600 }}>Pesanan Batal</span><span style={{ fontWeight: 800 }}>: {keuangan.batalCount} pesanan (Nominal: {fmtRupiah(keuangan.batalTotal)})</span></div>
            </div>

            <div style={{ borderTop: '1px solid #e5e7eb', margin: '20px 0 16px 0' }}></div>

            {/* Rincian */}
            <p style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.08em', color: '#9ca3af', margin: '0 0 10px 0' }}>RINCIAN TRANSAKSI SELESAI</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb', color: '#6b7280' }}>
                  <th style={{ textAlign: 'left', padding: '10px 8px 10px 0', fontWeight: 800, fontSize: '11px', letterSpacing: '0.06em' }}>NO. PESANAN</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 800, fontSize: '11px', letterSpacing: '0.06em' }}>PELANGGAN</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 800, fontSize: '11px', letterSpacing: '0.06em' }}>LAYANAN</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 800, fontSize: '11px', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>NOMINAL</th>
                  <th style={{ textAlign: 'left', padding: '10px 0 10px 8px', fontWeight: 800, fontSize: '11px', letterSpacing: '0.06em' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {doneOrders.length ? doneOrders.map((o) => {
                  const stKey = o?.payment_status || ''
                  const st = { lunas: 'Lunas', belum_lunas: 'Belum Lunas' }[stKey] || '-'
                  const mt = { tunai: 'Tunai', transfer: 'Transfer', qris: 'QRIS', lainnya: 'Lainnya' }[o?.payment_method] || ''
                  const statusText = mt ? `${st} (${mt})` : st
                  return (
                    <tr key={o.id} style={{ borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' }}>
                      <td style={{ padding: '10px 8px 10px 0' }}>
                        <div style={{ fontWeight: 800, color: '#111827', whiteSpace: 'nowrap' }}>{o.order_number || `ORD-#${o.id}`}</div>
                        <div style={{ color: '#6b7280', fontWeight: 600, marginTop: '2px' }}>{fmtDate(o.updated_at || o.tanggal_fix || o.tanggal_usulan)}</div>
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <div style={{ fontWeight: 800, color: '#111827' }}>{o.customer_name || '-'}</div>
                        <div style={{ color: '#4b5563', fontWeight: 600, marginTop: '2px' }}>{o.customer_wa || '-'}</div>
                      </td>
                      <td style={{ padding: '10px 8px', color: '#374151', fontWeight: 600 }}>{(o.items || []).map(it => `${it.service_name} (${it.qty}x)`).join(', ') || '-'}</td>
                      <td style={{ padding: '10px 8px', fontWeight: 800, color: '#111827', whiteSpace: 'nowrap' }}>{fmtRupiah(o.total_harga)}</td>
                      <td style={{ padding: '10px 0 10px 8px', fontWeight: 600, color: '#1f2937', whiteSpace: 'nowrap' }}>{statusText}</td>
                    </tr>
                  )
                }) : (
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td colSpan={5} style={{ padding: '20px 0', textAlign: 'center', fontWeight: 700, color: '#9ca3af' }}>Belum ada pemasukan pada periode ini.</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '2px' }}></div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 0', fontSize: '13px', fontWeight: 800, color: '#111827' }}>
              <span style={{ marginRight: '24px' }}>TOTAL KESELURUHAN</span>
              <span>{fmtRupiah(keuangan.total)}</span>
            </div>
            <div style={{ borderTop: '1px solid #e5e7eb', marginBottom: '14px' }}></div>

            <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', fontSize: '13px', color: '#1f2937' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: 0 }}>Dicetak pada: {fmtDateLong(new Date().toISOString())}</p>
              <div style={{ textAlign: 'center', minWidth: '220px' }}>
                <p style={{ margin: 0 }}>Mengetahui,</p>
                <p style={{ margin: '2px 0 0 0' }}>Pengelola {setting.business_name || 'Bersihinkost'}</p>
                <div style={{ height: '56px' }}></div>
                <p style={{ margin: 0 }}>( ______________________ )</p>
                <p style={{ margin: '4px 0 0 0', fontWeight: 800 }}>{setting.operator_name || 'Admin'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="invoicePdf" className="hidden">
        {invoiceOrder ? <InvoiceSheet order={invoiceOrder} setting={setting} /> : null}
      </div>
    </>
  )
}
