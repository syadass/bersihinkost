<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function dashboard(Request $request)
    {
        $pendingCount = Order::whereIn('status', ['pending', 'rescheduled'])->count();
        $kasBulanIni = Order::where('status', 'completed')
            ->whereMonth('updated_at', now()->month)
            ->whereYear('updated_at', now()->year)
            ->sum('total_harga');
        $selesaiBulanIni = Order::where('status', 'completed')
            ->whereMonth('updated_at', now()->month)
            ->whereYear('updated_at', now()->year)
            ->count();

        $recentOrders = Order::with('items')->latest()->take(8)->get();

        // Kalender jadwal bulan berjalan (tanggal efektif = tanggal_fix ?? tanggal_usulan)
        try {
            $month = \Carbon\Carbon::parse($request->get('bulan', now()->format('Y-m')))->startOfMonth();
        } catch (\Exception $e) {
            $month = now()->startOfMonth();
        }
        $gridStart = $month->copy()->startOfWeek();
        $gridEnd = $month->copy()->endOfMonth()->endOfWeek();
        $monthOrders = Order::where(function ($q) use ($gridStart, $gridEnd) {
            $q->whereBetween('tanggal_usulan', [$gridStart->toDateString(), $gridEnd->toDateString()])
                ->orWhereBetween('tanggal_fix', [$gridStart->toDateString(), $gridEnd->toDateString()]);
        })->orderBy('id')->get();
        $byDate = [];
        foreach ($monthOrders as $o) {
            $key = ($o->tanggal_fix ?? $o->tanggal_usulan)->format('Y-m-d');
            $byDate[$key][] = $o;
        }
        $byDate = collect($byDate)->map(fn ($arr) => collect($arr))->all();
        $weeks = [];
        $d = $gridStart->copy();
        while ($d->lte($gridEnd)) {
            $week = [];
            for ($i = 0; $i < 7; $i++) {
                $week[] = [
                    'date' => $d->copy(),
                    'inMonth' => $d->month === $month->month,
                    'isToday' => $d->isToday(),
                    'orders' => $byDate[$d->format('Y-m-d')] ?? collect(),
                ];
                $d->addDay();
            }
            $weeks[] = $week;
        }

        // Order terbaru yang butuh ACC (pending + reschedule)
        $pendingOrders = Order::with('items')->whereIn('status', ['pending', 'rescheduled'])->latest()->take(10)->get();
        $pendingTotal = Order::whereIn('status', ['pending', 'rescheduled'])->sum('total_harga');

        // Card: total pesanan bulan berjalan (semua status, berdasar tgl masuk)
        $totalPesananBulanIni = Order::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        // Card: jadwal hari ini (tgl efektif = fix ?? usulan, di luar batal)
        $todayStr = now()->toDateString();
        $jadwalHariIni = Order::where('status', '!=', 'cancelled')
            ->where(function ($q) use ($todayStr) {
                $q->whereDate('tanggal_fix', $todayStr)
                    ->orWhere(function ($w) use ($todayStr) {
                        $w->whereNull('tanggal_fix')->whereDate('tanggal_usulan', $todayStr);
                    });
            })->count();

        // Tahun-tahun yang ada datanya (untuk filter grafik)
        $years = Order::selectRaw('YEAR(created_at) as y')->distinct()->orderBy('y')->pluck('y')->map(fn ($y) => (int) $y)->all();
        if (! in_array(now()->year, $years)) {
            $years[] = now()->year;
            sort($years);
        }

        // Grafik garis: tren order masuk harian dalam bulan+tahun pilihan
        $chartBulan = (int) $request->get('g_bulan', now()->month);
        $chartTahun = (int) $request->get('g_tahun', now()->year);
        if ($chartBulan < 1 || $chartBulan > 12) {
            $chartBulan = now()->month;
        }
        if (! in_array($chartTahun, $years)) {
            $chartTahun = now()->year;
        }
        $daysInMonth = \Carbon\Carbon::create($chartTahun, $chartBulan, 1)->daysInMonth;
        $trendLabels = [];
        $trendValues = [];
        for ($d = 1; $d <= $daysInMonth; $d++) {
            $dateStr = sprintf('%04d-%02d-%02d', $chartTahun, $chartBulan, $d);
            $trendLabels[] = (string) $d;
            $trendValues[] = Order::whereDate('created_at', $dateStr)->count();
        }

        // Ringkasan di bawah line chart, mengikuti filter bulan+tahun grafik
        $trendTotalPesanan = Order::whereMonth('created_at', $chartBulan)
            ->whereYear('created_at', $chartTahun)
            ->count();
        $trendTotalPenghasilan = Order::where('status', 'completed')
            ->whereMonth('updated_at', $chartBulan)
            ->whereYear('updated_at', $chartTahun)
            ->sum('total_harga');
        $trendRataHarian = $daysInMonth > 0 ? (int) round($trendTotalPenghasilan / $daysInMonth) : 0;

        // Pie chart: perbandingan jenis layanan berdasar qty pesanan aktual + filter periode
        $pieBulanRaw = $request->get('pie_bulan', (string) now()->month);
        $pieBulan = $pieBulanRaw === 'all' ? 'all' : (int) $pieBulanRaw;
        if ($pieBulan !== 'all' && ($pieBulan < 1 || $pieBulan > 12)) {
            $pieBulan = now()->month;
        }
        $pieTahun = (int) $request->get('pie_tahun', now()->year);
        if (! in_array($pieTahun, $years)) {
            $pieTahun = now()->year;
        }
        $pieRows = OrderItem::select('service_name', DB::raw('SUM(qty) as total_qty'))
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->whereYear('orders.created_at', $pieTahun)
            ->when($pieBulan !== 'all', fn ($q) => $q->whereMonth('orders.created_at', $pieBulan))
            ->groupBy('service_name')
            ->orderByDesc('total_qty')
            ->get();
        $pieTotal = (int) $pieRows->sum('total_qty');
        $piePalette = ['#7c3aed', '#f43f5e', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6', '#a855f7', '#84cc16', '#f97316'];
        $pieData = $pieRows->values()->map(function ($r, $i) use ($pieTotal, $piePalette) {
            return [
                'label' => $r->service_name,
                'qty' => (int) $r->total_qty,
                'pct' => $pieTotal > 0 ? round($r->total_qty / $pieTotal * 100, 1) : 0,
                'color' => $piePalette[$i % count($piePalette)],
            ];
        })->all();

        $pieLabels = array_column($pieData, 'label');
        $pieQtys = array_column($pieData, 'qty');
        $pieColors = array_column($pieData, 'color');
        $setting = \App\Models\Setting::current();

        return view('admin.dashboard', compact(
            'pendingCount', 'pendingTotal', 'pendingOrders', 'kasBulanIni', 'selesaiBulanIni',
            'totalPesananBulanIni', 'jadwalHariIni',
            'month', 'weeks',
            'years', 'chartBulan', 'chartTahun', 'trendLabels', 'trendValues',
            'trendTotalPesanan', 'trendTotalPenghasilan', 'trendRataHarian',
            'pieBulan', 'pieTahun', 'pieData', 'pieTotal', 'pieLabels', 'pieQtys', 'pieColors',
            'setting'
        ));
    }
}
