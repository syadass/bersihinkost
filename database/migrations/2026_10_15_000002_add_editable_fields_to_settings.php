<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->string('business_name', 100)->default('Bersihinkost');
            $table->string('jam_mulai', 5)->default('08:00');
            $table->string('jam_selesai', 5)->default('17:00');
            $table->text('catatan_publik')->nullable();
        });
        DB::table('settings')->whereNull('catatan_publik')->update([
            'catatan_publik' => 'Pemesanan untuk hari yang sama harap konfirmasi 2 jam sebelumnya.',
        ]);
    }

    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropColumn(['business_name', 'jam_mulai', 'jam_selesai', 'catatan_publik']);
        });
    }
};
