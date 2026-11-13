@extends('layouts.admin')
@section('title', 'Bersihinkost Dashboard')

@section('content')
<!-- Header & Solo Owner Profile -->
<header class="flex flex-col sm:flex-row sm:items-center justify-between mb-5 pt-2 shrink-0 gap-3">
    <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">Bersihinkost Dashboard</h1>
        <p class="text-sm font-bold text-lavender-500">{{ now()->translatedFormat('l, d M Y') }}</p>
    </div>

    <div class="flex items-center gap-3 sm:gap-4">
        <!-- Search Bar -->
        <div class="relative flex-1 sm:flex-none sm:w-64 md:w-72">
            <span class="absolute inset-y-0 left-0 flex items-center pl-5 text-gray-400">
                <i class="fa-solid fa-magnifying-glass"></i>
            </span>
            <input type="text" id="searchInput" placeholder="Cari nama atau alamat..." class="w-full pl-12 pr-4 py-3.5 rounded-3xl bg-white border-none shadow-card text-sm font-bold text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lavender-400 transition-all">
        </div>

        <!-- Owner Profile (Solo) -->
        <div class="hidden sm:flex items-center gap-3 bg-white pl-3 pr-5 py-2 rounded-full shadow-card cursor-pointer hover:bg-lavender-50 transition-colors border border-lavender-100 shrink-0">
            <div class="w-10 h-10 rounded-full bg-peach-100 text-peach-600 flex items-center justify-center font-extrabold border-2 border-white shadow-sm">
                {{ strtoupper(substr(auth()->user()->name, 0, 1)) }}{{ strtoupper(substr(explode(' ', auth()->user()->name)[1] ?? '', 0, 1)) }}
            </div>
            <div>
                <p class="text-sm font-extrabold text-gray-800 leading-tight">{{ auth()->user()->name }}</p>
                <p class="text-[10px] font-extrabold text-peach-500 uppercase tracking-wider">Solo Operator</p>
            </div>
        </div>
    </div>
</header>

<!-- Scrollable Dashboard Body -->
<div class="flex-1 overflow-y-auto pb-6 pr-1 sm:pr-2 min-h-0 space-y-5">

    <!-- 1. Stat Cards -->
    <div class="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <!-- Pendapatan Bulan Ini -->
        <div class="bg-gradient-to-br from-peach-400 to-peach-500 rounded-3xl shadow-card p-4 sm:p-5 text-white relative overflow-hidden">
            <div class="absolute -right-6 -top-6 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
            <div class="flex items-center gap-2 mb-1.5">
                <span class="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><i class="fa-solid fa-wallet text-sm"></i></span>
                <h3 class="text-[11px] sm:text-xs font-bold text-white/85 leading-tight">Pendapatan Bulan Ini</h3>
            </div>
            <p class="text-lg sm:text-2xl font-extrabold truncate">Rp{{ number_format($kasBulanIni, 0, ',', '.') }}</p>
            <p class="text-[11px] sm:text-xs font-semibold text-white/90 mt-1"><i class="fa-solid fa-circle-check mr-1"></i>{{ $selesaiBulanIni }} kamar selesai</p>
        </div>
        <!-- Total Pesanan Bulan Ini -->
        <div class="bg-white rounded-3xl shadow-card p-4 sm:p-5 border border-lavender-50">
            <div class="flex items-center gap-2 mb-1.5">
                <span class="w-8 h-8 rounded-xl bg-lavender-50 text-lavender-600 flex items-center justify-center shrink-0"><i class="fa-solid fa-clipboard-list text-sm"></i></span>
                <h3 class="text-[11px] sm:text-xs font-bold text-gray-500 leading-tight">Total Pesanan Bulan Ini</h3>
            </div>
            <p class="text-lg sm:text-2xl font-extrabold text-gray-800">{{ $totalPesananBulanIni }} <span class="text-xs font-bold text-gray-400">pesanan</span></p>
            <p class="text-[11px] sm:text-xs font-semibold text-gray-400 mt-1">{{ now()->translatedFormat('F Y') }}</p>
        </div>
        <!-- Menunggu Persetujuan -->
        <a href="{{ route('admin.pesanan.index', ['tab' => 'menunggu-acc']) }}" class="bg-white rounded-3xl shadow-card p-4 sm:p-5 border border-amber-100 hover:shadow-lg transition-shadow">
            <div class="flex items-center gap-2 mb-1.5">
                <span class="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0"><i class="fa-solid fa-clock text-sm"></i></span>
                <h3 class="text-[11px] sm:text-xs font-bold text-gray-500 leading-tight">Menunggu Persetujuan</h3>
            </div>
            <p class="text-lg sm:text-2xl font-extrabold text-gray-800">{{ $pendingCount }} <span class="text-xs font-bold text-gray-400">order</span></p>
            <p class="text-[11px] sm:text-xs font-bold text-amber-600 mt-1">Rp{{ number_format($pendingTotal, 0, ',', '.') }} →</p>
        </a>
        <!-- Jadwal Hari Ini -->
        <a href="#kalender" class="bg-white rounded-3xl shadow-card p-4 sm:p-5 border border-lavender-50 hover:shadow-lg transition-shadow">
            <div class="flex items-center gap-2 mb-1.5">
                <span class="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><i class="fa-solid fa-calendar-day text-sm"></i></span>
                <h3 class="text-[11px] sm:text-xs font-bold text-gray-500 leading-tight">Jadwal Hari Ini</h3>
            </div>
            <p class="text-lg sm:text-2xl font-extrabold text-gray-800">{{ $jadwalHariIni }} <span class="text-xs font-bold text-gray-400">jadwal</span></p>
            <p class="text-[11px] sm:text-xs font-semibold text-gray-400 mt-1">{{ now()->translatedFormat('d M Y') }}</p>
        </a>
    </div>

    <!-- 2. Charts -->
    <div class="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-5">
        <!-- Line: Tren Pemesan Bulanan -->
        <div class="xl:col-span-3 bg-white rounded-3xl shadow-card p-4 sm:p-5 border border-lavender-50 min-w-0">
            <div class="flex flex-wrap justify-between items-center gap-2 mb-3">
                <h3 class="text-sm font-extrabold text-gray-800">Tren Pemesan Bulanan</h3>
                <form method="GET" action="{{ route('admin.dashboard') }}" class="flex items-center gap-2">
                    <input type="hidden" name="bulan" value="{{ $month->format('Y-m') }}">
                    <input type="hidden" name="pie_bulan" value="{{ $pieBulan }}">
                    <input type="hidden" name="pie_tahun" value="{{ $pieTahun }}">
                    <select name="g_bulan" onchange="this.form.submit()" class="px-3 py-2 rounded-full bg-gray-50 border border-gray-200 text-xs font-extrabold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400 cursor-pointer">
                        @foreach(range(1, 12) as $m)
                            <option value="{{ $m }}" {{ $chartBulan == $m ? 'selected' : '' }}>{{ \Carbon\Carbon::create(null, $m, 1)->translatedFormat('F') }}</option>
                        @endforeach
                    </select>
                    <select name="g_tahun" onchange="this.form.submit()" class="px-3 py-2 rounded-full bg-gray-50 border border-gray-200 text-xs font-extrabold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400 cursor-pointer">
                        @foreach($years as $y)
                            <option value="{{ $y }}" {{ $chartTahun == $y ? 'selected' : '' }}>{{ $y }}</option>
                        @endforeach
                    </select>
                </form>
            </div>
            <div class="h-52 sm:h-60 w-full">
                <canvas id="trendChart"></canvas>
            </div>
            <p class="text-[11px] font-semibold text-gray-400 mt-2">Jumlah order masuk per hari · {{ \Carbon\Carbon::create($chartTahun, $chartBulan, 1)->translatedFormat('F Y') }}</p>
            <div class="grid grid-cols-3 gap-2 sm:gap-3 mt-3">
                <div class="rounded-2xl bg-emerald-50/70 border border-emerald-100 px-3 py-2.5 flex items-center gap-2.5 min-w-0">
                    <span class="w-8 h-8 rounded-xl bg-emerald-500 text-white hidden sm:flex items-center justify-center shrink-0"><i class="fa-solid fa-wallet text-xs"></i></span>
                    <div class="min-w-0">
                        <p class="text-[10px] font-bold text-emerald-600 leading-tight">Total Penghasilan</p>
                        <p class="text-[13px] sm:text-sm font-extrabold text-gray-800 truncate">Rp{{ number_format($trendTotalPenghasilan, 0, ',', '.') }}</p>
                    </div>
                </div>
                <div class="rounded-2xl bg-lavender-50/70 border border-lavender-100 px-3 py-2.5 flex items-center gap-2.5 min-w-0">
                    <span class="w-8 h-8 rounded-xl bg-lavender-600 text-white hidden sm:flex items-center justify-center shrink-0"><i class="fa-solid fa-clipboard-list text-xs"></i></span>
                    <div class="min-w-0">
                        <p class="text-[10px] font-bold text-lavender-500 leading-tight">Total Pesanan</p>
                        <p class="text-[13px] sm:text-sm font-extrabold text-gray-800 truncate">{{ $trendTotalPesanan }} <span class="text-[10px] font-bold text-gray-400">pesanan</span></p>
                    </div>
                </div>
                <div class="rounded-2xl bg-peach-50/70 border border-peach-100 px-3 py-2.5 flex items-center gap-2.5 min-w-0">
                    <span class="w-8 h-8 rounded-xl bg-peach-500 text-white hidden sm:flex items-center justify-center shrink-0"><i class="fa-solid fa-calendar-day text-xs"></i></span>
                    <div class="min-w-0">
                        <p class="text-[10px] font-bold text-peach-600 leading-tight">Rata-rata / Hari</p>
                        <p class="text-[13px] sm:text-sm font-extrabold text-gray-800 truncate">Rp{{ number_format($trendRataHarian, 0, ',', '.') }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Pie: Perbandingan Jenis Layanan -->
        <div class="xl:col-span-2 bg-white rounded-3xl shadow-card p-4 sm:p-5 border border-lavender-50 min-w-0 flex flex-col">
            <div class="flex items-center justify-between gap-2 mb-3 shrink-0">
                <h3 class="text-[13px] sm:text-sm font-extrabold text-gray-800 whitespace-nowrap shrink-0">Perbandingan Layanan</h3>
                <form method="GET" action="{{ route('admin.dashboard') }}" class="flex items-center gap-1.5 min-w-0">
                    <input type="hidden" name="bulan" value="{{ $month->format('Y-m') }}">
                    <input type="hidden" name="g_bulan" value="{{ $chartBulan }}">
                    <input type="hidden" name="g_tahun" value="{{ $chartTahun }}">
                    <select name="pie_bulan" onchange="this.form.submit()" class="min-w-0 px-2 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-[11px] font-extrabold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400 cursor-pointer">
                        <option value="all" {{ $pieBulan === 'all' ? 'selected' : '' }}>Semua</option>
                        @foreach(range(1, 12) as $m)
                            <option value="{{ $m }}" {{ $pieBulan == $m ? 'selected' : '' }}>{{ \Carbon\Carbon::create(null, $m, 1)->translatedFormat('F') }}</option>
                        @endforeach
                    </select>
                    <select name="pie_tahun" onchange="this.form.submit()" class="px-2 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-[11px] font-extrabold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400 cursor-pointer">
                        @foreach($years as $y)
                            <option value="{{ $y }}" {{ $pieTahun == $y ? 'selected' : '' }}>{{ $y }}</option>
                        @endforeach
                    </select>
                </form>
            </div>
            @if($pieTotal > 0)
                <div class="h-40 sm:h-44 w-full flex justify-center shrink-0">
                    <canvas id="pieChart"></canvas>
                </div>
                <ul class="mt-2 flex-1 grid grid-cols-2 gap-x-3 content-evenly overflow-y-auto pr-1">
                    @foreach($pieData as $p)
                        <li class="flex items-center gap-2 text-xs font-bold text-gray-600">
                            <span class="w-3 h-3 rounded-full shrink-0" style="background: {{ $p['color'] }}"></span>
                            <span class="flex-1 truncate" title="{{ $p['label'] }}">{{ $p['label'] }}</span>
                        </li>
                    @endforeach
                </ul>
            @else
                <div class="h-44 flex flex-col items-center justify-center text-center text-gray-400">
                    <i class="fa-solid fa-chart-pie text-3xl mb-2 text-lavender-200"></i>
                    <p class="text-xs font-bold">Belum ada data pesanan pada periode ini</p>
                </div>
            @endif
        </div>
    </div>

    <!-- 3. Kalender Jadwal Orderan -->
    <div id="kalender" class="bg-white rounded-3xl shadow-card border border-lavender-50 p-4 sm:p-5 scroll-mt-4">
        <div class="flex flex-wrap justify-between items-center gap-3 mb-4">
            <h3 class="font-extrabold text-gray-800 text-sm sm:text-base">Kalender Jadwal</h3>
            <div class="flex items-center gap-2">
                <a href="{{ route('admin.dashboard', array_merge(request()->except('bulan'), ['bulan' => $month->copy()->subMonth()->format('Y-m')])) }}" class="w-9 h-9 rounded-full bg-lavender-50 text-lavender-600 flex items-center justify-center hover:bg-lavender-100"><i class="fa-solid fa-chevron-left text-xs"></i></a>
                <div class="relative">
                    <button id="monthJumpBtn" class="px-4 py-2 rounded-full bg-lavender-600 text-white text-xs font-extrabold hover:bg-lavender-700 flex items-center gap-2 shadow">
                        {{ $month->translatedFormat('F Y') }} <i class="fa-solid fa-caret-down text-[10px]"></i>
                    </button>
                    <div id="monthJump" class="hidden absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-float border border-lavender-100 p-4 z-30">
                        <div class="flex items-center justify-between mb-3">
                            <button id="jumpPrevYear" class="w-8 h-8 rounded-full bg-lavender-50 text-lavender-600 flex items-center justify-center hover:bg-lavender-100"><i class="fa-solid fa-chevron-left text-[10px]"></i></button>
                            <span id="jumpYearLabel" class="text-sm font-extrabold text-gray-800"></span>
                            <button id="jumpNextYear" class="w-8 h-8 rounded-full bg-lavender-50 text-lavender-600 flex items-center justify-center hover:bg-lavender-100"><i class="fa-solid fa-chevron-right text-[10px]"></i></button>
                        </div>
                        <div id="jumpMonthGrid" class="grid grid-cols-3 gap-2"></div>
                        <button id="jumpToday" class="w-full mt-3 py-2 rounded-xl bg-lavender-50 text-lavender-600 text-xs font-extrabold hover:bg-lavender-100">Kembali ke bulan ini</button>
                    </div>
                </div>
                <a href="{{ route('admin.dashboard', array_merge(request()->except('bulan'), ['bulan' => $month->copy()->addMonth()->format('Y-m')])) }}" class="w-9 h-9 rounded-full bg-lavender-50 text-lavender-600 flex items-center justify-center hover:bg-lavender-100"><i class="fa-solid fa-chevron-right text-xs"></i></a>
            </div>
        </div>
        <div class="flex flex-wrap gap-3 mb-4 text-[11px] font-extrabold">
            @foreach(['pending' => 'Menunggu ACC', 'confirmed' => 'Confirmed', 'rescheduled' => 'Reschedule', 'completed' => 'Selesai', 'cancelled' => 'Batal'] as $k => $v)
                @php($dot = ['pending' => 'bg-amber-400', 'confirmed' => 'bg-emerald-400', 'rescheduled' => 'bg-blue-400', 'completed' => 'bg-lavender-400', 'cancelled' => 'bg-red-400'][$k])
                <span class="flex items-center gap-1.5 text-gray-500"><span class="w-2.5 h-2.5 rounded-full {{ $dot }}"></span>{{ $v }}</span>
            @endforeach
        </div>
        <div class="grid grid-cols-7 gap-1 sm:gap-2">
            @foreach(['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'] as $dname)
                <div class="text-center text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-lavender-400 pb-1">{{ $dname }}</div>
            @endforeach
            @foreach($weeks as $week)
                @foreach($week as $day)
                    @php($chip = ['pending' => 'bg-amber-100 text-amber-700', 'confirmed' => 'bg-emerald-100 text-emerald-600', 'rescheduled' => 'bg-blue-100 text-blue-600', 'completed' => 'bg-lavender-100 text-lavender-600', 'cancelled' => 'bg-red-100 text-red-400 line-through'])
                    <div class="rounded-xl sm:rounded-2xl border p-1 sm:p-2 min-h-[64px] sm:min-h-[92px] {{ $day['isToday'] ? 'border-lavender-400 ring-2 ring-lavender-200 bg-lavender-50/50' : 'border-gray-100 bg-gray-50/50' }} {{ $day['inMonth'] ? '' : 'opacity-40' }}">
                        <p class="text-[11px] sm:text-xs font-extrabold {{ $day['isToday'] ? 'text-lavender-600' : 'text-gray-500' }} mb-1">{{ $day['date']->format('d') }}</p>
                        <div class="space-y-1 hidden sm:block">
                            @foreach($day['orders']->take(3) as $o)
                                <a href="{{ route('admin.pesanan.show', [$o, 'from' => url()->full()]) }}" title="#{{ $o->id }} • {{ $o->customer_name }} • {{ ($o->tanggal_fix ?? $o->tanggal_usulan)->format('d M Y, H:i') }} • Rp{{ number_format($o->total_harga, 0, ',', '.') }}" class="block truncate text-[10px] font-extrabold px-2 py-0.5 rounded-full {{ $chip[$o->status] ?? 'bg-gray-100 text-gray-500' }}">{{ $o->customer_name }}</a>
                            @endforeach
                            @if($day['orders']->count() > 3)
                                <p class="text-[10px] font-bold text-gray-400 pl-2">+{{ $day['orders']->count() - 3 }} lagi</p>
                            @endif
                        </div>
                        @if($day['orders']->isNotEmpty())
                            <div class="sm:hidden flex gap-0.5 flex-wrap">
                                @foreach($day['orders']->take(4) as $o)
                                    @php($dotc = ['pending' => 'bg-amber-400', 'confirmed' => 'bg-emerald-400', 'rescheduled' => 'bg-blue-400', 'completed' => 'bg-lavender-400', 'cancelled' => 'bg-red-400'][$o->status] ?? 'bg-gray-300')
                                    <span class="w-1.5 h-1.5 rounded-full {{ $dotc }}"></span>
                                @endforeach
                            </div>
                        @endif
                    </div>
                @endforeach
            @endforeach
        </div>
    </div>
</div>
@endsection

@section('rightpanel')
<!-- Right Panel: Jadwal & Order Masuk (butuh ACC) -->
<aside class="w-full xl:w-[380px] shrink-0 bg-white rounded-[2rem] xl:rounded-[2.5rem] shadow-float flex flex-col z-10 overflow-hidden border border-lavender-50 lg:max-h-full">

    <!-- Header Panel -->
    <div class="px-6 sm:px-7 pt-6 sm:pt-7 pb-4 bg-white">
        <div class="flex justify-between items-center mb-2">
            <h2 class="text-xl sm:text-2xl font-extrabold text-gray-800"> Pesanan Masuk</h2>
            <a href="{{ route('admin.pesanan.index', ['tab' => 'menunggu-acc']) }}" class="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center hover:bg-amber-200 transition-colors font-extrabold text-sm" title="Lihat semua menunggu ACC">{{ $pendingCount }}</a>
        </div>
        <div class="flex flex-wrap gap-2">
            <span class="bg-amber-100 text-amber-600 text-xs font-bold px-3 py-1 rounded-full">{{ $pendingCount }} Menunggu ACC</span>
            <span class="bg-peach-100 text-peach-600 text-xs font-bold px-3 py-1 rounded-full">Rp{{ number_format($pendingTotal, 0, ',', '.') }}</span>
        </div>
    </div>

    <!-- Pending Order List -->
    <div id="pendingList" class="xl:flex-1 xl:overflow-y-auto xl:min-h-0 max-h-[60vh] xl:max-h-none overflow-y-auto px-4 sm:px-5 py-2 space-y-3 sm:space-y-4">
        @forelse($pendingOrders as $o)
            <div class="bg-white p-3 rounded-2xl shadow-sm border border-amber-100">
                <div class="flex justify-between items-start gap-2">
                    <div class="min-w-0">
                        <h4 class="text-sm font-extrabold text-gray-800 leading-tight">#{{ $o->id }} • {{ $o->customer_name }}</h4>
                        <p class="text-[11px] font-bold text-gray-400 mt-0.5 truncate">{{ $o->alamat }}</p>
                        <p class="text-[11px] font-bold text-gray-400"><i class="fa-regular fa-calendar mr-1"></i>Usulan: {{ $o->tanggal_usulan->format('d M Y, H:i') }}</p>
                        <p class="text-[11px] font-semibold text-gray-400 truncate">{{ $o->items->map(fn($i) => $i->service_name.' ('.$i->qty.'x)')->join(', ') }}</p>
                    </div>
                    <span class="text-xs font-extrabold text-peach-500 whitespace-nowrap">Rp{{ number_format($o->total_harga, 0, ',', '.') }}</span>
                </div>
                <div class="flex flex-col gap-2 mt-3">
                    <form action="{{ route('admin.pesanan.acc', $o) }}" method="POST" class="flex flex-col min-[420px]:flex-row gap-1.5 min-[420px]:items-center bg-emerald-50 rounded-2xl p-1.5">
                        @csrf @method('PATCH')
                        <input type="date" name="tanggal_fix" value="{{ ($o->tanggal_fix ?? $o->tanggal_usulan)->format('Y-m-d') }}" class="flex-1 min-w-0 text-[11px] font-bold bg-white rounded-full px-2 py-1.5 border border-emerald-200 focus:outline-none">
                        <div class="flex gap-1.5">
                            <input type="time" name="jam_fix" min="{{ $setting->jam_mulai }}" max="{{ $setting->jam_selesai }}" value="{{ ($o->tanggal_fix ?? $o->tanggal_usulan)->format('H:i') }}" class="flex-1 min-[420px]:w-[76px] min-w-0 text-[11px] font-bold bg-white rounded-full px-2 py-1.5 border border-emerald-200 focus:outline-none">
                            <button class="flex-1 min-[420px]:flex-none px-3 py-1.5 rounded-full bg-emerald-500 text-white text-[11px] font-extrabold hover:bg-emerald-600 whitespace-nowrap"><i class="fa-solid fa-check mr-1"></i>ACC</button>
                        </div>
                    </form>
                    <a href="{{ route('admin.pesanan.show', [$o, 'from' => url()->full()]) }}" class="w-full min-[420px]:w-9 min-[420px]:h-9 py-2 min-[420px]:py-0 rounded-full min-[420px]:rounded-full bg-lavender-50 text-lavender-600 flex items-center justify-center gap-1 hover:bg-lavender-100 shrink-0 text-[11px] min-[420px]:text-xs font-extrabold" title="Detail"><i class="fa-solid fa-chevron-right text-xs"></i><span class="min-[420px]:hidden">Lihat Detail</span></a>
                </div>
            </div>
        @empty
            <div class="h-full flex flex-col items-center justify-center text-center opacity-70 py-10">
                <div class="w-24 h-24 rounded-full bg-emerald-50 text-emerald-300 flex items-center justify-center text-4xl mb-4 border-2 border-dashed border-emerald-200">
                    <i class="fa-solid fa-circle-check"></i>
                </div>
                <p class="text-lg font-extrabold text-gray-700">Tidak ada order menunggu</p>
                <p class="text-sm font-semibold text-gray-400 mt-1">Semua jadwal sudah terkonfirmasi</p>
            </div>
        @endforelse
    </div>

    <!-- Summary & Action Button -->
    <div class="p-5 sm:p-6 bg-gray-50/50 border-t border-gray-100 rounded-t-[2rem]">
        <div class="flex justify-between items-center text-sm font-bold text-gray-500 mb-4">
            <span>Order Menunggu ACC</span>
            <span>{{ $pendingCount }} order</span>
        </div>

        <a href="{{ route('admin.pesanan.index') }}" class="w-full py-3.5 sm:py-4 rounded-3xl bg-lavender-600 text-white font-extrabold text-base sm:text-lg shadow-lg shadow-lavender-200 hover:bg-lavender-700 hover:shadow-xl hover:-translate-y-0.5 transition-all flex justify-center items-center gap-3">
            <i class="fa-solid fa-calendar-check"></i>
            Kelola Semua Pesanan
        </a>
    </div>
</aside>
@endsection

@push('scripts')
<script>
    Chart.defaults.font.family = "'Nunito', sans-serif";

    // Line: tren order masuk harian
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: @json($trendLabels),
            datasets: [{
                label: 'Order masuk',
                data: @json($trendValues),
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#8b5cf6',
                pointBorderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 10, weight: 'bold' }, color: '#9ca3af', maxTicksLimit: 12 }
                },
                y: {
                    beginAtZero: true,
                    ticks: { font: { size: 10, weight: 'bold' }, color: '#9ca3af', precision: 0 },
                    grid: { color: '#f3f4f6' }
                }
            }
        }
    });

    // Pie: perbandingan jenis layanan (data aktual)
    @if($pieTotal > 0)
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: @json($pieLabels),
            datasets: [{
                data: @json($pieQtys),
                backgroundColor: @json($pieColors),
                borderColor: '#ffffff',
                borderWidth: 3,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = total ? (ctx.parsed / total * 100).toFixed(1) : 0;
                            return ' ' + ctx.label + ': ' + ctx.parsed + 'x (' + pct + '%)';
                        }
                    }
                }
            }
        }
    });
    @endif

    // Search header -> cari di Kelola Pesanan
    document.getElementById('searchInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.value.trim() !== '') {
            window.location.href = "{{ route('admin.pesanan.index') }}?search=" + encodeURIComponent(e.target.value.trim());
        }
    });

    // Lompat bulan: tombol nama bulan -> popup pilih bulan & tahun
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const shownYear = {{ $month->year }};
    const shownMonth = {{ $month->month }};
    let jumpYear = shownYear;
    const dashBase = "{{ route('admin.dashboard') }}";
    const keepParams = new URLSearchParams(window.location.search);
    function dashUrl(extra) {
        const p = new URLSearchParams(keepParams);
        Object.entries(extra).forEach(([k, v]) => p.set(k, v));
        return dashBase + '?' + p.toString();
    }
    function renderJumpGrid() {
        document.getElementById('jumpYearLabel').innerText = jumpYear;
        const g = document.getElementById('jumpMonthGrid');
        g.innerHTML = '';
        monthNames.forEach((nm, idx) => {
            const m = idx + 1;
            const b = document.createElement('button');
            const active = (jumpYear === shownYear && m === shownMonth);
            b.className = "py-2 rounded-xl text-xs font-extrabold " + (active ? "bg-lavender-600 text-white shadow" : "bg-gray-50 text-gray-600 hover:bg-lavender-50 hover:text-lavender-600");
            b.textContent = nm;
            b.onclick = () => { window.location.href = dashUrl({ bulan: jumpYear + '-' + String(m).padStart(2, '0') }); };
            g.appendChild(b);
        });
    }
    document.getElementById('monthJumpBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('monthJump').classList.toggle('hidden');
        renderJumpGrid();
    });
    document.getElementById('jumpPrevYear').addEventListener('click', (e) => { e.stopPropagation(); jumpYear--; renderJumpGrid(); });
    document.getElementById('jumpNextYear').addEventListener('click', (e) => { e.stopPropagation(); jumpYear++; renderJumpGrid(); });
    document.getElementById('jumpToday').addEventListener('click', () => { window.location.href = dashBase; });
    document.addEventListener('click', (e) => {
        const dd = document.getElementById('monthJump');
        if (!dd.classList.contains('hidden') && !dd.contains(e.target)) dd.classList.add('hidden');
    });
</script>
@endpush
