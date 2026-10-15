<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Data created_at/updated_at lama disimpan dalam jam UTC; geser +7 jam
        // agar tampil benar setelah timezone aplikasi menjadi Asia/Jakarta.
        // (tanggal_usulan/tanggal_fix TIDAK digeser karena sudah diniatkan WIB.)
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement('UPDATE `orders` SET `created_at` = DATE_ADD(`created_at`, INTERVAL 7 HOUR), `updated_at` = DATE_ADD(`updated_at`, INTERVAL 7 HOUR)');
            DB::statement('UPDATE `password_reset_tokens` SET `created_at` = DATE_ADD(`created_at`, INTERVAL 7 HOUR)');
        }
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement('UPDATE `orders` SET `created_at` = DATE_SUB(`created_at`, INTERVAL 7 HOUR), `updated_at` = DATE_SUB(`updated_at`, INTERVAL 7 HOUR)');
            DB::statement('UPDATE `password_reset_tokens` SET `created_at` = DATE_SUB(`created_at`, INTERVAL 7 HOUR)');
        }
    }
};
