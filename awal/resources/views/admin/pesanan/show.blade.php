@extends('layouts.admin')
@section('title', "Order #{$order->id} - Bersihinkost")

@section('content')
@php($fromParam = request('from') ? '?from=' . urlencode(request('from')) : '')
<div class="h-full overflow-y-auto pr-1 sm:pr-2 pb-6">
    <div class="max-w-4xl mx-auto">
        <!-- Header & Back Button -->
        <header class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pt-2 gap-3">
            <div class="flex items-center gap-3 sm:gap-4">
                <a href="{{ $backUrl }}" class="w-11 h-11 rounded-2xl bg-white text-lavender-600 shadow-card flex items-center justify-center hover:bg-lavender-50 transition-colors border border-lavender-100 shrink-0">
                    <i class="fa-solid fa-arrow-left text-sm"></i>
                </a>
                <div>
                    <div class="flex items-center gap-3 flex-wrap">
                        <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">#{{ $order->id }}</h1>
                        @php($badge = ['pending' => 'bg-amber-100 text-amber-700 border-amber-200', 'rescheduled' => 'bg-blue-100 text-blue-700 border-blue-200', 'confirmed' => 'bg-lavender-100 text-lavender-700 border-lavender-200', 'completed' => 'bg-emerald-100 text-emerald-700 border-emerald-200', 'cancelled' => 'bg-red-100 text-red-500 border-red-200'])
                        @php($label = ['pending' => 'Menunggu ACC', 'rescheduled' => 'Pindah Tanggal', 'confirmed' => 'Terjadwal', 'completed' => 'Selesai', 'cancelled' => 'Batal'])
                        <span class="px-3 py-1 rounded-full text-xs font-extrabold border {{ $badge[$order->status] ?? 'bg-gray-100 text-gray-500 border-gray-200' }}">{{ $label[$order->status] ?? $order->status }}</span>
                    </div>
                    <p class="text-sm font-bold text-lavender-500">Detail pesanan, alamat, jadwal booking, dan aksi pengerjaan</p>
                </div>
            </div>

            <div class="flex items-center gap-2 sm:gap-3">
                <button onclick="printInvoice()" class="px-4 sm:px-5 py-3 rounded-2xl bg-white text-lavender-600 border border-lavender-200 font-extrabold text-xs shadow-card hover:bg-lavender-50 transition-all flex items-center gap-2">
                    <i class="fa-solid fa-print text-sm"></i> Print Invoice
                </button>
                <button onclick="downloadPdf()" class="px-4 sm:px-5 py-3 rounded-2xl bg-peach-500 text-white font-extrabold text-xs shadow-md hover:bg-peach-600 transition-all flex items-center gap-2">
                    <i class="fa-solid fa-file-arrow-down text-sm"></i> Unduh PDF
                </button>
            </div>
        </header>

        <!-- Single Comprehensive Card Layout -->
        <div class="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-card border border-lavender-50 p-5 sm:p-8 space-y-6">

            <!-- Section 1: Informasi Pemesan & Alamat -->
            <div>
                <h3 class="text-base font-extrabold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                    <i class="fa-solid fa-user-tag text-lavender-500"></i> Informasi Pemesan & Alamat Tujuan
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <span class="text-xs font-bold text-gray-400 block mb-1">Nama Lengkap</span>
                        <span class="font-extrabold text-gray-800 text-base">{{ $order->customer_name }}</span>
                    </div>
                    <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <span class="text-xs font-bold text-gray-400 block mb-1">Nomor Pesanan</span>
                        <span class="font-extrabold text-gray-800 text-base">#{{ $order->id }}</span>
                    </div>
                    <div class="sm:col-span-2 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <span class="text-xs font-bold text-gray-400 block mb-1">Alamat / Detail Lokasi Kost</span>
                        <span class="font-extrabold text-peach-600 text-base block">{{ $order->alamat }}</span>
                    </div>
                </div>
            </div>

            <!-- Section 2: Jadwal & Waktu -->
            <div>
                <h3 class="text-base font-extrabold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                    <i class="fa-solid fa-calendar-days text-lavender-500"></i> Jadwal & Waktu
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div class="bg-lavender-50/50 p-4 rounded-2xl border border-lavender-100">
                        <span class="text-xs font-bold text-lavender-600 block mb-1"><i class="fa-solid fa-clock mr-1"></i> Tanggal Order Masuk</span>
                        <span class="font-extrabold text-gray-800 text-base">{{ $order->created_at->translatedFormat('d F Y, H:i') }} WIB</span>
                    </div>
                    <div class="bg-peach-50/50 p-4 rounded-2xl border border-peach-100">
                        <span class="text-xs font-bold text-peach-600 block mb-1"><i class="fa-solid fa-calendar-check mr-1"></i> Tanggal Booking Pengerjaan {{ $order->tanggal_fix ? '(Fix)' : '(Usulan)' }}</span>
                        <span class="font-extrabold text-gray-800 text-base">{{ ($order->tanggal_fix ?? $order->tanggal_usulan)->translatedFormat('d F Y, H:i') }} WIB</span>
                    </div>
                </div>
                <div class="mt-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <span class="text-xs font-bold text-gray-400 block mb-1">Catatan Tambahan:</span>
                    @if($order->catatan_admin)
                        <p class="text-xs font-semibold text-gray-700 italic">"{{ $order->catatan_admin }}"</p>
                    @else
                        <p class="text-xs font-semibold text-gray-400 italic">Tidak ada catatan tambahan.</p>
                    @endif
                </div>
                @if($order->alasan_batal)
                    <div class="mt-3 bg-red-50 p-4 rounded-2xl border border-red-100">
                        <span class="text-xs font-extrabold text-red-500 block mb-1"><i class="fa-solid fa-ban mr-1"></i> Alasan Batal:</span>
                        <p class="text-xs font-semibold text-red-600">{{ $order->alasan_batal }}</p>
                    </div>
                @endif
            </div>

            <!-- Section 3: Rincian Layanan & Total -->
            <div>
                <h3 class="text-base font-extrabold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                    <i class="fa-solid fa-basket-shopping text-lavender-500"></i> Rincian Layanan & Estimasi Durasi
                </h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm">
                        <thead>
                            <tr class="text-gray-400 text-xs font-extrabold uppercase border-b border-gray-100">
                                <th class="pb-3">Jenis Layanan</th>
                                <th class="pb-3 text-center">Estimasi Durasi</th>
                                <th class="pb-3 text-center">Jumlah</th>
                                <th class="pb-3 text-right">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 font-semibold text-gray-700">
                            @foreach($order->items as $it)
                                <tr>
                                    <td class="py-3 font-extrabold text-gray-800">{{ $it->service_name }}</td>
                                    <td class="py-3 text-center text-gray-500">{{ $it->service ? ($it->service->duration_minutes * $it->qty) . ' Menit' : '-' }}</td>
                                    <td class="py-3 text-center text-gray-800 font-extrabold">{{ $it->qty }}x</td>
                                    <td class="py-3 text-right font-extrabold text-peach-500">Rp{{ number_format($it->subtotal, 0, ',', '.') }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>

                <div class="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <span class="text-xs font-bold text-gray-400 block">Total Estimasi Pengerjaan:</span>
                        <span class="text-sm font-extrabold text-lavender-600">{{ $order->estimasi_menit }} Menit</span>
                    </div>
                    <div class="sm:text-right">
                        <span class="text-xs font-bold text-gray-400 block">Total Biaya:</span>
                        <span class="text-2xl font-extrabold text-peach-500">Rp{{ number_format($order->total_harga, 0, ',', '.') }}</span>
                    </div>
                </div>
            </div>

            <!-- Section 4: Aksi Pengelola -->
            @if(!in_array($order->status, ['cancelled', 'completed']))
                <div class="pt-4 border-t-2 border-dashed border-lavender-100">
                    <h3 class="text-base font-extrabold text-gray-800 mb-1 flex items-center gap-2">
                        <i class="fa-solid fa-sliders text-lavender-500"></i> Kontrol Aksi Pengelola
                    </h3>
                    <p class="text-xs font-semibold text-gray-400 mb-4">Ubah status pengerjaan atau kelola pesanan ini secara mandiri:</p>

                    <div class="grid sm:grid-cols-2 gap-4">
                        <form action="{{ route('admin.pesanan.acc', $order) }}{{ $fromParam }}" method="POST" class="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2" data-confirm="Pesanan #{{ $order->id }} akan di-ACC dengan tanggal fix yang dipilih." data-confirm-title="ACC Pesanan?" data-confirm-ok="Ya, ACC" data-confirm-tone="emerald" data-confirm-icon="fa-check">
                            @csrf @method('PATCH')
                            <label class="text-xs font-extrabold text-emerald-600">ACC — tanggal & jam fix pengerjaan</label>
                            <div class="grid grid-cols-2 gap-2">
                                <input type="date" name="tanggal_fix" value="{{ ($order->tanggal_fix ?? $order->tanggal_usulan)->format('Y-m-d') }}" class="min-w-0 px-3 py-2.5 rounded-xl bg-white border border-emerald-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300">
                                <input type="time" name="jam_fix" min="{{ $setting->jam_mulai }}" max="{{ $setting->jam_selesai }}" value="{{ ($order->tanggal_fix ?? $order->tanggal_usulan)->format('H:i') }}" class="min-w-0 px-3 py-2.5 rounded-xl bg-white border border-emerald-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300">
                            </div>
                            <p class="text-[11px] font-bold text-gray-400">Jam kerja {{ $setting->jam_mulai }}–{{ $setting->jam_selesai }} WIB · tanggal libur ditolak</p>
                            <button class="w-full py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-extrabold hover:bg-emerald-600 transition-all"><i class="fa-solid fa-check mr-1"></i> ACC Pesanan</button>
                        </form>
                        <form action="{{ route('admin.pesanan.reschedule', $order) }}{{ $fromParam }}" method="POST" class="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2" data-confirm="Tanggal pengerjaan pesanan #{{ $order->id }} akan dipindah ke tanggal baru." data-confirm-title="Pindah Tanggal?" data-confirm-ok="Ya, Simpan" data-confirm-tone="blue" data-confirm-icon="fa-calendar-days">
                            @csrf @method('PATCH')
                            <label class="text-xs font-extrabold text-blue-600">Pindah tanggal & jam pengerjaan</label>
                            <div class="grid grid-cols-2 gap-2">
                                <input type="date" name="tanggal_fix" value="{{ ($order->tanggal_fix ?? $order->tanggal_usulan)->format('Y-m-d') }}" class="min-w-0 px-3 py-2.5 rounded-xl bg-white border border-blue-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300">
                                <input type="time" name="jam_fix" min="{{ $setting->jam_mulai }}" max="{{ $setting->jam_selesai }}" value="{{ ($order->tanggal_fix ?? $order->tanggal_usulan)->format('H:i') }}" class="min-w-0 px-3 py-2.5 rounded-xl bg-white border border-blue-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300">
                            </div>
                            <p class="text-[11px] font-bold text-gray-400">Jam kerja {{ $setting->jam_mulai }}–{{ $setting->jam_selesai }} WIB · tanggal libur ditolak</p>
                            <button class="w-full py-2.5 rounded-xl bg-blue-500 text-white text-sm font-extrabold hover:bg-blue-600 transition-all"><i class="fa-solid fa-calendar-days mr-1"></i> Simpan Tanggal Baru</button>
                        </form>
                        <form action="{{ route('admin.pesanan.cancel', $order) }}{{ $fromParam }}" method="POST" class="p-4 rounded-2xl bg-red-50/60 border border-red-100 space-y-2" data-confirm="Pesanan #{{ $order->id }} akan dibatalkan. Pastikan alasan sudah diisi dengan benar." data-confirm-title="Batalkan Pesanan?" data-confirm-ok="Ya, Batalkan" data-confirm-tone="red" data-confirm-icon="fa-ban">
                            @csrf @method('PATCH')
                            <label class="text-xs font-extrabold text-red-500">Batalkan + alasan (wajib)</label>
                            <input type="text" name="alasan_batal" required placeholder="cth: pemesan mundur, tanggal bentrok" class="w-full px-4 py-2.5 rounded-xl bg-white border border-red-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-300">
                            <button class="w-full py-2.5 rounded-xl bg-red-500 text-white text-sm font-extrabold hover:bg-red-600 transition-all"><i class="fa-solid fa-xmark mr-1"></i> Batalkan Pesanan</button>
                        </form>
                        <div class="p-4 rounded-2xl bg-lavender-50/60 border border-lavender-100 space-y-2">
                            <label class="text-xs font-extrabold text-lavender-600">Selesaikan / ubah data</label>
                            <button type="button" onclick="openEditModal()" class="w-full py-2.5 rounded-xl bg-white border border-lavender-200 text-lavender-600 text-sm font-extrabold hover:bg-lavender-50 transition-all"><i class="fa-solid fa-pen-to-square mr-1"></i> Ubah Pesanan</button>
                            <form action="{{ route('admin.pesanan.selesai', $order) }}{{ $fromParam }}" method="POST" data-confirm="Pesanan #{{ $order->id }} akan ditandai selesai dan masuk ke kas." data-confirm-title="Tandai Selesai?" data-confirm-ok="Ya, Selesaikan" data-confirm-tone="lavender" data-confirm-icon="fa-check-double">
                                @csrf @method('PATCH')
                                <button class="w-full py-2.5 rounded-xl bg-lavender-600 text-white text-sm font-extrabold hover:bg-lavender-700 transition-all"><i class="fa-solid fa-check-double mr-1"></i> Tandai Selesai</button>
                            </form>
                        </div>
                    </div>
                </div>
            @else
                <div class="pt-4 border-t-2 border-dashed border-lavender-100">
                    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div class="flex-1 {{ $order->status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-500 border-red-100' }} p-3.5 rounded-2xl text-center font-extrabold text-xs border flex items-center justify-center gap-2">
                            <i class="fa-solid {{ $order->status === 'completed' ? 'fa-circle-check' : 'fa-ban' }} text-base"></i>
                            {{ $order->status === 'completed' ? 'Pengerjaan Telah Selesai' : 'Pesanan Telah Dibatalkan' }}
                        </div>
                        @if($order->status === 'cancelled')
                            <form action="{{ route('admin.pesanan.destroy', $order) }}{{ $fromParam }}" method="POST" data-confirm="Riwayat pesanan #{{ $order->id }} akan dihapus permanen dan tidak bisa dikembalikan." data-confirm-title="Hapus Pesanan?" data-confirm-ok="Ya, Hapus" data-confirm-tone="red" data-confirm-icon="fa-trash-can">
                                @csrf @method('DELETE')
                                <button class="py-3.5 px-6 rounded-2xl bg-red-50 text-red-500 font-extrabold text-xs hover:bg-red-100 transition-colors flex items-center justify-center gap-2 whitespace-nowrap">
                                    <i class="fa-solid fa-trash-can"></i> Hapus
                                </button>
                            </form>
                        @endif
                    </div>
                </div>
            @endif

        </div>
    </div>
</div>

<!-- Invoice tersembunyi: sumber cetak & PDF -->
<div id="invoicePdf" class="hidden">
    @include('admin.pesanan._invoice_sheet')
</div>
<p id="dlStatus" class="hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] px-5 py-3 rounded-2xl bg-gray-800 text-white text-xs font-extrabold shadow-float">Menyiapkan PDF, mohon tunggu...</p>

<!-- Modal Ubah Pesanan -->
<div id="editModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 hidden items-center justify-center p-3 sm:p-4 overflow-y-auto">
    <div class="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-float w-full max-w-2xl border border-lavender-50 relative my-auto max-h-[92vh] flex flex-col overflow-hidden">
        <div class="flex justify-between items-center gap-3 p-5 border-b border-gray-100 shrink-0">
            <div>
                <h3 class="text-lg font-extrabold text-gray-800">Ubah Pesanan #{{ $order->id }}</h3>
                <p class="text-xs font-semibold text-gray-400">Perbarui data pemesan, jadwal, dan layanan</p>
            </div>
            <button type="button" onclick="closeEditModal()" class="w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 shrink-0">
                <i class="fa-solid fa-xmark text-sm"></i>
            </button>
        </div>
        <form method="POST" action="{{ route('admin.pesanan.update', $order) }}" class="overflow-y-auto p-5 space-y-4">
            @csrf @method('PUT')
            @if(request('from'))
                <input type="hidden" name="from" value="{{ request('from') }}">
            @endif
            <div class="grid sm:grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs font-extrabold text-gray-600 mb-1">Nama Pemesan</label>
                    <input type="text" name="customer_name" value="{{ old('customer_name', $order->customer_name) }}" required class="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                </div>
                <div>
                    <label class="block text-xs font-extrabold text-gray-600 mb-1">Tanggal & Jam Usulan</label>
                    <div class="grid grid-cols-2 gap-2">
                        <input type="date" name="tanggal_usulan" value="{{ old('tanggal_usulan', $order->tanggal_usulan->format('Y-m-d')) }}" required class="min-w-0 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                        <input type="time" name="jam_usulan" min="{{ $setting->jam_mulai }}" max="{{ $setting->jam_selesai }}" value="{{ old('jam_usulan', $order->tanggal_usulan->format('H:i')) }}" required class="min-w-0 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                    </div>
                </div>
            </div>
            <div>
                <label class="block text-xs font-extrabold text-gray-600 mb-1">Alamat Kost / Kamar</label>
                <textarea name="alamat" rows="2" required class="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">{{ old('alamat', $order->alamat) }}</textarea>
            </div>
            <div>
                <label class="block text-xs font-extrabold text-gray-600 mb-1">Catatan Admin</label>
                <input type="text" name="catatan_admin" value="{{ old('catatan_admin', $order->catatan_admin) }}" placeholder="Keterangan tambahan (opsional)" class="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
            </div>
            <div>
                <label class="block text-xs font-extrabold text-gray-600 mb-2">Item Layanan</label>
                <div id="editItemRows" class="space-y-2"></div>
                <button type="button" onclick="addEditRow()" class="mt-2 px-4 py-2 rounded-full bg-lavender-50 text-lavender-600 text-xs font-extrabold hover:bg-lavender-100 transition-colors">+ Tambah Item</button>
            </div>
            <div class="grid grid-cols-2 gap-2 pt-1">
                <button type="button" onclick="closeEditModal()" class="py-3 rounded-2xl bg-gray-100 text-gray-600 font-extrabold text-sm hover:bg-gray-200 transition-colors">Batal</button>
                <button class="py-3 rounded-2xl bg-lavender-600 text-white font-extrabold text-sm shadow-md hover:bg-lavender-700 transition-all">Simpan Perubahan</button>
            </div>
        </form>
    </div>
</div>
@endsection

@push('scripts')
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
<script>
    // Cetak: langsung buka dialog print Windows, tanpa modal pratinjau
    function printInvoice() {
        document.getElementById('printRoot').innerHTML = document.getElementById('invoicePdf').innerHTML;
        document.body.classList.add('printing');
        window.print();
    }
    window.addEventListener('afterprint', () => {
        document.body.classList.remove('printing');
        document.getElementById('printRoot').innerHTML = '';
    });

    // Unduh: langsung unduh file PDF tanpa buka halaman baru
    function downloadPdf() {
        const status = document.getElementById('dlStatus');
        status.classList.remove('hidden');
        const opt = {
            margin: 10,
            filename: 'invoice-#{{ $order->id }}-bersihinkost.pdf',
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(document.getElementById('invoicePdf')).save()
            .then(() => status.classList.add('hidden'))
            .catch(() => {
                status.innerText = 'Gagal membuat PDF otomatis. Gunakan tombol Print lalu pilih "Save as PDF".';
                setTimeout(() => { status.classList.add('hidden'); }, 4000);
            });
    }

    // Modal Ubah Pesanan
    const editServices = @json($servicesJson);
    const editExisting = @json(old('items', $existingJson));
    const editModal = document.getElementById('editModal');
    function openEditModal() {
        editModal.classList.remove('hidden');
        editModal.classList.add('flex');
    }
    function closeEditModal() {
        editModal.classList.add('hidden');
        editModal.classList.remove('flex');
    }
    function addEditRow(sid = '', qty = 1) {
        const div = document.createElement('div');
        div.className = 'flex flex-col min-[420px]:flex-row gap-2';
        div.innerHTML = `<select name="items[][service_id]" required class="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">${editServices.map(s => `<option value="${s.id}" ${s.id == sid ? 'selected' : ''}>${s.name} - Rp${s.price.toLocaleString('id-ID')}</option>`).join('')}</select>
        <div class="flex gap-2">
        <input type="number" name="items[][qty]" value="${qty}" min="1" max="20" required class="flex-1 min-[420px]:w-20 min-[420px]:flex-none px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
        <button type="button" onclick="this.parentElement.parentElement.remove()" class="px-4 min-[420px]:px-3 rounded-xl bg-red-50 text-red-500 font-bold hover:bg-red-100" title="Hapus item">×</button>
        </div>`;
        document.getElementById('editItemRows').appendChild(div);
    }
    (editExisting.length ? editExisting : [{ service_id: editServices[0]?.id ?? '', qty: 1 }]).forEach(e => addEditRow(e.service_id, e.qty));
    editModal?.addEventListener('click', e => { if (e.target === editModal) closeEditModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !editModal.classList.contains('hidden')) closeEditModal(); });
    @if(collect(['customer_name', 'alamat', 'tanggal_usulan', 'jam_usulan', 'catatan_admin', 'items'])->intersect($errors->keys())->isNotEmpty())
        openEditModal();
    @endif
</script>
@endpush
