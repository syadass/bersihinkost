<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Setting;

class WaComposer
{
    public static function orderLink(Order $order): string
    {
        $setting = Setting::current();
        $order->loadMissing('items');

        $lines = [];
        $lines[] = 'Halo Kak ' . $setting->operator_name . ', saya ingin memesan jasa bersih kost:';
        $lines[] = '';
        $lines[] = '*Order #' . $order->id . ' - Menunggu Konfirmasi*';
        $lines[] = 'Nama: ' . $order->customer_name;
        $lines[] = 'Alamat: ' . $order->alamat;
        $lines[] = 'Tanggal Usulan: ' . $order->tanggal_usulan->format('d/m/Y H:i') . ' WIB';
        $lines[] = '';
        $lines[] = '*Detail Layanan:*';
        foreach ($order->items as $item) {
            $lines[] = '- ' . $item->service_name . ' (' . $item->qty . 'x) - Rp' . number_format($item->subtotal, 0, ',', '.');
        }
        $lines[] = '';
        $lines[] = '*Total Biaya:* Rp' . number_format($order->total_harga, 0, ',', '.');
        $lines[] = 'Estimasi: ' . $order->estimasi_menit . ' Menit';
        $lines[] = '';
        $lines[] = 'Mohon konfirmasi jadwalnya ya kak. Terima kasih!';

        return 'https://wa.me/' . $setting->admin_wa_number . '?text=' . rawurlencode(implode("\n", $lines));
    }
}
