<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_name', 'alamat', 'tanggal_usulan', 'tanggal_fix',
        'total_harga', 'estimasi_menit', 'status', 'alasan_batal', 'catatan_admin',
    ];

    protected $casts = [
        'tanggal_usulan' => 'datetime',
        'tanggal_fix' => 'datetime',
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function isPending(): bool
    {
        return in_array($this->status, ['pending', 'rescheduled']);
    }
}
