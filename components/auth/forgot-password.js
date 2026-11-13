'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.message || 'Gagal memproses permintaan.')
        return
      }
      setSent(true)
    } catch (err) {
      setError('Terjadi kesalahan jaringan.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 w-full flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Blur Circles */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-lavender-200 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-peach-200 rounded-full blur-3xl opacity-50"></div>

      {/* Card Container */}
      <main className="w-full max-w-md bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-float border border-lavender-50 p-5 sm:p-10 relative z-10 flex flex-col items-center">

        <div className="w-16 h-16 bg-gradient-to-tr from-peach-400 to-peach-500 rounded-3xl flex items-center justify-center text-white shadow-lg mb-5">
          <i className="fa-solid fa-key text-2xl"></i>
        </div>

        <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight text-center">Lupa Kata Sandi?</h1>
        <p className="text-xs font-bold text-lavender-500 mt-1 mb-8 text-center">Masukkan email akun — tautan reset dikirim via email</p>

        {sent ? (
          <div className="w-full mb-4 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold px-4 py-3 rounded-2xl">Jika email terdaftar, tautan reset telah dikirim.</div>
        ) : null}
        {error && (
          <div className="w-full mb-4 bg-red-50 border border-red-200 text-red-500 text-xs font-bold px-4 py-3 rounded-2xl">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-gray-600 mb-1.5">Email Akun</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                <i className="fa-solid fa-envelope text-xs"></i>
              </span>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="nama@bersihinkost.com"
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lavender-400 transition-all"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl bg-lavender-600 text-white font-extrabold text-sm shadow-lg shadow-lavender-200 hover:bg-lavender-700 hover:shadow-xl transition-all flex justify-center items-center gap-2 mt-2">
            <i className="fa-solid fa-paper-plane"></i> {loading ? 'Mengirim...' : 'Kirim Tautan Reset'}
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
