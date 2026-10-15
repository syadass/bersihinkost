<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'category', 'price', 'duration_minutes', 'image_url', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function getDurationLabelAttribute(): string
    {
        return $this->duration_minutes . ' Menit';
    }

    /**
     * URL gambar siap tampil: link http(s) dipakai langsung,
     * path lokal (hasil unggahan) disajikan via public/storage.
     */
    public function getImageSrcAttribute(): ?string
    {
        if (! $this->image_url) {
            return null;
        }
        if (str_starts_with($this->image_url, 'http://') || str_starts_with($this->image_url, 'https://')) {
            return $this->image_url;
        }
        return asset('storage/' . ltrim($this->image_url, '/'));
    }

    public function usesLocalImage(): bool
    {
        return (bool) $this->image_url
            && ! str_starts_with($this->image_url, 'http://')
            && ! str_starts_with($this->image_url, 'https://');
    }
}
