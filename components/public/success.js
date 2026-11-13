'use client'

export default function PublicSuccess({ order, setting, orderId }) {
  const id = Number.isNaN(Number(orderId)) ? '-' : Number(orderId)
  const tgl = order?.tanggal_usulan
    ? new Date(order.tanggal_usulan).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '-'

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-3xl shadow-float p-5 sm:p-8 max-w-lg w-full text-center border border-lavender-100">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
          <i className="fa-solid fa-circle-check"></i>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-800 mb-1">Pesanan #{id} Terkirim!</h1>
        <p className="text-sm font-bold text-amber-500 mb-4"><i className="fa-solid fa-hourglass-half mr-1"></i> Status: Menunggu Konfirmasi (ACC) Admin</p>
        {order ? (
          <div className="bg-gray-50 rounded-2xl p-4 text-left text-sm font-semibold text-gray-600 space-y-1 mb-4">
            <p><span className="font-extrabold">Nama:</span> {order.customer_name}</p>
            {order.customer_wa ? <p><span className="font-extrabold">WhatsApp:</span> {order.customer_wa}</p> : null}
            <p><span className="font-extrabold">Alamat:</span> {order.alamat}</p>
            <p><span className="font-extrabold">Tanggal Usulan:</span> {tgl} WIB</p>
            <p><span className="font-extrabold">Total:</span> Rp{Number(order.total_harga).toLocaleString('id-ID')} ({order.estimasi_menit} mnt)</p>
          </div>
        ) : null}
        <p className="text-xs text-gray-500 font-bold mb-4">Pesanan Anda sudah masuk ke sistem. Admin akan meninjau dan menghubungi Anda melalui WhatsApp untuk konfirmasi (ACC), penolakan, atau pengajuan perubahan jadwal.</p>
        <a href="/" className="block w-full py-3 rounded-2xl bg-lavender-50 text-lavender-600 font-extrabold text-sm hover:bg-lavender-100 transition-all">Kembali ke Beranda</a>
      </div>
    </div>
  )
}
