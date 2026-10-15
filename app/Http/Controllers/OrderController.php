<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\JadwalRules;
use App\Models\Order;
use App\Models\Service;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $tab = $request->get('tab', 'all');
        $map = [
            'menunggu-acc' => ['pending', 'rescheduled'],
            'terjadwal' => ['confirmed'],
            'selesai' => ['completed'],
            'batal' => ['cancelled'],
            // kompatibel link lama
            'menunggu' => ['pending', 'rescheduled'],
            'proses' => ['confirmed'],
        ];
        if (! isset($map[$tab]) && $tab !== 'all') {
            $tab = 'all';
        }

        $sort = $request->get('sort', 'terbaru');
        $allowedSorts = ['terbaru', 'terlama', 'id_asc', 'id_desc', 'nama_asc', 'nama_desc', 'usulan_asc', 'usulan_desc', 'fix_asc', 'fix_desc'];
        if (! in_array($sort, $allowedSorts)) {
            $sort = 'terbaru';
        }

        $q = Order::with('items');
        if (isset($map[$tab])) {
            $q->whereIn('status', $map[$tab]);
        }
        if ($request->filled('search')) {
            $s = $request->search;
            $q->where(fn ($w) => $w->where('customer_name', 'like', "%$s%")->orWhere('alamat', 'like', "%$s%"));
        }
        [$fBulan, $fTahun, $fYears] = $this->periodeFilter($request);
        $this->applyPeriode($q, $fBulan, $fTahun);
        match ($sort) {
            'terlama' => $q->oldest(),
            'id_asc' => $q->orderBy('id', 'asc'),
            'id_desc' => $q->orderBy('id', 'desc'),
            'nama_asc' => $q->orderBy('customer_name', 'asc'),
            'nama_desc' => $q->orderBy('customer_name', 'desc'),
            'usulan_asc' => $q->orderBy('tanggal_usulan', 'asc')->orderBy('id', 'asc'),
            'usulan_desc' => $q->orderBy('tanggal_usulan', 'desc')->orderBy('id', 'desc'),
            'fix_asc' => $q->orderByRaw('COALESCE(tanggal_fix, tanggal_usulan) ASC, id ASC'),
            'fix_desc' => $q->orderByRaw('COALESCE(tanggal_fix, tanggal_usulan) DESC, id DESC'),
            default => $q->latest(),
        };
        $orders = $q->paginate(5)->withQueryString();
        $counts = [
            'all' => Order::count(),
            'menunggu-acc' => Order::whereIn('status', ['pending', 'rescheduled'])->count(),
            'terjadwal' => Order::where('status', 'confirmed')->count(),
            'selesai' => Order::where('status', 'completed')->count(),
            'batal' => Order::where('status', 'cancelled')->count(),
        ];
        $servicesJson = Service::where('is_active', true)->orderBy('id')->get()
            ->map(fn ($s) => ['id' => $s->id, 'name' => $s->name, 'price' => $s->price]);
        $setting = \App\Models\Setting::current();

        return view('admin.pesanan.index', compact('orders', 'counts', 'tab', 'sort', 'servicesJson', 'fBulan', 'fTahun', 'fYears', 'setting'));
    }

    /** Ambil & validasi filter bulan/tahun untuk daftar pesanan. */
    private function periodeFilter(Request $request): array
    {
        $bulanRaw = $request->get('bulan', 'all');
        $bulan = $bulanRaw === 'all' ? 'all' : (int) $bulanRaw;
        if ($bulan !== 'all' && ($bulan < 1 || $bulan > 12)) {
            $bulan = 'all';
        }
        $years = Order::selectRaw('YEAR(tanggal_usulan) as y')->distinct()->pluck('y')
            ->merge(Order::whereNotNull('tanggal_fix')->selectRaw('YEAR(tanggal_fix) as y')->distinct()->pluck('y'))
            ->map(fn ($y) => (int) $y)->unique()->sort()->values()->all();
        if (empty($years)) {
            $years = [now()->year];
        }
        $tahunRaw = $request->get('tahun', 'all');
        $tahun = $tahunRaw === 'all' ? 'all' : (int) $tahunRaw;
        if ($tahun !== 'all' && ! in_array($tahun, $years)) {
            $tahun = 'all';
        }
        return [$bulan, $tahun, $years];
    }

    /** Batasi query ke jadwal efektif (fix ?? usulan) pada bulan/tahun terpilih. */
    private function applyPeriode($q, $bulan, $tahun)
    {
        if ($bulan !== 'all') {
            $q->where(fn ($w) => $w->whereMonth('tanggal_fix', $bulan)
                ->orWhere(fn ($x) => $x->whereNull('tanggal_fix')->whereMonth('tanggal_usulan', $bulan)));
        }
        if ($tahun !== 'all') {
            $q->where(fn ($w) => $w->whereYear('tanggal_fix', $tahun)
                ->orWhere(fn ($x) => $x->whereNull('tanggal_fix')->whereYear('tanggal_usulan', $tahun)));
        }
        return $q;
    }

    /** Laporan pemasukan (PDF): pesanan selesai & lunas mengikuti filter yang aktif. */
    public function laporanDownload(Request $request)
    {
        [$fBulan, $fTahun] = $this->periodeFilter($request);
        $q = Order::with('items')->where('status', 'completed');
        if ($request->filled('search')) {
            $s = $request->search;
            $q->where(fn ($w) => $w->where('customer_name', 'like', "%$s%")->orWhere('alamat', 'like', "%$s%"));
        }
        $this->applyPeriode($q, $fBulan, $fTahun);
        $rows = $q->latest('updated_at')->get();
        $totalPeriode = $rows->sum('total_harga');
        $totalKeseluruhan = Order::where('status', 'completed')->sum('total_harga');

        $yearForDays = $fTahun === 'all' ? now()->year : $fTahun;
        if ($fBulan !== 'all') {
            $days = \Carbon\Carbon::create($yearForDays, $fBulan, 1)->daysInMonth;
        } elseif ($fTahun !== 'all') {
            $days = \Carbon\Carbon::create($fTahun, 1, 1)->daysInYear;
        } else {
            $min = Order::where('status', 'completed')->min('updated_at');
            $max = Order::where('status', 'completed')->max('updated_at');
            $days = ($min && $max) ? max(1, \Carbon\Carbon::parse($min)->diffInDays(\Carbon\Carbon::parse($max)) + 1) : 1;
        }
        $rataHarian = $days > 0 ? (int) round($totalPeriode / $days) : 0;

        $periodeLabel = ($fBulan === 'all' ? 'Semua Bulan' : \Carbon\Carbon::create($yearForDays, $fBulan, 1)->translatedFormat('F')) . ' ' . ($fTahun === 'all' ? 'Semua Tahun' : $fTahun);
        $fileSlug = ($fBulan === 'all' ? 'semua-bulan' : sprintf('%02d', $fBulan)) . '-' . ($fTahun === 'all' ? 'semua-tahun' : $fTahun);
        $setting = \App\Models\Setting::current();

        return view('admin.pesanan.laporan', compact('rows', 'totalPeriode', 'totalKeseluruhan', 'rataHarian', 'days', 'periodeLabel', 'fileSlug', 'setting'));
    }
    public function create()
    {
        $services = Service::where('is_active', true)->orderBy('id')->get();
        $servicesJson = $services->map(fn ($s) => ['id' => $s->id, 'name' => $s->name, 'price' => $s->price])->toJson();
        $setting = \App\Models\Setting::current();
        return view('admin.pesanan.create', compact('services', 'servicesJson', 'setting'));
    }

    public function show(Request $request, Order $order)
    {
        $order->load('items.service');
        $setting = \App\Models\Setting::current();
        $servicesJson = Service::where('is_active', true)->orderBy('id')->get()
            ->map(fn ($s) => ['id' => $s->id, 'name' => $s->name, 'price' => $s->price]);
        $existingJson = $order->items->map(fn ($i) => ['service_id' => $i->service_id, 'qty' => $i->qty]);
        // Tombol kembali: ke halaman asal (dashboard / kelola pesanan), bukan selalu ke daftar
        $backUrl = route('admin.pesanan.index');
        $candidate = $request->query('from') ?: url()->previous();
        if (is_string($candidate) && $candidate !== '' && $candidate !== url()->current()
            && $this->isSafeBackUrl($request, $candidate, $order)) {
            $backUrl = $candidate;
        }
        return view('admin.pesanan.show', compact('order', 'setting', 'servicesJson', 'existingJson', 'backUrl'));
    }

    /** Pastikan URL kembali internal & tidak mengarah ke halaman detail itu sendiri. */
    private function isSafeBackUrl(Request $request, string $url, Order $order): bool
    {
        $parts = parse_url($url);
        if (isset($parts['host']) && $parts['host'] !== $request->getHost()) {
            return false;
        }
        return ! str_contains($parts['path'] ?? '/', '/pesanan/' . $order->id);
    }

    public function invoice(Order $order)
    {
        $order->load('items.service');
        $setting = \App\Models\Setting::current();
        return view('admin.pesanan.invoice', compact('order', 'setting'));
    }

    public function edit(Order $order)
    {
        $order->load('items');
        $services = Service::where('is_active', true)->orderBy('id')->get();
        $servicesJson = $services->map(fn ($s) => ['id' => $s->id, 'name' => $s->name, 'price' => $s->price])->toJson();
        $existingJson = $order->items->map(fn ($i) => ['service_id' => $i->service_id, 'qty' => $i->qty])->toJson();
        $setting = \App\Models\Setting::current();
        return view('admin.pesanan.edit', compact('order', 'services', 'servicesJson', 'existingJson', 'setting'));
    }

    public function update(Request $request, Order $order)
    {
        if (in_array($order->status, ['cancelled', 'completed'])) {
            return back()->withErrors(['status' => 'Pesanan yang sudah selesai/batal tidak bisa diubah.']);
        }
        $data = $request->validate([
            'customer_name' => 'required|string|max:100',
            'alamat' => 'required|string|max:500',
            'tanggal_usulan' => ['required', 'date', JadwalRules::bukanLibur()],
            'jam_usulan' => ['required', 'date_format:H:i', JadwalRules::jamOperasional()],
            'catatan_admin' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.service_id' => 'required|exists:services,id',
            'items.*.qty' => 'required|integer|min:1|max:20',
        ]);

        $total = 0;
        $estimasi = 0;
        $rows = [];
        foreach ($data['items'] as $it) {
            $svc = Service::findOrFail($it['service_id']);
            $sub = $svc->price * $it['qty'];
            $total += $sub;
            $estimasi += $svc->duration_minutes * $it['qty'];
            $rows[] = $svc;
        }

        $order->update([
            'customer_name' => $data['customer_name'],
            'alamat' => $data['alamat'],
            'tanggal_usulan' => $data['tanggal_usulan'] . ' ' . $data['jam_usulan'],
            'catatan_admin' => $data['catatan_admin'] ?? null,
            'total_harga' => $total,
            'estimasi_menit' => $estimasi,
        ]);

        $order->items()->delete();
        foreach ($data['items'] as $it) {
            $svc = Service::findOrFail($it['service_id']);
            $order->items()->create([
                'service_id' => $svc->id,
                'service_name' => $svc->name,
                'qty' => $it['qty'],
                'harga_satuan' => $svc->price,
                'subtotal' => $svc->price * $it['qty'],
            ]);
        }

        return redirect()->route('admin.pesanan.show', array_filter([$order, 'from' => $request->input('from')]))->with('ok', 'Pesanan berhasil diubah.');
    }

    public function acc(Request $request, Order $order)
    {
        $data = $request->validate([
            'tanggal_fix' => ['required', 'date', 'after_or_equal:today', JadwalRules::bukanLibur()],
            'jam_fix' => ['required', 'date_format:H:i', JadwalRules::jamOperasional()],
        ], [
            'tanggal_fix.after_or_equal' => 'Tanggal fix tidak boleh lampau.',
        ]);
        $order->update(['tanggal_fix' => $data['tanggal_fix'] . ' ' . $data['jam_fix'], 'status' => 'confirmed', 'alasan_batal' => null]);
        return back()->with('ok', "Order #{$order->id} di-ACC untuk {$data['tanggal_fix']} pukul {$data['jam_fix']}.");
    }

    public function reschedule(Request $request, Order $order)
    {
        $data = $request->validate([
            'tanggal_fix' => ['required', 'date', 'after_or_equal:today', JadwalRules::bukanLibur()],
            'jam_fix' => ['required', 'date_format:H:i', JadwalRules::jamOperasional()],
        ], [
            'tanggal_fix.after_or_equal' => 'Tanggal baru tidak boleh lampau.',
        ]);
        $order->update(['tanggal_fix' => $data['tanggal_fix'] . ' ' . $data['jam_fix'], 'status' => 'rescheduled']);
        return back()->with('ok', "Order #{$order->id} dipindah ke {$data['tanggal_fix']} pukul {$data['jam_fix']}.");
    }

    public function cancel(Request $request, Order $order)
    {
        $data = $request->validate(['alasan_batal' => 'required|string|max:500']);
        $order->update(['status' => 'cancelled', 'alasan_batal' => $data['alasan_batal']]);
        return back()->with('ok', "Order #{$order->id} dibatalkan.");
    }

    public function complete(Order $order)
    {
        $order->update(['status' => 'completed']);
        return back()->with('ok', "Order #{$order->id} selesai, masuk kas.");
    }

    public function destroy(Order $order)
    {
        if ($order->status !== 'cancelled') {
            return back()->withErrors(['order' => 'Hanya riwayat batal yang bisa dihapus.']);
        }
        $order->delete();
        return back()->with('ok', "Riwayat order #{$order->id} dihapus.");
    }

    public function manualStore(Request $request)
    {
        $data = $request->validate([
            'customer_name' => 'required|string|max:100',
            'alamat' => 'required|string|max:500',
            'tanggal_fix' => ['required', 'date', JadwalRules::bukanLibur()],
            'jam_fix' => ['required', 'date_format:H:i', JadwalRules::jamOperasional()],
            'items' => 'required|array|min:1',
            'items.*.service_id' => 'required|exists:services,id',
            'items.*.qty' => 'required|integer|min:1|max:20',
        ]);

        $total = 0;
        $estimasi = 0;
        $rows = [];
        foreach ($data['items'] as $it) {
            $svc = Service::findOrFail($it['service_id']);
            $sub = $svc->price * $it['qty'];
            $total += $sub;
            $estimasi += $svc->duration_minutes * $it['qty'];
            $rows[] = ['service' => $svc, 'qty' => $it['qty'], 'sub' => $sub];
        }

        $order = Order::create([
            'customer_name' => $data['customer_name'],
            'alamat' => $data['alamat'],
            'tanggal_usulan' => $data['tanggal_fix'] . ' ' . $data['jam_fix'],
            'tanggal_fix' => $data['tanggal_fix'] . ' ' . $data['jam_fix'],
            'total_harga' => $total,
            'estimasi_menit' => $estimasi,
            'status' => 'confirmed',
        ]);

        foreach ($rows as $r) {
            $order->items()->create([
                'service_id' => $r['service']->id,
                'service_name' => $r['service']->name,
                'qty' => $r['qty'],
                'harga_satuan' => $r['service']->price,
                'subtotal' => $r['sub'],
            ]);
        }

        if ($request->expectsJson()) {
            return response()->json(['order_id' => $order->id]);
        }
        return redirect()->route('admin.pesanan.show', $order)->with('ok', "Jadwal manual #{$order->id} tersimpan sebagai Confirmed.");
    }
}
