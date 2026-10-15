<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\JadwalRules;
use App\Models\Category;
use App\Models\Order;
use App\Models\Service;
use App\Models\Setting;
use App\Services\WaComposer;
use Illuminate\Http\Request;

class PublicController extends Controller
{
    public function index()
    {
        $services = Service::where('is_active', true)->orderBy('id')->get();
        $setting = Setting::current();
        $categories = Category::whereHas('services', fn ($q) => $q->where('is_active', true))->orderBy('name')->pluck('name');
        $closedDates = \App\Models\ClosureDate::where('tanggal', '>=', now()->toDateString())->orderBy('tanggal')->pluck('tanggal')->map(fn ($t) => $t->format('Y-m-d'));
        $minTanggal = $setting->is_open ? now()->toDateString() : now()->addDay()->toDateString();
        $servicesJson = $services->map(fn ($s) => [
            'id' => $s->id, 'name' => $s->name, 'category' => $s->category,
            'price' => $s->price, 'duration' => $s->duration_minutes . ' Menit',
            'durationMin' => $s->duration_minutes,
            'image' => $s->image_src ?? 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=300&h=300&fit=crop',
        ])->toJson();
        return view('public.index', compact('services', 'setting', 'categories', 'servicesJson', 'closedDates', 'minTanggal'));
    }

    public function store(Request $request)
    {
        $setting = Setting::current();
        $data = $request->validate([
            'customer_name' => 'required|string|max:100',
            'alamat' => 'required|string|max:500',
            'tanggal_usulan' => ['required', 'date', $setting->is_open ? 'after_or_equal:today' : 'after:today', JadwalRules::bukanLibur()],
            'jam_usulan' => ['required', 'date_format:H:i', JadwalRules::jamOperasional()],
            'items' => 'required|array|min:1',
            'items.*.service_id' => 'required|exists:services,id',
            'items.*.qty' => 'required|integer|min:1|max:20',
        ], [
            'tanggal_usulan.after' => 'Saat sedang tutup, pengerjaan paling cepat besok. Order tetap kami terima.',
        ]);

        $total = 0;
        $estimasi = 0;
        $rows = [];
        foreach ($data['items'] as $it) {
            $svc = Service::findOrFail($it['service_id']);
            if (! $svc->is_active) {
                return response()->json(['message' => 'Layanan ' . $svc->name . ' sedang nonaktif.'], 422);
            }
            $sub = $svc->price * $it['qty'];
            $total += $sub;
            $estimasi += $svc->duration_minutes * $it['qty'];
            $rows[] = ['service' => $svc, 'qty' => $it['qty'], 'sub' => $sub];
        }

        $order = Order::create([
            'customer_name' => $data['customer_name'],
            'alamat' => $data['alamat'],
            'tanggal_usulan' => $data['tanggal_usulan'] . ' ' . $data['jam_usulan'],
            'total_harga' => $total,
            'estimasi_menit' => $estimasi,
            'status' => 'pending',
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

        $order->load('items');

        return response()->json([
            'order_id' => $order->id,
            'wa_link' => WaComposer::orderLink($order),
            'success_url' => route('orders.success', $order),
        ]);
    }

    public function success(Order $order)
    {
        $order->load('items');
        $waLink = WaComposer::orderLink($order);
        return view('public.success', compact('order', 'waLink'));
    }
}
