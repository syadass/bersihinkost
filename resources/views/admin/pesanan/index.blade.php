@extends('layouts.admin')
@section('title', 'Kelola Pesanan - Bersihinkost')

@section('content')
<!-- Header -->
<header class="flex flex-col gap-3 mb-5 sm:mb-6 pt-2">
    <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">Kelola Pesanan Masuk</h1>
        <p class="text-xs sm:text-sm font-bold text-lavender-500">Daftar booking pembersihan kamar kost dari pemesan</p>
    </div>

    <div class="flex flex-col min-[480px]:flex-row min-[480px]:items-center gap-2 sm:gap-3">
        <!-- Search Bar -->
        <form method="GET" action="{{ route('admin.pesanan.index') }}" class="relative flex-1 min-w-0">
            <input type="hidden" name="tab" value="{{ $tab }}">
            <input type="hidden" name="sort" value="{{ $sort ?? request('sort', 'terbaru') }}">
            <input type="hidden" name="bulan" value="{{ request('bulan') }}">
            <input type="hidden" name="tahun" value="{{ request('tahun') }}">
            <span class="absolute inset-y-0 left-0 flex items-center pl-5 text-gray-400">
                <i class="fa-solid fa-magnifying-glass"></i>
            </span>
            <input type="text" name="search" value="{{ request('search') }}" id="searchOrderInput" placeholder="Cari nama atau alamat..." class="w-full pl-12 pr-4 py-3 sm:py-3.5 rounded-3xl bg-white border-none shadow-card text-sm font-bold text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lavender-400 transition-all">
        </form>

        <div class="flex items-center gap-2 shrink-0">
            <button type="button" onclick="openManualModal()" class="flex-1 min-[480px]:flex-none px-4 py-3 rounded-3xl bg-peach-500 text-white font-extrabold text-xs shadow-md hover:bg-peach-600 transition-all flex items-center justify-center gap-2 whitespace-nowrap" title="Buat jadwal manual">
                <i class="fa-solid fa-plus text-[10px]"></i> Buat Manual
            </button>

            @if($tab === 'selesai')
                <button type="button" onclick="printLaporan(this)" data-url="{{ route('admin.pesanan.laporan', array_filter(['search' => request('search'), 'bulan' => request('bulan'), 'tahun' => request('tahun')])) }}" class="flex-1 min-[480px]:flex-none px-4 py-3 rounded-3xl bg-emerald-500 text-white font-extrabold text-xs shadow-md hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-70" title="Cetak laporan pemasukan">
                    <i class="fa-solid fa-print text-[10px]"></i> Cetak
                </button>
            @endif

            <!-- Owner Profile -->
            <div class="hidden min-[480px]:flex items-center gap-3 bg-white pl-3 pr-5 py-2 rounded-full shadow-card border border-lavender-100 shrink-0">
                <div class="w-10 h-10 rounded-full bg-peach-100 text-peach-600 flex items-center justify-center font-extrabold border-2 border-white shadow-sm">
                    {{ strtoupper(substr(auth()->user()->name, 0, 1)) }}{{ strtoupper(substr(explode(' ', auth()->user()->name)[1] ?? '', 0, 1)) }}
                </div>
                <div class="hidden lg:block">
                    <p class="text-sm font-extrabold text-gray-800 leading-tight">{{ auth()->user()->name }}</p>
                    <p class="text-[10px] font-extrabold text-peach-500 uppercase tracking-wider">Solo Operator</p>
                </div>
            </div>
        </div>
    </div>
</header>

@php
$tabs = [
    'all' => ['icon' => 'fa-layer-group', 'color' => '', 'label' => 'Semua'],
    'menunggu-acc' => ['icon' => 'fa-clock', 'color' => 'text-amber-500', 'label' => 'Menunggu ACC'],
    'terjadwal' => ['icon' => 'fa-calendar-check', 'color' => 'text-lavender-500', 'label' => 'Menunggu Eksekusi'],
    'selesai' => ['icon' => 'fa-circle-check', 'color' => 'text-emerald-500', 'label' => 'Selesai'],
    'batal' => ['icon' => 'fa-ban', 'color' => 'text-red-500', 'label' => 'Batal'],
];
$activeCls = "px-5 py-2.5 rounded-full bg-lavender-600 text-white font-bold text-sm shadow-md flex items-center gap-2 whitespace-nowrap transition-transform hover:scale-105";
$idleCls = "px-5 py-2.5 rounded-full bg-white text-gray-600 font-bold text-sm shadow-card hover:bg-lavender-50 hover:text-lavender-600 transition-all flex items-center gap-2 whitespace-nowrap";
$miniBadge = [
    'pending' => 'bg-amber-100 text-amber-700',
    'rescheduled' => 'bg-blue-100 text-blue-700',
    'confirmed' => 'bg-lavender-100 text-lavender-700',
    'completed' => 'bg-emerald-100 text-emerald-700',
    'cancelled' => 'bg-red-100 text-red-500',
];
$miniLabel = ['pending' => 'Menunggu ACC', 'rescheduled' => 'Pindah Tanggal', 'confirmed' => 'Terjadwal', 'completed' => 'Selesai', 'cancelled' => 'Batal'];
@endphp

<div class="flex flex-col gap-2 mb-4 sm:mb-5">
<!-- Status Filter Tabs -->
<div class="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0 flex-1 min-w-0" id="statusFilterContainer">
    @foreach($tabs as $key => $t)
        <a href="{{ route('admin.pesanan.index', array_filter(['tab' => $key !== 'all' ? $key : null, 'search' => request('search'), 'sort' => ($sort ?? request('sort')) !== 'terbaru' ? ($sort ?? request('sort')) : null, 'bulan' => request('bulan'), 'tahun' => request('tahun')])) }}" class="{{ $tab === $key ? $activeCls : $idleCls }}">
            <i class="fa-solid {{ $t['icon'] }} text-xs {{ $tab === $key ? '' : $t['color'] }}"></i> {{ $t['label'] }} (<span>{{ $counts[$key] ?? 0 }}</span>)
        </a>
    @endforeach
</div>
<!-- Filter Bulan & Tahun Pengerjaan -->
<form method="GET" action="{{ route('admin.pesanan.index') }}" class="shrink-0 flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
    <input type="hidden" name="tab" value="{{ $tab }}">
    <input type="hidden" name="search" value="{{ request('search') }}">
    <input type="hidden" name="sort" value="{{ $sort ?? request('sort', 'terbaru') }}">
    <select name="bulan" onchange="this.form.submit()" title="Filter bulan pengerjaan" class="flex-1 sm:flex-none px-4 py-2.5 rounded-full bg-white border-none shadow-card text-xs sm:text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400 cursor-pointer">
        <option value="all" {{ $fBulan === 'all' ? 'selected' : '' }}>Semua bulan</option>
        @foreach(range(1, 12) as $m)
            <option value="{{ $m }}" {{ $fBulan == $m ? 'selected' : '' }}>{{ \Carbon\Carbon::create(null, $m, 1)->translatedFormat('F') }}</option>
        @endforeach
    </select>
    <select name="tahun" onchange="this.form.submit()" title="Filter tahun pengerjaan" class="flex-1 sm:flex-none px-4 py-2.5 rounded-full bg-white border-none shadow-card text-xs sm:text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400 cursor-pointer">
        <option value="all" {{ $fTahun === 'all' ? 'selected' : '' }}>Semua tahun</option>
        @foreach($fYears as $y)
            <option value="{{ $y }}" {{ $fTahun == $y ? 'selected' : '' }}>{{ $y }}</option>
        @endforeach
    </select>
</form>
</div>

<!-- Orders Table / List Container -->
<div class="flex-1 overflow-y-auto pb-6 sm:pr-2 min-h-0">
    <!-- Tampilan kartu khusus HP (< md): mudah dibaca tanpa scroll horizontal -->
    <div class="grid gap-3 md:hidden">
        @forelse($orders as $order)
            <a href="{{ route('admin.pesanan.show', [$order, 'from' => url()->full()]) }}" class="block bg-white rounded-2xl shadow-card border border-lavender-50 p-4 active:scale-[0.99] transition-transform">
                <div class="flex items-start justify-between gap-2 mb-1.5">
                    <div class="min-w-0">
                        <p class="text-sm font-extrabold text-gray-800 truncate">#{{ $order->id }} • {{ $order->customer_name }}</p>
                        <p class="text-[11px] font-semibold text-gray-400 truncate">{{ $order->alamat }}</p>
                    </div>
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold whitespace-nowrap shrink-0 {{ $miniBadge[$order->status] ?? 'bg-gray-100 text-gray-500' }}">{{ $miniLabel[$order->status] ?? $order->status }}</span>
                </div>
                <p class="text-[11px] font-semibold text-gray-500 truncate mb-2">{{ $order->items->map(fn($i) => $i->service_name.' ('.$i->qty.'x)')->join(', ') }}</p>
                <div class="flex items-center justify-between pt-2 border-t border-dashed border-gray-100">
                    <span class="text-[11px] font-bold text-gray-400"><i class="fa-regular fa-clock mr-1"></i>{{ ($order->tanggal_fix ?? $order->tanggal_usulan)->format('d M Y, H:i') }}</span>
                    <span class="text-sm font-extrabold text-gray-800">Rp{{ number_format($order->total_harga, 0, ',', '.') }}</span>
                </div>
            </a>
        @empty
            <div class="flex flex-col items-center justify-center text-center py-14 bg-white rounded-2xl shadow-card border border-lavender-50">
                <div class="w-16 h-16 rounded-full bg-lavender-50 text-lavender-300 flex items-center justify-center text-2xl mb-3 border-2 border-dashed border-lavender-200">
                    <i class="fa-solid fa-inbox"></i>
                </div>
                <p class="text-sm font-extrabold text-gray-700">Tidak ada pesanan ditemukan</p>
                <p class="text-[11px] font-medium text-gray-400 mt-1">Pesanan baru dari pemesan kost akan muncul di sini</p>
            </div>
        @endforelse
    </div>
    <div class="hidden md:block bg-white rounded-3xl shadow-card border border-lavender-50 overflow-hidden">
        <div class="table-scroll">
            <table class="w-full text-left border-collapse">
                @php
                    $curSort = $sort ?? request('sort', 'terbaru');
                    $sortLink = function ($asc, $desc) use ($curSort, $tab) {
                        $next = $curSort === $asc ? $desc : $asc;
                        return route('admin.pesanan.index', array_filter([
                            'tab' => $tab !== 'all' ? $tab : null,
                            'search' => request('search'),
                            'sort' => $next !== 'terbaru' ? $next : null,
                            'bulan' => request('bulan'),
                            'tahun' => request('tahun'),
                        ]));
                    };
                    $arrow = function ($asc, $desc) use ($curSort) {
                        if ($curSort === $asc) return '<i class="fa-solid fa-arrow-up text-[10px] ml-1"></i>';
                        if ($curSort === $desc) return '<i class="fa-solid fa-arrow-down text-[10px] ml-1"></i>';
                        return '<i class="fa-solid fa-sort text-[10px] ml-1 opacity-40"></i>';
                    };
                @endphp
                <thead>
                    <tr class="border-b border-gray-100 bg-lavender-50/50 text-gray-500 text-xs font-extrabold uppercase tracking-wider">
                        <th class="py-4 px-6"><a href="{{ $sortLink('id_asc', 'id_desc') }}" class="inline-flex items-center hover:text-lavender-600" title="Urutkan ID">ID {!! $arrow('id_asc', 'id_desc') !!}</a></th>
                        <th class="py-4 px-6"><a href="{{ $sortLink('nama_asc', 'nama_desc') }}" class="inline-flex items-center hover:text-lavender-600" title="Urutkan nama">Pemesan {!! $arrow('nama_asc', 'nama_desc') !!}</a></th>
                        <th class="py-4 px-6">Layanan</th>
                        <th class="py-4 px-6"><a href="{{ $sortLink('fix_asc', 'fix_desc') }}" class="inline-flex items-center hover:text-lavender-600" title="Urutkan tanggal pengerjaan (fix)">Jadwal {!! $arrow('fix_asc', 'fix_desc') !!}</a></th>
                        <th class="py-4 px-6">Tarif</th>
                        <th class="py-4 px-6">Status</th>
                        <th class="py-4 px-6 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody id="ordersTableBody" class="divide-y divide-gray-100 text-sm font-semibold text-gray-700">
                    @foreach($orders as $order)
                        <tr class="hover:bg-lavender-50/30 transition-colors">
                            <td class="py-4 px-6">
                                <span class="font-extrabold text-gray-800 block whitespace-nowrap">#{{ $order->id }}</span>
                            </td>
                            <td class="py-4 px-6 max-w-[220px]">
                                <span class="font-extrabold text-gray-800 block">{{ $order->customer_name }}</span>
                                <span class="text-xs font-medium text-gray-400 block truncate" title="{{ $order->alamat }}">{{ $order->alamat }}</span>
                            </td>
                            <td class="py-4 px-6 font-medium text-gray-600 max-w-[220px]" title="{{ $order->items->map(fn($i) => $i->service_name.' ('.$i->qty.'x)')->join(', ') }}">
                                {{ Str::limit($order->items->map(fn($i) => $i->service_name.' ('.$i->qty.'x)')->join(', '), 50) }}
                            </td>
                            <td class="py-4 px-6 whitespace-nowrap">
                                <span class="text-sm font-extrabold text-gray-800 block">{{ ($order->tanggal_fix ?? $order->tanggal_usulan)->format('d M Y') }}</span>
                                <span class="text-[11px] font-bold text-gray-400 block"><i class="fa-regular fa-clock mr-1"></i>{{ ($order->tanggal_fix ?? $order->tanggal_usulan)->format('H:i') }} WIB</span>
                            </td>
                            <td class="py-4 px-6 font-extrabold text-gray-800 whitespace-nowrap">
                                Rp{{ number_format($order->total_harga, 0, ',', '.') }}
                            </td>
                            <td class="py-4 px-6 whitespace-nowrap">
                                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold {{ $miniBadge[$order->status] ?? 'bg-gray-100 text-gray-500' }}">{{ $miniLabel[$order->status] ?? $order->status }}</span>
                            </td>
                            <td class="py-4 px-6">
                                <div class="flex items-center justify-center gap-1.5">
                                    {{-- 1 tombol utama sesuai status --}}
                                    @if(in_array($order->status, ['pending', 'rescheduled']))
                                        <form action="{{ route('admin.pesanan.acc', $order) }}" method="POST" title="ACC (fix: {{ ($order->tanggal_fix ?? $order->tanggal_usulan)->format('d M Y, H:i') }})">
                                            @csrf @method('PATCH')
                                            <input type="hidden" name="tanggal_fix" value="{{ ($order->tanggal_fix ?? $order->tanggal_usulan)->format('Y-m-d') }}">
                                            <input type="hidden" name="jam_fix" value="{{ ($order->tanggal_fix ?? $order->tanggal_usulan)->format('H:i') }}">
                                            <button class="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors shadow-sm" title="ACC Pesanan">
                                                <i class="fa-solid fa-check text-xs"></i>
                                            </button>
                                        </form>
                                    @elseif($order->status === 'confirmed')
                                        <form action="{{ route('admin.pesanan.selesai', $order) }}" method="POST" data-confirm="Order #{{ $order->id }} akan ditandai selesai dan masuk kas." data-confirm-title="Tandai Selesai?" data-confirm-ok="Ya, Selesaikan" data-confirm-tone="emerald" data-confirm-icon="fa-check-double" title="Tandai Selesai">
                                            @csrf @method('PATCH')
                                            <button class="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors shadow-sm" title="Selesaikan Pesanan">
                                                <i class="fa-solid fa-check-double text-xs"></i>
                                            </button>
                                        </form>
                                    @else
                                        <a href="{{ route('admin.pesanan.show', [$order, 'from' => url()->full()]) }}" title="Detail" class="w-8 h-8 rounded-xl bg-lavender-600 text-white flex items-center justify-center hover:bg-lavender-700 transition-colors shadow-sm">
                                            <i class="fa-solid fa-eye text-xs"></i>
                                        </a>
                                    @endif
                                    {{-- 1 menu titik tiga (⋮) untuk aksi lain --}}
                                    <div>
                                        <button onclick="toggleRowMenu({{ $order->id }}, event)" title="Aksi lain" class="w-8 h-8 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors">
                                            <i class="fa-solid fa-ellipsis-vertical text-xs"></i>
                                        </button>
                                        <div id="rowMenu-{{ $order->id }}" class="hidden w-56 bg-white rounded-2xl shadow-float border border-lavender-100 p-2 z-50">
                                            <a href="{{ route('admin.pesanan.show', [$order, 'from' => url()->full()]) }}" class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-lavender-50 hover:text-lavender-600">
                                                <i class="fa-solid fa-eye w-4 text-center"></i> Detail Pesanan
                                            </a>
                                            @if(!in_array($order->status, ['completed', 'cancelled']))
                                                <a href="{{ route('admin.pesanan.edit', $order) }}" class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-lavender-50 hover:text-lavender-600">
                                                    <i class="fa-solid fa-pen-to-square w-4 text-center"></i> Ubah Pesanan
                                                </a>
                                                <form action="{{ route('admin.pesanan.cancel', $order) }}" method="POST" data-confirm="Order #{{ $order->id }} akan ditolak/dibatalkan. Pastikan alasan sudah diisi." data-confirm-title="Tolak Pesanan?" data-confirm-ok="Ya, Tolak" data-confirm-tone="red" data-confirm-icon="fa-ban" class="mt-1 pt-2 border-t border-dashed border-gray-200">
                                                    @csrf @method('PATCH')
                                                    <input type="text" name="alasan_batal" required placeholder="Alasan tolak..." class="w-full text-[11px] font-bold bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-red-300 mb-1.5">
                                                    <button class="w-full py-2 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 flex items-center justify-center gap-1.5">
                                                        <i class="fa-solid fa-xmark"></i> Tolak Pesanan
                                                    </button>
                                                </form>
                                            @endif
                                            @if(in_array($order->status, ['cancelled', 'completed']))
                                                <form action="{{ route('admin.pesanan.destroy', $order) }}" method="POST" data-confirm="Riwayat pesanan #{{ $order->id }} akan dihapus permanen." data-confirm-title="Hapus Pesanan?" data-confirm-ok="Ya, Hapus" data-confirm-tone="red" data-confirm-icon="fa-trash-can" class="mt-1 pt-2 border-t border-dashed border-gray-200">
                                                    @csrf @method('DELETE')
                                                    <button class="w-full py-2 rounded-xl bg-red-50 text-red-500 text-xs font-bold hover:bg-red-100 flex items-center justify-center gap-1.5">
                                                        <i class="fa-solid fa-trash-can"></i> Hapus Pesanan
                                                    </button>
                                                </form>
                                            @endif
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <!-- Empty State -->
        <div id="emptyOrders" class="{{ $orders->isEmpty() ? 'flex' : 'hidden' }} flex-col items-center justify-center text-center py-16">
            <div class="w-20 h-20 rounded-full bg-lavender-50 text-lavender-300 flex items-center justify-center text-3xl mb-3 border-2 border-dashed border-lavender-200">
                <i class="fa-solid fa-inbox"></i>
            </div>
            <p class="text-base font-extrabold text-gray-700">Tidak ada pesanan ditemukan</p>
            <p class="text-xs font-medium text-gray-400 mt-1">Pesanan baru dari pemesan kost akan muncul di sini</p>
        </div>
    </div>

    <div class="mt-4 flex flex-col min-[480px]:flex-row min-[480px]:items-center gap-2 min-[480px]:justify-between">
        <p class="text-xs font-bold text-gray-400 text-center min-[480px]:text-left">
            Menampilkan {{ $orders->firstItem() ?? 0 }}–{{ $orders->lastItem() ?? 0 }} dari {{ $orders->total() }} pesanan
        </p>
        <div class="flex items-center justify-center gap-2">
            {{-- Prev: pucat jika tidak ada data sebelumnya, bold/nyala jika ada --}}
            @if($orders->onFirstPage())
                <span class="px-4 py-2 rounded-full bg-white text-gray-300 font-extrabold text-xs shadow-card cursor-not-allowed select-none">‹ Prev</span>
            @else
                <a href="{{ $orders->previousPageUrl() }}" class="px-4 py-2 rounded-full bg-white text-lavender-600 font-extrabold text-xs shadow-card hover:bg-lavender-600 hover:text-white transition-all">‹ Prev</a>
            @endif
            {{-- Hanya angka halaman yang sedang dibuka --}}
            <span class="min-w-[2.5rem] text-center px-4 py-2 rounded-full bg-lavender-600 text-white font-extrabold text-xs shadow-md select-none">{{ $orders->currentPage() }}</span>
            {{-- Next: bold/nyala jika ada data setelahnya, pucat jika tidak --}}
            @if($orders->hasMorePages())
                <a href="{{ $orders->nextPageUrl() }}" class="px-4 py-2 rounded-full bg-white text-lavender-600 font-extrabold text-xs shadow-card hover:bg-lavender-600 hover:text-white transition-all">Next ›</a>
            @else
                <span class="px-4 py-2 rounded-full bg-white text-gray-300 font-extrabold text-xs shadow-card cursor-not-allowed select-none">Next ›</span>
            @endif
        </div>
    </div>
</div>

<!-- Modal Buat Jadwal Manual -->
<div id="manualModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 hidden items-center justify-center p-3 sm:p-4 overflow-y-auto">
    <div class="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-float w-full max-w-2xl border border-lavender-50 relative my-auto max-h-[92vh] flex flex-col overflow-hidden">
        <div class="flex justify-between items-center gap-3 p-5 border-b border-gray-100 shrink-0">
            <div>
                <h3 class="text-lg font-extrabold text-gray-800">Buat Jadwal Manual</h3>
                <p class="text-xs font-semibold text-gray-400">Order walk-in / telepon — langsung tercatat <span class="text-emerald-500 font-extrabold">Confirmed</span></p>
            </div>
            <button type="button" onclick="closeManualModal()" class="w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 shrink-0">
                <i class="fa-solid fa-xmark text-sm"></i>
            </button>
        </div>
        <form method="POST" action="{{ route('admin.pesanan.manual') }}" class="overflow-y-auto p-5 space-y-4">
            @csrf
            <div class="grid sm:grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs font-extrabold text-gray-600 mb-1">Nama Pemesan <span class="text-peach-500">*</span></label>
                    <input type="text" name="customer_name" value="{{ old('customer_name') }}" required class="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-peach-400">
                </div>
                <div>
                    <label class="block text-xs font-extrabold text-gray-600 mb-1">Tanggal & Jam Pengerjaan (fix) <span class="text-peach-500">*</span></label>
                    <div class="grid grid-cols-2 gap-2">
                        <input type="date" name="tanggal_fix" value="{{ old('tanggal_fix', date('Y-m-d')) }}" required class="min-w-0 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-peach-400">
                        <input type="time" name="jam_fix" min="{{ $setting->jam_mulai }}" max="{{ $setting->jam_selesai }}" value="{{ old('jam_fix', '09:00') }}" required class="min-w-0 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-peach-400">
                    </div>
                </div>
            </div>
            <div>
                <label class="block text-xs font-extrabold text-gray-600 mb-1">Alamat Kost / Kamar <span class="text-peach-500">*</span></label>
                <textarea name="alamat" rows="2" required class="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-peach-400">{{ old('alamat') }}</textarea>
            </div>
            <div>
                <label class="block text-xs font-extrabold text-gray-600 mb-2">Item Layanan</label>
                <div id="manualItemRows" class="space-y-2"></div>
                <button type="button" onclick="addManualRow()" class="mt-2 px-4 py-2 rounded-full bg-peach-50 text-peach-600 text-xs font-extrabold hover:bg-peach-100 transition-colors">+ Tambah Item</button>
            </div>
            <div class="grid grid-cols-2 gap-2 pt-1">
                <button type="button" onclick="closeManualModal()" class="py-3 rounded-2xl bg-gray-100 text-gray-600 font-extrabold text-sm hover:bg-gray-200 transition-colors">Batal</button>
                <button class="py-3 rounded-2xl bg-peach-500 text-white font-extrabold text-sm shadow-md hover:bg-peach-600 transition-all">Simpan Jadwal</button>
            </div>
        </form>
    </div>
</div>
@endsection

@push('scripts')
<script>
    // Dropdown "..." per baris: diposisikan fixed agar tidak terpotong scroll tabel
    function closeRowMenus() {
        document.querySelectorAll('[id^="rowMenu-"]').forEach(m => m.classList.add('hidden'));
    }
    function toggleRowMenu(id, e) {
        e.stopPropagation();
        const menu = document.getElementById('rowMenu-' + id);
        const wasHidden = menu.classList.contains('hidden');
        closeRowMenus();
        if (!wasHidden) return;
        const r = e.currentTarget.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.classList.remove('hidden');
        const h = menu.offsetHeight;
        let top = r.bottom + 4;
        if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 4);
        menu.style.top = top + 'px';
        menu.style.left = Math.max(8, r.right - 224) + 'px';
        menu.addEventListener('click', ev => ev.stopPropagation());
    }
    document.addEventListener('click', closeRowMenus);
    document.addEventListener('scroll', closeRowMenus, true);
    window.addEventListener('resize', closeRowMenus);

    // Modal Buat Jadwal Manual
    const manualServices = @json($servicesJson);
    const manualExisting = @json(old('items', [['service_id' => '', 'qty' => 1]]));
    const manualModal = document.getElementById('manualModal');
    function openManualModal() {
        manualModal.classList.remove('hidden');
        manualModal.classList.add('flex');
    }
    function closeManualModal() {
        manualModal.classList.add('hidden');
        manualModal.classList.remove('flex');
    }
    function addManualRow(sid = '', qty = 1) {
        const div = document.createElement('div');
        div.className = 'flex flex-col min-[420px]:flex-row gap-2';
        div.innerHTML = `<select name="items[][service_id]" required class="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-peach-400">${manualServices.map(s => `<option value="${s.id}" ${s.id == sid ? 'selected' : ''}>${s.name} - Rp${s.price.toLocaleString('id-ID')}</option>`).join('')}</select>
        <div class="flex gap-2">
        <input type="number" name="items[][qty]" value="${qty}" min="1" max="20" required class="flex-1 min-[420px]:w-20 min-[420px]:flex-none px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-peach-400">
        <button type="button" onclick="this.parentElement.parentElement.remove()" class="px-4 min-[420px]:px-3 rounded-xl bg-red-50 text-red-500 font-bold hover:bg-red-100" title="Hapus item">×</button>
        </div>`;
        document.getElementById('manualItemRows').appendChild(div);
    }
    (manualExisting.length ? manualExisting : [{ service_id: manualServices[0]?.id ?? '', qty: 1 }]).forEach(e => addManualRow(e.service_id, e.qty));
    manualModal?.addEventListener('click', e => { if (e.target === manualModal) closeManualModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && manualModal && !manualModal.classList.contains('hidden')) closeManualModal(); });
    @if(collect(['customer_name', 'alamat'])->intersect($errors->keys())->isNotEmpty())
        openManualModal();
    @endif

    // Cetak laporan: ambil isi laporan formal lalu langsung buka dialog print, tanpa buka tab baru
    async function printLaporan(btn) {
        const url = btn.dataset.url;
        const original = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-[10px]"></i> Menyiapkan...';
        try {
            const res = await fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const html = await res.text();
            const src = new DOMParser().parseFromString(html, 'text/html').getElementById('laporanPdf');
            if (!src) throw new Error('empty');
            document.getElementById('printRoot').innerHTML = src.innerHTML;
            document.body.classList.add('printing');
            window.print();
        } catch (e) {
            alert('Gagal menyiapkan laporan. Silakan coba lagi.');
        } finally {
            btn.disabled = false;
            btn.innerHTML = original;
        }
    }
    window.addEventListener('afterprint', () => {
        document.body.classList.remove('printing');
        const pr = document.getElementById('printRoot');
        if (pr) pr.innerHTML = '';
    });
</script>
@endpush
