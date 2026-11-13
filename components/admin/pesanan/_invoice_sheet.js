'use client'

export default function InvoiceSheet({ order, setting }) {
  if (!order) return null
  const statusLabel = { pending: 'Menunggu ACC', rescheduled: 'Pindah Tanggal', confirmed: 'Terjadwal', completed: 'Lunas / Selesai', cancelled: 'Batal' }
  const fmtDateTime = (iso) => {
    if (!iso) return '-'
    return new Date(iso).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }
  const fmtDateLong = (iso) => {
    if (!iso) return '-'
    return new Date(iso).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric' })
  }
  const total = order.items?.reduce((s, i) => s + (i.subtotal || 0), 0) || order.total_harga || 0

  return (
    <div className="bg-white overflow-hidden">
      {/* Kop Invoice */}
      <div className="text-white px-6 sm:px-10 py-7 flex flex-wrap justify-between items-center gap-4" style={{ backgroundColor: '#7c3aed' }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center border border-white/30">
            <i className="fa-solid fa-broom text-xl"></i>
          </div>
          <div>
            <p className="text-xl font-black tracking-tight">{setting?.business_name || 'Bersihinkost'}</p>
            <p className="text-xs font-semibold text-white/80">Jasa Pembersihan Kamar Kost · {setting?.operator_name || 'Admin'}</p>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs font-bold text-white/70 uppercase tracking-wider">Invoice</p>
          <p className="text-2xl font-black">#{order.id}</p>
          <p className="text-xs font-semibold text-white/80">{fmtDateLong(order.created_at)}</p>
        </div>
      </div>

      <div className="px-6 sm:px-10 py-7 space-y-6">
        {/* Pemesan & Jadwal */}
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
            <p className="text-xs font-bold text-gray-400 mb-1">Ditagihkan Kepada</p>
            <p className="font-extrabold text-gray-800">{order.customer_name}</p>
            <p className="font-semibold text-gray-500 text-xs mt-1">{order.alamat}</p>
          </div>
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-1">
            <p className="text-xs font-bold text-gray-400">Status: <span className="text-gray-800 font-extrabold">{statusLabel[order.status] || order.status}</span></p>
            <p className="text-xs font-bold text-gray-400">Order masuk: <span className="text-gray-800">{fmtDateTime(order.created_at)}</span></p>
            <p className="text-xs font-bold text-gray-400">Pengerjaan ({order.tanggal_fix ? 'fix' : 'usulan'}): <span className="text-gray-800">{fmtDateTime(order.tanggal_fix ?? order.tanggal_usulan)} WIB</span></p>
          </div>
        </div>

        {/* Tabel Layanan */}
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-gray-400 text-xs font-extrabold uppercase border-b-2 border-gray-100">
              <th className="pb-3">Layanan</th>
              <th className="pb-3 text-center">Qty</th>
              <th className="pb-3 text-right">Harga Satuan</th>
              <th className="pb-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
            {(order.items || []).map((it) => (
              <tr key={it.id}>
                <td className="py-3 font-extrabold text-gray-800">{it.service_name}</td>
                <td className="py-3 text-center">{it.qty}x</td>
                <td className="py-3 text-right">Rp{Number(it.harga_satuan).toLocaleString('id-ID')}</td>
                <td className="py-3 text-right font-extrabold">Rp{Number(it.subtotal).toLocaleString('id-ID')}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200">
              <td colSpan={3} className="pt-4 text-right text-xs font-bold text-gray-400 uppercase">Total ({order.estimasi_menit} menit)</td>
              <td className="pt-4 text-right text-2xl font-black text-lavender-600">Rp{Number(total).toLocaleString('id-ID')}</td>
            </tr>
          </tfoot>
        </table>

        {order.catatan_admin && <p className="text-xs font-semibold text-gray-500 italic">Catatan: "{order.catatan_admin}"</p>}

        <p className="text-center text-xs font-semibold text-gray-400 pt-2">Terima kasih telah menggunakan layanan Bersihinkost.</p>
      </div>
    </div>
  )
}
