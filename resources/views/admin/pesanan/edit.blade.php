@extends('layouts.admin')
@section('title', "Ubah Order #{$order->id}")

@section('content')
<div class="h-full overflow-y-auto pr-1 pt-2 pb-6 max-w-3xl">
    <a href="{{ route('admin.pesanan.show', $order) }}" class="text-xs font-extrabold text-lavender-500">← Kembali ke detail</a>
    <h1 class="text-2xl font-extrabold text-gray-800 mt-1">Ubah Pesanan #{{ $order->id }}</h1>

    <form method="POST" action="{{ route('admin.pesanan.update', $order) }}" class="bg-white rounded-3xl shadow-card border border-lavender-50 p-6 mt-4 space-y-4">
        @csrf @method('PUT')
        <div class="grid sm:grid-cols-2 gap-4">
            <div>
                <label class="block text-xs font-extrabold text-gray-600 mb-1">Nama</label>
                <input type="text" name="customer_name" value="{{ old('customer_name', $order->customer_name) }}" required class="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold">
            </div>
            <div>
                <label class="block text-xs font-extrabold text-gray-600 mb-1">Tanggal & Jam Usulan</label>
                <div class="grid grid-cols-2 gap-2">
                    <input type="date" name="tanggal_usulan" value="{{ old('tanggal_usulan', $order->tanggal_usulan->format('Y-m-d')) }}" required class="min-w-0 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold">
                    <input type="time" name="jam_usulan" min="{{ $setting->jam_mulai }}" max="{{ $setting->jam_selesai }}" value="{{ old('jam_usulan', $order->tanggal_usulan->format('H:i')) }}" required class="min-w-0 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold">
                </div>
            </div>
        </div>
        <div>
            <label class="block text-xs font-extrabold text-gray-600 mb-1">Alamat</label>
            <textarea name="alamat" rows="2" required class="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold">{{ old('alamat', $order->alamat) }}</textarea>
        </div>
        <div>
            <label class="block text-xs font-extrabold text-gray-600 mb-1">Catatan Admin</label>
            <input type="text" name="catatan_admin" value="{{ old('catatan_admin', $order->catatan_admin) }}" class="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold">
        </div>
        <div>
            <label class="block text-xs font-extrabold text-gray-600 mb-2">Item Layanan</label>
            <div id="itemRows" class="space-y-2"></div>
            <button type="button" onclick="addRow()" class="mt-2 px-4 py-2 rounded-full bg-lavender-50 text-lavender-600 text-xs font-extrabold">+ Tambah Item</button>
        </div>
        <button class="w-full py-3 rounded-2xl bg-lavender-600 text-white font-extrabold text-sm">Simpan Perubahan</button>
    </form>
</div>
@endsection

@push('scripts')
<script>
const services = {!! $servicesJson !!};
const existing = {!! $existingJson !!};
function addRow(sid='', qty=1){
    const div = document.createElement('div');
    div.className = 'flex flex-col min-[420px]:flex-row gap-2';
    div.innerHTML = `<select name="items[][service_id]" class="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold">${services.map(s=>`<option value="${s.id}" ${s.id==sid?'selected':''}>${s.name} - Rp${s.price.toLocaleString('id-ID')}</option>`).join('')}</select>
    <div class="flex gap-2">
    <input type="number" name="items[][qty]" value="${qty}" min="1" max="20" class="flex-1 min-[420px]:w-20 min-[420px]:flex-none px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold">
    <button type="button" onclick="this.parentElement.parentElement.remove()" class="px-4 min-[420px]:px-3 rounded-xl bg-red-50 text-red-500 font-bold">×</button>
    </div>`;
    document.getElementById('itemRows').appendChild(div);
}
(existing.length ? existing : [{service_id: services[0]?.id, qty: 1}]).forEach(e => addRow(e.service_id, e.qty));
</script>
@endpush
