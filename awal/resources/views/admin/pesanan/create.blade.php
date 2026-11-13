@extends('layouts.admin')
@section('title', 'Buat Jadwal Manual - Bersihinkost')

@section('content')
<div class="h-full overflow-y-auto pr-1 pt-2 pb-6 max-w-3xl">
    <a href="{{ route('admin.pesanan.index') }}" class="text-xs font-extrabold text-lavender-500">← Kembali ke daftar</a>
    <h1 class="text-2xl font-extrabold text-gray-800 mt-1">Buat Jadwal Manual</h1>
    <p class="text-sm font-bold text-lavender-500">Order walk-in / telepon — langsung tercatat <span class="text-emerald-500">Confirmed</span></p>

    <form method="POST" action="{{ route('admin.pesanan.manual') }}" class="bg-white rounded-3xl shadow-card border border-lavender-50 p-6 mt-4 space-y-4">
        @csrf
        <div class="grid sm:grid-cols-2 gap-4">
            <div>
                <label class="block text-xs font-extrabold text-gray-600 mb-1">Nama Pemesan <span class="text-peach-500">*</span></label>
                <input type="text" name="customer_name" value="{{ old('customer_name') }}" required class="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold">
            </div>
            <div>
                <label class="block text-xs font-extrabold text-gray-600 mb-1">Tanggal & Jam Pengerjaan (fix) <span class="text-peach-500">*</span></label>
                <div class="grid grid-cols-2 gap-2">
                    <input type="date" name="tanggal_fix" value="{{ old('tanggal_fix', date('Y-m-d')) }}" required class="min-w-0 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold">
                    <input type="time" name="jam_fix" min="{{ $setting->jam_mulai }}" max="{{ $setting->jam_selesai }}" value="{{ old('jam_fix', '09:00') }}" required class="min-w-0 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold">
                </div>
            </div>
        </div>
        <div>
            <label class="block text-xs font-extrabold text-gray-600 mb-1">Alamat Kost / Kamar <span class="text-peach-500">*</span></label>
            <textarea name="alamat" rows="2" required class="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold">{{ old('alamat') }}</textarea>
        </div>
        <div>
            <label class="block text-xs font-extrabold text-gray-600 mb-2">Item Layanan</label>
            <div id="itemRows" class="space-y-2"></div>
            <button type="button" onclick="addRow()" class="mt-2 px-4 py-2 rounded-full bg-lavender-50 text-lavender-600 text-xs font-extrabold">+ Tambah Item</button>
        </div>
        <button class="w-full py-3 rounded-2xl bg-lavender-600 text-white font-extrabold text-sm">Simpan Jadwal</button>
    </form>
</div>
@endsection

@push('scripts')
<script>
const services = {!! $servicesJson !!};
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
addRow(services[0]?.id ?? '', 1);
</script>
@endpush
