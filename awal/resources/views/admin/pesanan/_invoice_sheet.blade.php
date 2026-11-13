@php($statusLabel = ['pending' => 'Menunggu ACC', 'rescheduled' => 'Pindah Tanggal', 'confirmed' => 'Terjadwal', 'completed' => 'Lunas / Selesai', 'cancelled' => 'Batal'])
<div class="bg-white overflow-hidden">
    <!-- Kop Invoice -->
    <div class="text-white px-6 sm:px-10 py-7 flex flex-wrap justify-between items-center gap-4" style="background-color: #7c3aed;">
        <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center border border-white/30">
                <i class="fa-solid fa-broom text-xl"></i>
            </div>
            <div>
                <p class="text-xl font-black tracking-tight">{{ $setting->business_name }}</p>
                <p class="text-xs font-semibold text-white/80">Jasa Pembersihan Kamar Kost · {{ $setting->operator_name }}</p>
            </div>
        </div>
        <div class="text-left sm:text-right">
            <p class="text-xs font-bold text-white/70 uppercase tracking-wider">Invoice</p>
            <p class="text-2xl font-black">#{{ $order->id }}</p>
            <p class="text-xs font-semibold text-white/80">{{ $order->created_at->translatedFormat('d F Y') }}</p>
        </div>
    </div>

    <div class="px-6 sm:px-10 py-7 space-y-6">
        <!-- Pemesan & Jadwal -->
        <div class="grid sm:grid-cols-2 gap-4 text-sm">
            <div class="bg-gray-50 rounded-2xl border border-gray-100 p-4">
                <p class="text-xs font-bold text-gray-400 mb-1">Ditagihkan Kepada</p>
                <p class="font-extrabold text-gray-800">{{ $order->customer_name }}</p>
                <p class="font-semibold text-gray-500 text-xs mt-1">{{ $order->alamat }}</p>
            </div>
            <div class="bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-1">
                <p class="text-xs font-bold text-gray-400">Status: <span class="text-gray-800 font-extrabold">{{ $statusLabel[$order->status] ?? $order->status }}</span></p>
                <p class="text-xs font-bold text-gray-400">Order masuk: <span class="text-gray-800">{{ $order->created_at->translatedFormat('d M Y, H:i') }}</span></p>
                <p class="text-xs font-bold text-gray-400">Pengerjaan ({{ $order->tanggal_fix ? 'fix' : 'usulan' }}): <span class="text-gray-800">{{ ($order->tanggal_fix ?? $order->tanggal_usulan)->translatedFormat('d M Y, H:i') }} WIB</span></p>
            </div>
        </div>

        <!-- Tabel Layanan -->
        <table class="w-full text-left text-sm">
            <thead>
                <tr class="text-gray-400 text-xs font-extrabold uppercase border-b-2 border-gray-100">
                    <th class="pb-3">Layanan</th>
                    <th class="pb-3 text-center">Qty</th>
                    <th class="pb-3 text-right">Harga Satuan</th>
                    <th class="pb-3 text-right">Subtotal</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 font-semibold text-gray-700">
                @foreach($order->items as $it)
                    <tr>
                        <td class="py-3 font-extrabold text-gray-800">{{ $it->service_name }}</td>
                        <td class="py-3 text-center">{{ $it->qty }}x</td>
                        <td class="py-3 text-right">Rp{{ number_format($it->harga_satuan, 0, ',', '.') }}</td>
                        <td class="py-3 text-right font-extrabold">Rp{{ number_format($it->subtotal, 0, ',', '.') }}</td>
                    </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr class="border-t-2 border-gray-200">
                    <td colspan="3" class="pt-4 text-right text-xs font-bold text-gray-400 uppercase">Total ({{ $order->estimasi_menit }} menit)</td>
                    <td class="pt-4 text-right text-2xl font-black text-lavender-600">Rp{{ number_format($order->total_harga, 0, ',', '.') }}</td>
                </tr>
            </tfoot>
        </table>

        @if($order->catatan_admin)
            <p class="text-xs font-semibold text-gray-500 italic">Catatan: "{{ $order->catatan_admin }}"</p>
        @endif

        <p class="text-center text-xs font-semibold text-gray-400 pt-2">Terima kasih telah menggunakan layanan Bersihinkost.</p>
    </div>
</div>
