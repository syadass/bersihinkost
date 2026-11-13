'use client'

export default function InvoiceSheet({ order, setting }) {
  if (!order) return null

  const fmtRupiah = (n) => 'Rp' + Number(n || 0).toLocaleString('id-ID')
  const fmtDateLong = (iso) => {
    if (!iso) return '-'
    return new Date(iso).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric' })
  }
  const fmtDateTimeID = (iso) => {
    if (!iso) return { date: '-', time: '-' }
    const d = new Date(iso)
    return {
      date: d.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric' }),
      time: d.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }).replace('.', '.'),
    }
  }

  const total = order.items?.reduce((s, i) => s + Number(i.subtotal || 0), 0) || Number(order.total_harga || 0)
  const ordNo = order.order_number || order.invoice_number || (order.id ? `ORD-#${order.id}` : '-')
  const payStatus = order.payment_status === 'lunas' ? 'LUNAS' : 'BELUM DIBAYAR'
  const payBadge = order.payment_status === 'lunas'
    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
    : 'bg-amber-100 text-amber-700 border-amber-200'
  const methodLabel = { tunai: 'Tunai', transfer: 'Transfer / Tunai', qris: 'QRIS', lainnya: 'Lainnya' }[order.payment_method] || 'Transfer / Tunai'
  const methodShort = { tunai: 'Tunai', transfer: 'Transfer', qris: 'QRIS', lainnya: 'Lainnya' }[order.payment_method] || '-'
  const pengerjaanIso = order.tanggal_fix || order.tanggal_usulan
  const pengerjaan = fmtDateTimeID(pengerjaanIso)

  return (
    <div className="bg-white text-gray-900 invoice-sheet">
      <div className="invoice-content px-6 sm:px-10 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-lavender-600 text-white flex items-center justify-center shrink-0">
              <i className="fa-solid fa-broom text-xl sm:text-2xl"></i>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">{setting?.business_name || 'BersihinKost'}</h1>
              <p className="text-base sm:text-lg font-semibold text-gray-500 leading-tight">Layanan Kebersihan Kost</p>
            </div>
          </div>
          <div className="sm:text-right">
            <p className="text-2xl sm:text-3xl font-extrabold tracking-[0.18em] text-gray-900">INVOICE</p>
          </div>
        </div>

        <div className="inv-mt-6 mt-5 sm:mt-6 border-t border-gray-200" />

        {/* Nomor & Status */}
        <div className="inv-mt-6 mt-5 sm:mt-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 avoid-break">
          <div>
            <p className="text-xs font-extrabold text-gray-400 tracking-wider">NOMOR PESANAN / INVOICE</p>
            <p className="text-lg sm:text-xl font-extrabold text-gray-900 mt-1">{ordNo}</p>
            <p className="text-sm font-semibold text-gray-500 mt-1">Tanggal terbit: {fmtDateLong(order.created_at)}</p>
          </div>
          <div className="sm:pt-1">
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-extrabold border ${payBadge}`}>{payStatus}</span>
          </div>
        </div>

        <div className="inv-mt-6 mt-5 sm:mt-6 border-t border-gray-200" />

        {/* Ditagihkan Kepada & Detail Pengerjaan */}
        <div className="inv-mt-6 mt-5 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 inv-gap-8 gap-6 sm:gap-8 avoid-break">
          <div>
            <p className="text-xs font-extrabold text-gray-400 tracking-wider mb-2 sm:mb-3">DITAGIHKAN KEPADA</p>
            <p className="text-base font-extrabold text-gray-900">{order.customer_name || '-'}</p>
            <p className="text-sm font-semibold text-gray-600 mt-1">{order.customer_wa || '-'}</p>
            <p className="text-sm font-semibold text-gray-600 mt-1 leading-relaxed">{order.alamat || '-'}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-extrabold text-gray-400 tracking-wider mb-2 sm:mb-3">DETAIL PENGERJAAN</p>
            <p className="text-base font-extrabold text-gray-900">{pengerjaan.date}</p>
            <p className="text-sm font-semibold text-gray-700 mt-1">Pukul {pengerjaan.time} WIB</p>
            <p className="text-sm font-semibold text-gray-600 mt-1">Durasi: {Number(order.estimasi_menit || 0)} menit</p>
          </div>
        </div>

        {/* Rincian Layanan */}
        <div className="inv-mt-8 mt-6 sm:mt-8">
          <p className="text-xs font-extrabold text-gray-400 tracking-wider mb-2 sm:mb-3">Rincian Layanan</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="py-2 sm:py-3 text-left font-extrabold tracking-wider text-xs">DESKRIPSI</th>
                <th className="py-2 sm:py-3 text-center font-extrabold tracking-wider text-xs w-20">QTY</th>
                <th className="py-2 sm:py-3 text-right font-extrabold tracking-wider text-xs w-40">HARGA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(order.items || []).length ? (order.items || []).map((it, idx) => (
                <tr key={it.id ?? idx} className="avoid-break">
                  <td className="py-2.5 sm:py-4 font-semibold text-gray-800">{it.service_name || '-'}</td>
                  <td className="py-2.5 sm:py-4 text-center font-semibold text-gray-700">{Number(it.qty || 0)}</td>
                  <td className="py-2.5 sm:py-4 text-right font-extrabold text-gray-900">{fmtRupiah(it.subtotal ?? (Number(it.harga_satuan || 0) * Number(it.qty || 0)))}</td>
                </tr>
              )) : (
                <tr><td colSpan={3} className="py-6 text-center text-gray-400 font-semibold">Tidak ada rincian layanan.</td></tr>
              )}
            </tbody>
          </table>

          <div className="inv-mt-6 mt-4 border-t border-gray-200 pt-3 sm:pt-4 space-y-1.5 sm:space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-gray-500">Subtotal</span>
              <span className="font-extrabold text-gray-800">{fmtRupiah(total)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-gray-500">Diskon</span>
              <span className="font-extrabold text-gray-800">Rp0</span>
            </div>
          </div>

          <div className="inv-mt-6 mt-4 rounded-2xl bg-gray-50 border border-gray-200 px-5 py-3 sm:py-4 flex items-center justify-between avoid-break">
            <span className="text-xs sm:text-sm font-extrabold tracking-wider text-gray-700">TOTAL TAGIHAN</span>
            <span className="text-xl sm:text-2xl font-extrabold text-gray-900">{fmtRupiah(total)}</span>
          </div>
        </div>

        <div className="inv-mt-10 mt-8 sm:mt-10 border-t border-gray-200 pt-5 sm:pt-6 text-center avoid-break">
          <p className="text-sm font-extrabold text-gray-800">Terima kasih telah memilih {setting?.business_name || 'BersihinKost'}!</p>
          <p className="text-xs font-semibold text-gray-400 mt-1">Invoice diterbitkan secara elektronik.</p>
        </div>
      </div>
    </div>
  )
}
