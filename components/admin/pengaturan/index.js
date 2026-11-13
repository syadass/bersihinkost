'use client'

import { useEffect, useState } from 'react'
import AdminLayout, { useConfirmModal } from '@/components/layouts/admin'

function initials(name) {
  const parts = String(name || 'A').trim().split(/\s+/)
  return ((parts[0]?.[0] || 'A') + (parts[1]?.[0] || '')).toUpperCase()
}

export default function PengaturanIndex() {
  return (
    <AdminLayout>
      <PengaturanIndexInner />
    </AdminLayout>
  )
}

function PengaturanIndexInner() {
  const confirm = useConfirmModal()
  const [user, setUser] = useState({ name: 'Administrator', email: '' })
  const [setting, setSetting] = useState({ business_name: 'Bersihinkost', operator_name: 'Admin', admin_wa_number: '', is_open: true, jam_mulai: '08:00', jam_selesai: '17:00', catatan_publik: '' })
  const [liburDates, setLiburDates] = useState([])
  const [msg, setMsg] = useState({ ok: '', err: '' })

  const [profil, setProfil] = useState({ business_name: '', operator_name: '', admin_wa_number: '' })
  const [ops, setOps] = useState({ is_open: true, jam_mulai: '08:00', jam_selesai: '17:00', catatan_publik: '' })
  const [liburForm, setLiburForm] = useState({ tanggal: '', keterangan: '' })

  const [accountOpen, setAccountOpen] = useState(false)
  const [account, setAccount] = useState({ name: '', email: '', email_confirmation: '', password: '', password_confirmation: '' })
  const [accountErrors, setAccountErrors] = useState([])
  const [saving, setSaving] = useState({})

  async function load() {
    try {
      const [meR, sR, hR] = await Promise.all([
        fetch('/api/auth/me', { cache: 'no-store' }),
        fetch('/api/settings', { cache: 'no-store' }),
        fetch('/api/holidays', { cache: 'no-store' }),
      ])
      const me = await meR.json().catch(() => ({}))
      const sd = await sR.json().catch(() => ({}))
      const hd = await hR.json().catch(() => ({}))
      if (me?.user) {
        setUser(me.user)
        setAccount((a) => ({ ...a, name: me.user.name || '', email: me.user.email || '', email_confirmation: me.user.email || '' }))
      }
      const st = sd.setting || {}
      const merged = { business_name: 'Bersihinkost', operator_name: 'Admin', admin_wa_number: '', is_open: true, jam_mulai: '08:00', jam_selesai: '17:00', catatan_publik: '', ...st }
      setSetting(merged)
      setProfil({ business_name: merged.business_name || '', operator_name: merged.operator_name || '', admin_wa_number: merged.admin_wa_number || '' })
      setOps({ is_open: !!merged.is_open, jam_mulai: merged.jam_mulai || '08:00', jam_selesai: merged.jam_selesai || '17:00', catatan_publik: merged.catatan_publik || '' })
      setLiburDates(Array.isArray(hd.dates) ? hd.dates : [])
    } catch { /* ignore */ }
  }

  useEffect(() => { load() }, [])

  async function saveProfil(e) {
    e.preventDefault()
    setSaving((s) => ({ ...s, profil: true })); setMsg({ ok: '', err: '' })
    try {
      const r = await fetch('/api/settings?action=profil', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profil) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.message || 'Gagal menyimpan profil.')
      setMsg({ ok: d.message || 'Profil usaha disimpan.', err: '' })
      await load()
    } catch (err) { setMsg({ ok: '', err: err.message }) }
    finally { setSaving((s) => ({ ...s, profil: false })) }
  }

  async function saveOperasional(e) {
    e.preventDefault()
    setSaving((s) => ({ ...s, ops: true })); setMsg({ ok: '', err: '' })
    try {
      const r = await fetch('/api/settings?action=operasional', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...ops, catatan_publik: ops.catatan_publik || null }) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.message || 'Gagal menyimpan jam operasional.')
      setMsg({ ok: d.message || 'Jam operasional disimpan.', err: '' })
      await load()
    } catch (err) { setMsg({ ok: '', err: err.message }) }
    finally { setSaving((s) => ({ ...s, ops: false })) }
  }

  async function addLibur(e) {
    e.preventDefault()
    setSaving((s) => ({ ...s, libur: true })); setMsg({ ok: '', err: '' })
    try {
      const r = await fetch('/api/holidays', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tanggal: liburForm.tanggal, keterangan: liburForm.keterangan || null }) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.message || 'Gagal menambahkan tanggal libur.')
      setMsg({ ok: d.message || 'Tanggal libur ditambahkan.', err: '' })
      setLiburForm({ tanggal: '', keterangan: '' })
      await load()
    } catch (err) { setMsg({ ok: '', err: err.message }) }
    finally { setSaving((s) => ({ ...s, libur: false })) }
  }

  function deleteLibur(l) {
    confirm.open({
      title: 'Hapus Tanggal Libur?',
      message: `Tanggal libur ${l.tanggal}${l.keterangan ? ` (${l.keterangan})` : ''} akan dihapus.`,
      confirmText: 'Ya, Hapus',
      tone: 'red',
      icon: 'fa-trash-can',
      onConfirm: async () => {
        try {
          const r = await fetch(`/api/holidays?id=${l.id}`, { method: 'DELETE' })
          const d = await r.json().catch(() => ({}))
          if (!r.ok) throw new Error(d.message || 'Gagal.')
          setMsg({ ok: d.message || 'Tanggal libur dihapus.', err: '' })
          await load()
        } catch (err) { setMsg({ ok: '', err: err.message }) }
      },
    })
  }

  function openAccountModal() { setAccountErrors([]); setAccountOpen(true) }
  function closeAccountModal() { setAccountOpen(false) }

  async function saveAccount(e) {
    e.preventDefault()
    setSaving((s) => ({ ...s, akun: true })); setAccountErrors([])
    try {
      const r = await fetch('/api/settings?action=account', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(account) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) {
        const errs = d.errors ? Object.values(d.errors).flat() : [d.message || 'Gagal menyimpan.']
        setAccountErrors(errs)
      } else {
        window.location.reload()
        return
      }
    } catch {
      setAccountErrors(['Tidak dapat terhubung. Periksa koneksi internet.'])
    } finally { setSaving((s) => ({ ...s, akun: false })) }
  }

  function askLogout() {
    confirm.open({
      title: 'Keluar dari Dashboard?',
      message: 'Sesi login akan diakhiri. Anda harus login ulang untuk mengelola pesanan.',
      confirmText: 'Ya, Keluar',
      tone: 'red',
      icon: 'fa-right-from-bracket',
      onConfirm: async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST' })
        } finally {
          window.location.href = '/login'
        }
      },
    })
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <>
      {msg.ok ? <div className="max-w-4xl w-full mx-auto mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-3 rounded-2xl text-sm font-bold flex items-center gap-2"><i className="fa-solid fa-circle-check"></i> {msg.ok}</div> : null}
      {msg.err ? <div className="max-w-4xl w-full mx-auto mb-4 bg-red-50 border border-red-200 text-red-600 px-5 py-3 rounded-2xl text-sm font-bold">{msg.err}</div> : null}

      <header className="max-w-4xl w-full mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6 pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">Pengaturan Sistem</h1>
          <p className="text-xs sm:text-sm font-bold text-lavender-500">Kelola profil usaha, kontak WhatsApp, dan jam operasional</p>
        </div>

        <div className="flex items-center gap-3 bg-white pl-3 pr-5 py-2 rounded-full shadow-card border border-lavender-100 self-start sm:self-auto">
          <div className="w-10 h-10 rounded-full bg-peach-100 text-peach-600 flex items-center justify-center font-extrabold border-2 border-white shadow-sm">
            {initials(user.name)}
          </div>
          <div>
            <p className="text-sm font-extrabold text-gray-800 leading-tight">{user.name}</p>
            <p className="text-[10px] font-extrabold text-peach-500 uppercase tracking-wider">Solo Operator</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-6 sm:pr-2 min-h-0">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

          <form onSubmit={saveProfil} className="bg-white p-4 sm:p-6 rounded-3xl shadow-card border border-lavender-50 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-2xl bg-lavender-50 text-lavender-600 flex items-center justify-center font-bold">
                  <i className="fa-solid fa-store"></i>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-800">Profil Usaha & Kontak</h3>
                  <p className="text-xs font-semibold text-gray-400">Informasi yang tampil di web publik</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-gray-600 mb-1">Nama Usaha</label>
                  <input type="text" name="business_name" value={profil.business_name} onChange={(e) => setProfil({ ...profil, business_name: e.target.value })} required maxLength={100} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400" />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-gray-600 mb-1">Nama Pengelola (Solo Operator)</label>
                  <input type="text" name="operator_name" value={profil.operator_name} onChange={(e) => setProfil({ ...profil, operator_name: e.target.value })} required className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400" />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-gray-600 mb-1">Nomor WhatsApp (Penerima Pesanan)</label>
                  <input type="text" name="admin_wa_number" value={profil.admin_wa_number} onChange={(e) => setProfil({ ...profil, admin_wa_number: e.target.value })} required className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400" />
                  <p className="text-[11px] text-gray-400 font-bold mt-1">Format 628... Semua tombol "Pesan via WhatsApp" mengarah ke nomor ini.</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <button disabled={saving.profil} className="w-full py-3.5 rounded-2xl bg-lavender-600 text-white font-extrabold text-sm shadow-md hover:bg-lavender-700 transition-all disabled:opacity-60">
                {saving.profil ? 'Menyimpan...' : 'Simpan Perubahan Profil'}
              </button>
            </div>
          </form>

          <form onSubmit={saveOperasional} className="bg-white p-4 sm:p-6 rounded-3xl shadow-card border border-lavender-50 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-2xl bg-peach-50 text-peach-600 flex items-center justify-center font-bold">
                  <i className="fa-solid fa-clock"></i>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-800">Jam Operasional</h3>
                  <p className="text-xs font-semibold text-gray-400">Atur ketersediaan layanan harian</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-gray-600 mb-1">Status Pengerjaan Harian</label>
                  <select id="statusSelect" value={ops.is_open ? 'open' : 'closed'} onChange={(e) => setOps({ ...ops, is_open: e.target.value === 'open' })} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                    <option value="open">Buka (Menerima Pesanan)</option>
                    <option value="closed">Tutup (Sedang Libur / Istirahat)</option>
                  </select>
                  <label className="flex items-center gap-2 text-xs font-extrabold text-gray-500 mt-2">
                    <input type="checkbox" id="isOpenCheck" checked={!!ops.is_open} onChange={(e) => setOps({ ...ops, is_open: e.target.checked })} className="w-4 h-4 accent-purple-600" /> Tampilkan badge "Buka Hari Ini" di halaman umum
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-1">
                    <label className="block text-xs font-extrabold text-gray-600 mb-1">Jam Mulai</label>
                    <input type="time" name="jam_mulai" value={ops.jam_mulai} onChange={(e) => setOps({ ...ops, jam_mulai: e.target.value })} required className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400" />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-extrabold text-gray-600 mb-1">Jam Selesai</label>
                    <input type="time" name="jam_selesai" value={ops.jam_selesai} onChange={(e) => setOps({ ...ops, jam_selesai: e.target.value })} required className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-gray-600 mb-1">Catatan Khusus untuk Pemesan</label>
                  <textarea name="catatan_publik" rows={2} maxLength={500} value={ops.catatan_publik} onChange={(e) => setOps({ ...ops, catatan_publik: e.target.value })} placeholder="Info tambahan di halaman pemesanan..." className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400" />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <button disabled={saving.ops} className="w-full py-3.5 rounded-2xl bg-peach-500 text-white font-extrabold text-sm shadow-md hover:bg-peach-600 transition-all disabled:opacity-60">
                {saving.ops ? 'Menyimpan...' : 'Simpan Jam Operasional'}
              </button>
            </div>
          </form>

          <div className="md:col-span-2 bg-white p-4 sm:p-6 rounded-3xl shadow-card border border-lavender-50 min-w-0">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center font-bold">
                <i className="fa-solid fa-calendar-xmark"></i>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-800">Tanggal Libur / Tutup</h3>
                <p className="text-xs font-semibold text-gray-400">Pemesan tidak bisa memilih tanggal-tanggal ini</p>
              </div>
            </div>
            <form onSubmit={addLibur} className="flex flex-col sm:flex-row gap-2 mb-4">
              <input type="date" value={liburForm.tanggal} onChange={(e) => setLiburForm({ ...liburForm, tanggal: e.target.value })} required min={today} className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-300" />
              <input type="text" value={liburForm.keterangan} onChange={(e) => setLiburForm({ ...liburForm, keterangan: e.target.value })} maxLength={100} placeholder="Keterangan (opsional, cth: Libur Lebaran)" className="flex-1 min-w-0 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-300" />
              <button disabled={saving.libur} className="px-5 py-3 rounded-2xl bg-red-500 text-white font-extrabold text-sm shadow-md hover:bg-red-600 transition-all whitespace-nowrap disabled:opacity-60">+ Tambah Libur</button>
            </form>
            <div className="flex flex-wrap gap-2">
              {liburDates.length ? liburDates.map((l) => (
                <span key={l.id || l.tanggal} className="inline-flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full bg-red-50 border border-red-100 text-xs font-extrabold text-red-500">
                  {l.tanggal}{l.keterangan ? ` · ${l.keterangan}` : ''}
                  <button type="button" onClick={() => deleteLibur(l)} className="w-6 h-6 rounded-full bg-white text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors font-bold" title="Hapus tanggal libur">×</button>
                </span>
              )) : <p className="text-xs font-bold text-gray-400">Belum ada tanggal libur. Semua tanggal bisa dipesan.</p>}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-card border border-lavender-50 p-6 mt-6 text-sm font-bold text-gray-600">
          <div className="flex items-center justify-between gap-3 mb-2">
            <h3 className="font-extrabold text-gray-800">Akun Login</h3>
            <button type="button" onClick={openAccountModal} className="px-4 py-2 rounded-full bg-lavender-50 text-lavender-600 text-xs font-extrabold hover:bg-lavender-100 transition-colors flex items-center gap-1.5">
              <i className="fa-solid fa-pen-to-square"></i> Ubah
            </button>
          </div>
          <p>Email: <span className="font-extrabold">{user.email || '-'}</span></p>
          <button type="button" onClick={askLogout} className="mt-4 w-full py-3 rounded-2xl bg-red-50 text-red-500 font-extrabold text-sm hover:bg-red-100 transition-all"><i className="fa-solid fa-right-from-bracket mr-2"></i>Keluar dari Dashboard</button>
        </div>
      </div>

      {accountOpen && (
        <div id="accountModal" className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target.id === 'accountModal') closeAccountModal() }}>
          <div className="bg-white rounded-[2rem] shadow-float w-full max-w-md border border-lavender-50 relative max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center gap-3 p-5 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="text-lg font-extrabold text-gray-800">Ubah Akun Login</h3>
                <p className="text-xs font-semibold text-gray-400">Nama, email, dan kata sandi — kosongkan sandi bila tidak diganti</p>
              </div>
              <button type="button" onClick={closeAccountModal} className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 shrink-0">
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>
            <form id="accountForm" onSubmit={saveAccount} className="overflow-y-auto p-5 space-y-4">
              {accountErrors.length > 0 && (
                <div id="accountErrors" className="bg-red-50 border border-red-200 text-red-500 text-xs font-bold px-4 py-3 rounded-2xl">
                  <ul className="list-disc pl-4 space-y-0.5">{accountErrors.map((m, i) => <li key={i}>{m}</li>)}</ul>
                </div>
              )}
              <div>
                <label className="block text-xs font-extrabold text-gray-600 mb-1">Nama Pengelola</label>
                <input type="text" name="name" value={account.name} onChange={(e) => setAccount({ ...account, name: e.target.value })} required maxLength={100} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400" />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-gray-600 mb-1">Email Login</label>
                <input type="email" name="email" value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} required maxLength={100} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400" />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-gray-600 mb-1">Ulangi Email Baru <span className="font-semibold text-gray-400">(wajib sama, anti typo)</span></label>
                <input type="email" name="email_confirmation" value={account.email_confirmation} onChange={(e) => setAccount({ ...account, email_confirmation: e.target.value })} required maxLength={100} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-gray-600 mb-1">Kata Sandi Baru</label>
                  <input type="password" id="accPassword" name="password" minLength={8} value={account.password} onChange={(e) => setAccount({ ...account, password: e.target.value })} placeholder="Min. 8 karakter" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400" />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-gray-600 mb-1">Ulangi Sandi</label>
                  <input type="password" id="accPasswordConfirm" name="password_confirmation" minLength={8} value={account.password_confirmation} onChange={(e) => setAccount({ ...account, password_confirmation: e.target.value })} placeholder="Ulangi sandi" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button type="button" onClick={closeAccountModal} className="py-3 rounded-2xl bg-gray-100 text-gray-600 font-extrabold text-sm hover:bg-gray-200 transition-colors">Batal</button>
                <button disabled={saving.akun} className="py-3 rounded-2xl bg-lavender-600 text-white font-extrabold text-sm shadow-md hover:bg-lavender-700 transition-all disabled:opacity-60">{saving.akun ? 'Menyimpan...' : 'Simpan Akun'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
