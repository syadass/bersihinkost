<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE `orders` MODIFY `tanggal_usulan` DATETIME NOT NULL');
            DB::statement('ALTER TABLE `orders` MODIFY `tanggal_fix` DATETIME NULL');
        }
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE `orders` MODIFY `tanggal_usulan` DATE NOT NULL');
            DB::statement('ALTER TABLE `orders` MODIFY `tanggal_fix` DATE NULL');
        }
    }
};
