'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function ResetPassword({ token }) {
  const [form, setForm] = useState({ email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [ok, setOk] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const email = params.get('email') || ''
    setForm((f) => ({ ...f, email }))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email: form.email, password: form.password, password_confirmation: form.confirm }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.message || 'Gagal mengganti kata sandi.')
        return
      }
      window.location.href = '/login?ok=' + encodeURIComponent('Kata sandi berhasil diganti. Silakan masuk.')
      return
    } catch (err) {
      setError('Terjadi kesalahan jaringan.')
    } finally {
      setLoading(false)
    }
  }

  if (ok) {
    return (
      <div className="flex-1 w-full flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-lavender-200 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-peach-200 rounded-full blur-3xl opacity-50"></div>
        <main className="w-full max-w-md bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-float border border-lavender-50 p-5 sm:p-10 relative z-10 flex flex-col items-center">
          <p className="text-sm font-bold text-emerald-600">Kata sandi berhasil diganti.</p>
          <Link href="/login" className="mt-4 text-lavender-600 font-extrabold">Ke Login</Link>
        </main>
      </div>
    )
  }

  return (
    <div className="flex-1 w-full flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Blur Circles */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-lavender-200 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-peach-200 rounded-full blur-3xl opacity-50"></div>

      {/* Card Container */}
      <main className="w-full max-w-md bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-float border border-lavender-50 p-5 sm:p-10 relative z-10 flex flex-col items-center">

        <div className="w-16 h-16 bg-gradient-to-tr from-emerald-400 to-emerald-500 rounded-3xl flex items-center justify-center text-white shadow-lg mb-5">
          <i className="fa-solid fa-lock-open text-2xl"></i>
        </div>

        <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight text-center">Buat Sandi Baru</h1>
        <p className="text-xs font-bold text-lavender-500 mt-1 mb-8 text-center">Minimal 8 karakter — jangan pakai sandi lama</p>

        {error && (
          <div className="w-full mb-4 bg-red-50 border border-red-200 text-red-500 text-xs font-bold px-4 py-3 rounded-2xl">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <input type="hidden" name="token" value={token} />
          <div>
            <label className="block text-xs font-extrabold text-gray-600 mb-1.5">Email Akun</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                <i className="fa-solid fa-envelope text-xs"></i>
              </span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                placeholder="nama@bersihinkost.com"
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lavender-400 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-gray-600 mb-1.5">Kata Sandi Baru</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                <i className="fa-solid fa-lock text-xs"></i>
              </span>
              <input
                type={showPw ? 'text' : 'password'}
                id="password"
                name="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={8}
                placeholder="••••••••"
                className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lavender-400 transition-all"
              />
              <button type="button" onClick={() => setShowPw(v => !v)} title={showPw ? 'Sembunyikan sandi' : 'Tampilkan sandi'} className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-lavender-600 transition-colors">
                <i className={`fa-solid ${showPw ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-gray-600 mb-1.5">Ulangi Sandi Baru</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                <i className="fa-solid fa-lock text-xs"></i>
              </span>
              <input
                type={showPw2 ? 'text' : 'password'}
                id="password_confirmation"
                name="password_confirmation"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                required
                minLength={8}
                placeholder="••••••••"
                className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lavender-400 transition-all"
              />
              <button type="button" onClick={() => setShowPw2(v => !v)} title={showPw2 ? 'Sembunyikan sandi' : 'Tampilkan sandi'} className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-lavender-600 transition-colors">
                <i className={`fa-solid ${showPw2 ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-extrabold text-sm shadow-lg hover:bg-emerald-600 hover:shadow-xl transition-all flex justify-center items-center gap-2 mt-2">
            <i className="fa-solid fa-check"></i> {loading ? 'Menyimpan...' : 'Simpan Sandi Baru'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 w-full text-center">
          <Link href="/login" className="text-xs font-extrabold text-gray-400 hover:text-lavender-600 transition-colors flex items-center justify-center gap-1.5">
            <i className="fa-solid fa-arrow-left text-[10px]"></i> Kembali ke Login
          </Link>
        </div>
      </main>
    </div>
  )
}
