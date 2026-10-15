<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = ['admin_wa_number', 'operator_name', 'is_open', 'business_name', 'jam_mulai', 'jam_selesai', 'catatan_publik'];

    protected $casts = ['is_open' => 'boolean'];

    public static function current(): self
    {
        return static::firstOrCreate(['id' => 1], [
            'admin_wa_number' => '6281234567890',
            'operator_name' => 'Syada Saleha',
            'is_open' => true,
            'business_name' => 'Bersihinkost',
            'jam_mulai' => '08:00',
            'jam_selesai' => '17:00',
            'catatan_publik' => 'Pemesanan untuk hari yang sama harap konfirmasi 2 jam sebelumnya.',
        ]);
    }
}
