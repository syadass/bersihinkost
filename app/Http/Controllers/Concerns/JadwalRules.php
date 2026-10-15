<?php

namespace App\Http\Controllers\Concerns;

use App\Models\ClosureDate;
use App\Models\Setting;
use Carbon\Carbon;
use Closure;

class JadwalRules
{
    /** Pastikan jam pengerjaan di dalam jam operasional (format H:i). */
    public static function jamOperasional(): Closure
    {
        return function ($attribute, $value, $fail) {
            $s = Setting::current();
            if (! is_string($value) || $value < $s->jam_mulai || $value > $s->jam_selesai) {
                $fail("Jam pengerjaan hanya {$s->jam_mulai}–{$s->jam_selesai} WIB.");
            }
        };
    }

    /** Pastikan tanggal pengerjaan bukan tanggal libur/tutup. */
    public static function bukanLibur(): Closure
    {
        return function ($attribute, $value, $fail) {
            try {
                $tgl = Carbon::parse($value)->format('Y-m-d');
            } catch (\Exception $e) {
                return;
            }
            $libur = ClosureDate::where('tanggal', $tgl)->first();
            $label = Carbon::parse($value)->translatedFormat('d F Y');
            if ($libur) {
                $fail($libur->keterangan
                    ? "Tanggal {$label} tutup ({$libur->keterangan})."
                    : "Tanggal {$label} sedang libur/tutup.");
            }
        };
    }
}
