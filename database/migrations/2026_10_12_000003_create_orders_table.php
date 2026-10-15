<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('customer_name');
            $table->text('alamat');
            $table->date('tanggal_usulan');
            $table->date('tanggal_fix')->nullable();
            $table->unsignedInteger('total_harga')->default(0);
            $table->unsignedInteger('estimasi_menit')->default(0);
            $table->enum('status', ['pending', 'confirmed', 'rescheduled', 'cancelled', 'completed'])->default('pending');
            $table->text('alasan_batal')->nullable();
            $table->text('catatan_admin')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
