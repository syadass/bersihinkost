'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { postAuth } from '@/lib/auth-client'

const menu = [
  { href: '/admin', label: 'Dashboard Utama', icon: 'fa-chart-pie', match: (p) => p === '/admin' },
  { href: '/admin/pesanan', label: 'Jadwal Hari Ini', icon: 'fa-calendar-check', match: (p) => p.startsWith('/admin/pesanan') },
  { href: '/admin/layanan', label: 'Kelola Layanan & Harga', icon: 'fa-list-check', match: (p) => p.startsWith('/admin/layanan') },
]

const ConfirmModalContext = createContext(null)

export function ConfirmModalProvider({ children }) {
  const [modal, setModal] = useState({
    open: false,
    title: 'Yakin?',
    message: 'Tindakan ini tidak dapat dibatalkan.',
    confirmText: 'Ya',
    tone: 'lavender',
    icon: 'fa-circle-question',
    onConfirm: null,
  })

  const open = useCallback(({ title = 'Yakin?', message = 'Tindakan ini tidak dapat dibatalkan.', confirmText = 'Ya', confirmOk, tone = 'lavender', icon = null, onConfirm = null }) => {
    setModal({ open: true, title, message, confirmText: confirmText || confirmOk || 'Ya', tone, icon, onConfirm })
  }, [])

  const close = useCallback(() => {
    setModal((prev) => ({ ...prev, open: false, onConfirm: null }))
  }, [])

  const submit = useCallback(() => {
    if (modal.onConfirm) modal.onConfirm()
    close()
  }, [modal.onConfirm, close])

  const toneMap = {
    lavender: { box: 'bg-lavender-50 text-lavender-600', btn: 'bg-lavender-600 hover:bg-lavender-700', icon: 'fa-circle-question' },
    red: { box: 'bg-red-50 text-red-500', btn: 'bg-red-500 hover:bg-red-600', icon: 'fa-triangle-exclamation' },
    emerald: { box: 'bg-emerald-50 text-emerald-600', btn: 'bg-emerald-500 hover:bg-emerald-600', icon: 'fa-circle-check' },
    blue: { box: 'bg-blue-50 text-blue-600', btn: 'bg-blue-500 hover:bg-blue-600', icon: 'fa-calendar-days' },
    peach: { box: 'bg-peach-50 text-peach-600', btn: 'bg-peach-500 hover:bg-peach-600', icon: 'fa-file-arrow-down' },
  }

  const t = toneMap[modal.tone] || toneMap.lavender

  return (
    <ConfirmModalContext.Provider value={{ open, close, submit, modal }}>
      {children}
      <div id="confirmModal" className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] ${modal.open ? 'flex items-center justify-center p-4' : 'hidden'}`} onClick={(e) => { if (e.target.id === 'confirmModal') close() }}>
        <div className="bg-white rounded-[2rem] shadow-float w-full max-w-sm p-6 border border-lavender-50 text-center">
          <div id="confirmIconWrap" className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-xl mb-3 ${t.box}`}>
            <i id="confirmIcon" className={`fa-solid ${modal.icon || t.icon}`}></i>
          </div>
          <h3 id="confirmTitle" className="text-lg font-extrabold text-gray-800">{modal.title}</h3>
          <p id="confirmMessage" className="text-xs font-semibold text-gray-500 mt-1 mb-5">{modal.message}</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={close} className="py-3 rounded-2xl bg-gray-100 text-gray-600 font-extrabold text-sm hover:bg-gray-200 transition-colors">Batal</button>
            <button id="confirmYesBtn" onClick={submit} className={`py-3 rounded-2xl text-white font-extrabold text-sm shadow-md transition-all ${t.btn}`}>{modal.confirmText}</button>
          </div>
        </div>
      </div>
    </ConfirmModalContext.Provider>
  )
}

export function useConfirmModal() {
  const ctx = useContext(ConfirmModalContext)
  if (!ctx) throw new Error('useConfirmModal harus digunakan di dalam ConfirmModalProvider')
  return ctx
}

function AdminShell({ children, rightPanel }) {
  const pathname = usePathname() || ''
  const confirm = useConfirmModal()
  const [pendingCount, setPendingCount] = useState(0)
  const [notif, setNotif] = useState(null)
  const lastPendingRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    async function check(isInitial = false) {
      try {
        const r = await fetch('/api/orders?tab=menunggu-acc&page=1', { cache: 'no-store' })
        if (!r.ok) return
        const d = await r.json().catch(() => ({}))
        const count = Number(d?.counts?.['menunggu-acc'] ?? (Array.isArray(d?.orders) ? d.orders.length : 0)) || 0
        if (cancelled) return
        setPendingCount(count)
        if (isInitial) {
          lastPendingRef.current = count
          return
        }
        if (lastPendingRef.current !== null && count > lastPendingRef.current) {
          const diff = count - lastPendingRef.current
          setNotif({ count, diff })
        }
        lastPendingRef.current = count
      } catch {}
    }
    check(true)
    const t = setInterval(() => check(false), 30000)
    return () => { cancelled = true; clearInterval(t) }
  }, [])

  const handleLogout = () => {
    confirm.open({
      title: 'Keluar dari Dashboard?',
      message: 'Sesi login Anda akan diakhiri. Anda perlu masuk kembali untuk mengelola dashboard.',
      confirmText: 'Ya, Keluar',
      tone: 'red',
      icon: 'fa-right-from-bracket',
      onConfirm: async () => {
        try {
          await postAuth('/api/auth/logout', {})
        } finally {
          window.location.href = '/login'
        }
      },
    })
  }

  const itemClass = (active) =>
    active
      ? 'w-10 h-10 sm:w-11 sm:h-11 lg:w-14 lg:h-14 bg-white rounded-2xl lg:rounded-3xl flex items-center justify-center text-lavender-600 shadow-lg transform transition-transform hover:scale-105 shrink-0'
      : 'w-10 h-10 sm:w-11 sm:h-11 lg:w-14 lg:h-14 text-lavender-200 hover:bg-white/10 rounded-2xl lg:rounded-3xl flex items-center justify-center transition-colors shrink-0'

  return (
    <>
      <Script src="https://cdn.jsdelivr.net/npm/chart.js" strategy="afterInteractive" />
      <div className="min-h-screen lg:h-screen w-full flex flex-col lg:flex-row overflow-x-hidden lg:overflow-hidden p-3 sm:p-5 gap-3 sm:gap-5 selection:bg-peach-400 selection:text-white">
        <aside className="w-full lg:w-24 bg-gradient-to-r lg:bg-gradient-to-b from-lavender-600 to-lavender-800 rounded-2xl sm:rounded-3xl lg:rounded-[3rem] flex flex-row lg:flex-col items-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3 lg:py-8 lg:px-0 shadow-float z-40 text-white shrink-0 sticky top-3 sm:top-5 lg:static">
          <Link href="/admin" className="w-10 h-10 sm:w-11 sm:h-11 lg:w-14 lg:h-14 shrink-0 bg-white/20 rounded-full flex items-center justify-center lg:mb-8 backdrop-blur-md border border-white/30 shadow-inner">
            <i className="fa-solid fa-broom text-lg sm:text-xl lg:text-2xl text-white"></i>
          </Link>

          <nav className="flex flex-row lg:flex-col gap-1.5 sm:gap-2 lg:gap-6 w-auto lg:w-full items-center flex-1 justify-center lg:justify-start overflow-x-auto scrollbar-hide px-1">
            {menu.map((m) => {
              const active = m.match(pathname)
              return (
                <Link key={m.href} href={m.href} title={m.label} className={itemClass(active)}>
                  <i className={`fa-solid ${m.icon} text-xl`}></i>
                </Link>
              )
            })}
          </nav>

          <div className="flex flex-row lg:flex-col gap-1.5 sm:gap-2 lg:gap-4 mt-0 lg:mt-auto shrink-0">
            <button onClick={handleLogout} title="Keluar dari Dashboard" className="w-10 h-10 sm:w-11 sm:h-11 lg:w-14 lg:h-14 text-lavender-200 hover:bg-white/10 rounded-2xl lg:rounded-3xl flex items-center justify-center transition-colors">
              <i className="fa-solid fa-right-from-bracket text-xl"></i>
            </button>
            <Link href="/admin/pengaturan" title="Pengaturan" className={itemClass(pathname.startsWith('/admin/pengaturan'))}>
              <i className="fa-solid fa-gear text-xl"></i>
            </Link>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 w-full bg-transparent overflow-visible pb-6 lg:pb-0">
          {children}
        </main>

        {rightPanel}
      </div>
      {notif ? (
        <div className="fixed bottom-4 right-4 z-[90] max-w-sm w-[calc(100vw-2rem)] bg-white border border-amber-200 shadow-float rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <i className="fa-solid fa-bell"></i>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-gray-800">Pesanan baru masuk</p>
              <p className="text-xs font-semibold text-gray-500 mt-0.5">{notif.count} pesanan menunggu ACC. Silakan cek dan konfirmasi.</p>
              <div className="flex gap-2 mt-3">
                <Link href="/admin/pesanan?tab=menunggu-acc" onClick={() => setNotif(null)} className="px-3 py-1.5 rounded-xl bg-lavender-600 text-white text-xs font-extrabold">Lihat Pesanan</Link>
                <button onClick={() => setNotif(null)} className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-extrabold">Tutup</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <div id="printRoot" className="hidden print:block"></div>
    </>
  )
}

export default function AdminLayout({ children, rightPanel }) {
  return (
    <ConfirmModalProvider>
      <AdminShell rightPanel={rightPanel}>{children}</AdminShell>
    </ConfirmModalProvider>
  )
}
