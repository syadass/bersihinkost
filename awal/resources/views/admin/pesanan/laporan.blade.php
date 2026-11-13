<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan Pemasukan {{ $periodeLabel }} - Bersihinkost</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        lavender: {50:'#f5f3ff',100:'#ede9fe',200:'#ddd6fe',300:'#c4b5fd',400:'#a78bfa',500:'#8b5cf6',600:'#7c3aed',700:'#6d28d9',800:'#5b21b6',900:'#4c1d95'},
                        peach: {50:'#fff1f2',100:'#ffe4e6',200:'#fecdd3',300:'#fda4af',400:'#fb7185',500:'#f43f5e',600:'#e11d48',700:'#be123c'},
                        base: '#F9F8FC'
                    },
                    fontFamily: { sans: ['Nunito','sans-serif'] },
                    boxShadow: { 'float': '0 20px 40px -15px rgba(124, 58, 237, 0.15)', 'card': '0 10px 30px -10px rgba(0, 0, 0, 0.05)' }
                }
            }
        }
    </script>
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body { font-family: 'Nunito', sans-serif; background: #F9F8FC; color: #2D3748; }
        @media print {
            body { background: #fff; }
            * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .no-print { display: none !important; }
            .laporan-sheet { box-shadow: none !important; border: none !important; border-radius: 0 !important; max-width: 100% !important; margin: 0 !important; }
            @page { margin: 12mm; }
        }
    </style>
</head>
<body class="min-h-screen py-6 px-4">
    <div class="laporan-sheet max-w-4xl mx-auto bg-white rounded-3xl shadow-card border border-lavender-50 overflow-hidden">
        <div id="laporanPdf">
        <!-- Isi laporan (tampil sama di layar & cetak) -->
        <div class="text-gray-900 px-6 sm:px-10 py-8 print:p-0">
            <!-- Header -->
            <div class="flex flex-col min-[480px]:flex-row justify-between min-[480px]:items-start gap-4">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-lavender-700 shrink-0">
                        <i class="fa-solid fa-broom text-xl"></i>
                    </div>
                    <div>
                        <p class="text-xl font-black text-gray-900">{{ $setting->business_name }}</p>
                        <p class="text-xs font-semibold text-gray-500">Laporan Rekapitulasi Pemasukan Jasa Kebersihan Kost</p>
                    </div>
                </div>
                <div class="text-left min-[480px]:text-right shrink-0">
                    <p class="text-sm font-extrabold text-gray-900">Periode: {{ $periodeLabel }}</p>
                    <p class="text-xs font-semibold text-gray-500">Dicetak pada: {{ now()->translatedFormat('d M Y') }}</p>
                </div>
            </div>
            <div class="mt-4 border-b border-gray-200"></div>

            <!-- Ringkasan -->
            <div class="flex flex-col sm:flex-row gap-3 sm:gap-6 mt-6 mb-8">
                <div class="rounded-2xl bg-gray-100/80 p-5" style="flex:1;background:#f3f4f6;border-radius:1rem;padding:1.25rem;">
                    <p class="text-[11px] font-bold text-gray-500">TOTAL PEMASUKAN</p>
                    <p class="text-lg font-black mt-1">Rp {{ number_format($totalPeriode, 0, ',', '.') }}</p>
                </div>
                <div class="rounded-2xl bg-gray-100/80 p-5" style="flex:1;background:#f3f4f6;border-radius:1rem;padding:1.25rem;">
                    <p class="text-[11px] font-bold text-gray-500">KAMAR SELESAI</p>
                    <p class="text-lg font-black mt-1">{{ $rows->count() }} Kamar</p>
                </div>
                <div class="rounded-2xl bg-gray-100/80 p-5" style="flex:1;background:#f3f4f6;border-radius:1rem;padding:1.25rem;">
                    <p class="text-[11px] font-bold text-gray-500">RATA-RATA PER HARI</p>
                    <p class="text-lg font-black mt-1">Rp {{ number_format($rataHarian, 0, ',', '.') }}</p>
                    <p class="text-[11px] font-semibold text-gray-400">÷ {{ $days }} hari</p>
                </div>
            </div>

            <!-- Rincian -->
            <p class="text-sm font-black tracking-wide mb-2">RINCIAN TRANSAKSI MASUK</p>
            <div class="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <table class="w-full text-sm border-collapse min-w-[560px]">
                <thead>
                    <tr class="text-gray-500 text-xs font-bold border-b border-gray-200">
                        <th class="px-4 py-3 text-left">ID & TANGGAL</th>
                        <th class="px-4 py-3 text-left">PEMESAN & ALAMAT</th>
                        <th class="px-4 py-3 text-left">LAYANAN</th>
                        <th class="px-4 py-3 text-right">NOMINAL</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($rows as $o)
                        <tr class="border-b border-gray-100">
                            <td class="px-4 py-4 align-top">
                                <span class="font-extrabold block whitespace-nowrap">ORD-{{ str_pad($o->id, 3, '0', STR_PAD_LEFT) }}</span>
                                <span class="text-xs text-gray-400">{{ $o->updated_at->translatedFormat('d M Y') }}</span>
                            </td>
                            <td class="px-4 py-4 align-top">
                                <span class="font-extrabold block">{{ $o->customer_name }}</span>
                                <span class="text-xs text-gray-500 block">{{ $o->alamat }}</span>
                            </td>
                            <td class="px-4 py-4 align-top text-gray-600 text-[13px]">{{ $o->items->map(fn ($it) => $it->service_name . ' (' . $it->qty . 'x)')->join(', ') }}</td>
                            <td class="px-4 py-4 text-right align-top font-extrabold whitespace-nowrap">Rp {{ number_format($o->total_harga, 0, ',', '.') }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="4" class="py-8 text-center font-bold text-gray-400">Belum ada pemasukan pada periode ini.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
            </div>

            <!-- Tanda tangan -->
            <div class="flex justify-end mt-12 text-sm">
                <div class="text-center">
                    <p class="text-gray-500">Pengelola Bersihinkost,</p>
                    <div class="h-20"></div>
                    <p class="font-extrabold border-t border-gray-800 pt-1 px-6">{{ $setting->operator_name }}</p>
                    <p class="text-xs text-gray-400">Solo Operator</p>
                </div>
            </div>
        </div>
        </div>

        <!-- Toolbar layar (tidak ikut tercetak) -->
        <div class="no-print px-6 sm:px-10 pb-7 flex flex-col sm:flex-row gap-3">
            <button onclick="window.print()" class="flex-1 py-3.5 rounded-2xl bg-lavender-600 text-white font-extrabold text-sm shadow-md hover:bg-lavender-700 transition-all flex items-center justify-center gap-2">
                <i class="fa-solid fa-print"></i> Cetak
            </button>
            <button onclick="window.close()" class="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-600 font-extrabold text-sm hover:bg-gray-200 transition-colors">
                Tutup
            </button>
        </div>
    </div>

    <script>
        @if(request('cetak'))
            window.addEventListener('load', () => window.print());
        @endif
    </script>
</body>
</html>
