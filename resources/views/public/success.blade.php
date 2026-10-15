@extends('layouts.public')
@section('title', 'Pesanan Terkirim - Bersihinkost')

@section('content')
<div class="flex-1 flex items-center justify-center p-4 sm:p-6">
    <div class="bg-white rounded-3xl shadow-float p-5 sm:p-8 max-w-lg w-full text-center border border-lavender-100">
        <div class="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
            <i class="fa-solid fa-circle-check"></i>
        </div>
        <h1 class="text-2xl font-extrabold text-gray-800 mb-1">Pesanan #{{ $order->id }} Tercatat!</h1>
        <p class="text-sm font-bold text-amber-500 mb-4"><i class="fa-solid fa-hourglass-half mr-1"></i> Status: Menunggu Konfirmasi (ACC) Pengelola</p>
        <div class="bg-gray-50 rounded-2xl p-4 text-left text-sm font-semibold text-gray-600 space-y-1 mb-4">
            <p><span class="font-extrabold">Nama:</span> {{ $order->customer_name }}</p>
            <p><span class="font-extrabold">Alamat:</span> {{ $order->alamat }}</p>
            <p><span class="font-extrabold">Tanggal Usulan:</span> {{ $order->tanggal_usulan->translatedFormat('d M Y, H:i') }} WIB</p>
            <p><span class="font-extrabold">Total:</span> Rp{{ number_format($order->total_harga, 0, ',', '.') }} ({{ $order->estimasi_menit }} mnt)</p>
        </div>
        <p class="text-xs text-gray-400 font-bold mb-4">Chat WhatsApp seharusnya sudah terbuka otomatis. Jika belum, klik tombol di bawah:</p>
        <a href="{{ $waLink }}" target="_blank" class="block w-full py-3.5 rounded-2xl bg-[#25D366] text-white font-extrabold text-sm shadow-lg hover:brightness-95 transition-all mb-3">
            <i class="fa-brands fa-whatsapp text-lg mr-2"></i>Buka WhatsApp Pengelola
        </a>
        <a href="{{ route('home') }}" class="block w-full py-3 rounded-2xl bg-lavender-50 text-lavender-600 font-extrabold text-sm hover:bg-lavender-100 transition-all">Kembali ke Beranda</a>
    </div>
</div>
@endsection
