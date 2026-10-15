<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Order;
use App\Models\Service;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@kostclean.test'],
            ['name' => 'Syada Saleha', 'password' => Hash::make('admin123')]
        );

        Setting::firstOrCreate(['id' => 1], [
            'admin_wa_number' => '6281234567890',
            'operator_name' => 'Syada Saleha',
            'is_open' => true,
        ]);

        $services = [
            ['name' => 'Deep Cleaning Total', 'category' => 'Deep Cleaning', 'price' => 75000, 'duration_minutes' => 90, 'image_url' => 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&h=300&fit=crop'],
            ['name' => 'Kuras & Sikat Kamar Mandi', 'category' => 'Kamar Mandi', 'price' => 40000, 'duration_minutes' => 45, 'image_url' => 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=300&h=300&fit=crop'],
            ['name' => 'Cuci & Service AC Kost', 'category' => 'Cuci AC', 'price' => 85000, 'duration_minutes' => 60, 'image_url' => 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&h=300&fit=crop'],
            ['name' => 'Bersih Ringan & Sapu Pel', 'category' => 'Reguler', 'price' => 25000, 'duration_minutes' => 30, 'image_url' => 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=300&h=300&fit=crop'],
            ['name' => 'Cuci Kasur / Vacuum Tungau', 'category' => 'Deep Cleaning', 'price' => 60000, 'duration_minutes' => 45, 'image_url' => 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=300&h=300&fit=crop'],
            ['name' => 'Pembersihan Kerak Dinding KM', 'category' => 'Kamar Mandi', 'price' => 45000, 'duration_minutes' => 40, 'image_url' => 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=300&h=300&fit=crop'],
        ];

        foreach ($services as $s) {
            Category::firstOrCreate(['name' => $s['category']]);
            Service::firstOrCreate(['name' => $s['name']], $s + ['is_active' => true]);
        }

        $this->seedSampleOrders();
    }

    private function seedSampleOrders(): void
    {
        if (Order::where('customer_name', 'Budi Santoso')->exists()) {
            return;
        }

        $services = Service::all();
        $names = [
            ['Budi Santoso', 'Kost Mawar Jl. Slamet Riyadi No.12, Kamar 5'],
            ['Rina Putri', 'Kost Melati Jl. Ahmad Yani No.45, Kamar 2 Lantai 1'],
            ['Agus Wijaya', 'Kost Barokah Jl. Veteran No.8, Kamar 10'],
            ['Sinta Dewi', 'Kost Amanah Jl. Honggowongso No.21, Kamar 3'],
            ['Doni Prasetyo', 'Kost Griya Asri Jl. Dr. Rajiman No.77, Kamar 7'],
            ['Maya Anggraini', 'Kost Sakinah Jl. Yos Sudarso No.33, Kamar 1'],
            ['Fajar Nugroho', 'Kost Pondok Aren Jl. Monginsidi No.54, Kamar 9'],
            ['Lina Marlina', 'Kost Cempaka Jl. Bhayangkara No.19, Kamar 4'],
            ['Rudi Hartono', 'Kost Sejahtera Jl. Kapten Mulyadi No.66, Kamar 6'],
            ['Nina Kurnia', 'Kost Berkah Jl. Gajah Mada No.88, Kamar 11'],
            ['Eko Saputra', 'Kost Damai Jl. Sutan Syahrir No.5, Kamar 8'],
            ['Fitri Handayani', 'Kost Flamboyan Jl. Sutarto No.41, Kamar 12'],
        ];

        $make = function (string $name, string $alamat, string $usulan, ?string $fix, string $status, array $items, $stamps, ?string $alasan = null, ?string $catatan = null) use ($services) {
            $total = 0;
            $estimasi = 0;
            foreach ($items as $it) {
                $svc = $services->firstWhere('id', $it[0]);
                $total += $svc->price * $it[1];
                $estimasi += $svc->duration_minutes * $it[1];
            }
            $order = Order::create([
                'customer_name' => $name, 'alamat' => $alamat,
                'tanggal_usulan' => $usulan, 'tanggal_fix' => $fix,
                'total_harga' => $total, 'estimasi_menit' => $estimasi,
                'status' => $status, 'alasan_batal' => $alasan, 'catatan_admin' => $catatan,
                'created_at' => $stamps, 'updated_at' => $stamps,
            ]);
            foreach ($items as $it) {
                $svc = $services->firstWhere('id', $it[0]);
                $order->items()->create([
                    'service_id' => $svc->id, 'service_name' => $svc->name,
                    'qty' => $it[1], 'harga_satuan' => $svc->price,
                    'subtotal' => $svc->price * $it[1],
                    'created_at' => $stamps, 'updated_at' => $stamps,
                ]);
            }
            return $order;
        };

        // 12 completed tersebar 7 hari terakhir (mengisi grafik + kas)
        $completedPlan = [
            [6, [[4, 1]]], [6, [[2, 1], [4, 1]]], [5, [[1, 1]]], [5, [[3, 1]]],
            [4, [[5, 1], [4, 1]]], [3, [[4, 2]]], [3, [[6, 1]]], [2, [[1, 1], [2, 1]]],
            [1, [[3, 1], [4, 1]]], [1, [[2, 1]]], [0, [[4, 1], [6, 1]]], [0, [[5, 1]]],
        ];
        foreach ($completedPlan as $i => $plan) {
            [$daysAgo, $items] = $plan;
            $day = now()->subDays($daysAgo)->setTime(10 + ($i % 8), 15);
            [$name, $alamat] = $names[$i % count($names)];
            $make($name, $alamat, $day->copy()->subDay()->toDateString(), $day->toDateString(), 'completed', $items, $day);
        }

        // 3 pending (menunggu ACC)
        $make('Galih Permana', 'Kost Kenanga Jl. Sam Ratulangi No.29, Kamar 2', now()->addDay()->toDateString(), null, 'pending', [[1, 1]], now()->subHours(5));
        $make('Wulan Sari', 'Kost Dahlia Jl. Dr. Muwardi No.71, Kamar 6', now()->addDays(2)->toDateString(), null, 'pending', [[3, 1], [4, 1]], now()->subHours(2));
        $make('Yoga Aditya', 'Kost Alamanda Jl. Kebangkitan Nasional No.14, Kamar 1', now()->addDays(3)->toDateString(), null, 'pending', [[2, 1]], now()->subHour());

        // 1 confirmed, 1 rescheduled, 1 cancelled
        $make('Ratna Wijaya', 'Kost Anggrek Jl. Cut Nyak Dien No.9, Kamar 4', now()->toDateString(), now()->addDay()->toDateString(), 'confirmed', [[1, 1], [6, 1]], now()->subHours(8), null, 'Sudah ACC via WA, kerjakan pagi.');
        $make('Hendra Gunawan', 'Kost Teratai Jl. Setiabudi No.60, Kamar 3', now()->toDateString(), now()->addDays(4)->toDateString(), 'rescheduled', [[5, 1]], now()->subHours(10), null, 'Minta pindah karena keluar kota.');
        $make('Dian Puspita', 'Kost Kamboja Jl. Ir. Sutami No.23, Kamar 5', now()->subDay()->toDateString(), null, 'cancelled', [[4, 1]], now()->subDay(), 'Customer tiba-tiba pulang kampung, batal dulu.', null);
    }
}
