@extends('layouts.admin')
@section('title', 'Pengaturan Sistem - Bersihinkost')

@section('content')
<!-- Header -->
<header class="max-w-4xl w-full mx-auto flex flex-col gap-3 mb-5 sm:mb-6 pt-2">
    <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">Pengaturan Sistem</h1>
        <p class="text-xs sm:text-sm font-bold text-lavender-500">Kelola profil usaha, kontak WhatsApp, dan jam operasional</p>
    </div>

    <div class="flex items-center gap-4">
        <!-- Owner Profile -->
        <div class="flex items-center gap-3 bg-white pl-3 pr-5 py-2 rounded-full shadow-card border border-lavender-100">
            <div class="w-10 h-10 rounded-full bg-peach-100 text-peach-600 flex items-center justify-center font-extrabold border-2 border-white shadow-sm">
                {{ strtoupper(substr(auth()->user()->name, 0, 1)) }}{{ strtoupper(substr(explode(' ', auth()->user()->name)[1] ?? '', 0, 1)) }}
            </div>
            <div>
                <p class="text-sm font-extrabold text-gray-800 leading-tight">{{ auth()->user()->name }}</p>
                <p class="text-[10px] font-extrabold text-peach-500 uppercase tracking-wider">Solo Operator</p>
            </div>
        </div>
    </div>
</header>

<!-- Settings Container -->
<div class="flex-1 overflow-y-auto pb-6 sm:pr-2 min-h-0">
    <div class="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

        <!-- Card 1: Profil Usaha & Kontak -->
        <form method="POST" action="{{ route('admin.pengaturan.profil') }}" class="bg-white p-4 sm:p-6 rounded-3xl shadow-card border border-lavender-50 flex flex-col justify-between min-w-0">
            @csrf @method('PUT')
            <div>
                <div class="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                    <div class="w-10 h-10 rounded-2xl bg-lavender-50 text-lavender-600 flex items-center justify-center font-bold">
                        <i class="fa-solid fa-store"></i>
                    </div>
                    <div>
                        <h3 class="text-base font-extrabold text-gray-800">Profil Usaha & Kontak</h3>
                        <p class="text-xs font-semibold text-gray-400">Informasi yang tampil di web publik</p>
                    </div>
                </div>

                <div class="space-y-4">
                    <div>
                        <label class="block text-xs font-extrabold text-gray-600 mb-1">Nama Usaha</label>
                        <input type="text" name="business_name" value="{{ old('business_name', $setting->business_name) }}" required maxlength="100" class="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                    </div>
                    <div>
                        <label class="block text-xs font-extrabold text-gray-600 mb-1">Nama Pengelola (Solo Operator)</label>
                        <input type="text" name="operator_name" value="{{ old('operator_name', $setting->operator_name) }}" required class="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                    </div>
                    <div>
                        <label class="block text-xs font-extrabold text-gray-600 mb-1">Nomor WhatsApp (Penerima Pesanan)</label>
                        <input type="text" name="admin_wa_number" value="{{ old('admin_wa_number', $setting->admin_wa_number) }}" required class="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                        <p class="text-[11px] text-gray-400 font-bold mt-1">Format 628... Semua tombol "Pesan via WhatsApp" mengarah ke nomor ini.</p>
                    </div>
                </div>
            </div>

            <div class="mt-6 pt-4 border-t border-gray-100">
                <button class="w-full py-3.5 rounded-2xl bg-lavender-600 text-white font-extrabold text-sm shadow-md hover:bg-lavender-700 transition-all">
                    Simpan Perubahan Profil
                </button>
            </div>
        </form>

        <!-- Card 2: Jam Operasional & Status Layanan -->
        <form method="POST" action="{{ route('admin.pengaturan.operasional') }}" class="bg-white p-4 sm:p-6 rounded-3xl shadow-card border border-lavender-50 flex flex-col justify-between min-w-0">
            @csrf @method('PUT')
            <div>
                <div class="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                    <div class="w-10 h-10 rounded-2xl bg-peach-50 text-peach-600 flex items-center justify-center font-bold">
                        <i class="fa-solid fa-clock"></i>
                    </div>
                    <div>
                        <h3 class="text-base font-extrabold text-gray-800">Jam Operasional</h3>
                        <p class="text-xs font-semibold text-gray-400">Atur ketersediaan layanan harian</p>
                    </div>
                </div>

                <div class="space-y-4">
                    <div>
                        <label class="block text-xs font-extrabold text-gray-600 mb-1">Status Pengerjaan Harian</label>
                        <select id="statusSelect" class="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                            <option value="open" {{ old('is_open', $setting->is_open) ? 'selected' : '' }}>Buka (Menerima Pesanan)</option>
                            <option value="closed" {{ ! old('is_open', $setting->is_open) ? 'selected' : '' }}>Tutup (Sedang Libur / Istirahat)</option>
                        </select>
                        <input type="hidden" name="is_open" id="isOpenHidden" value="{{ old('is_open', $setting->is_open) ? 1 : 0 }}">
                        <label class="flex items-center gap-2 text-xs font-extrabold text-gray-500 mt-2">
                            <input type="checkbox" id="isOpenCheck" @checked(old('is_open', $setting->is_open)) class="w-4 h-4 accent-purple-600"> Tampilkan badge "Buka Hari Ini" di halaman umum
                        </label>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div class="col-span-1">
                            <label class="block text-xs font-extrabold text-gray-600 mb-1">Jam Mulai</label>
                            <input type="time" name="jam_mulai" value="{{ old('jam_mulai', $setting->jam_mulai) }}" required class="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                        </div>
                        <div class="col-span-1">
                            <label class="block text-xs font-extrabold text-gray-600 mb-1">Jam Selesai</label>
                            <input type="time" name="jam_selesai" value="{{ old('jam_selesai', $setting->jam_selesai) }}" required class="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-extrabold text-gray-600 mb-1">Catatan Khusus untuk Pemesan</label>
                        <textarea name="catatan_publik" rows="2" maxlength="500" placeholder="Info tambahan di halaman pemesanan..." class="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">{{ old('catatan_publik', $setting->catatan_publik) }}</textarea>
                    </div>
                </div>
            </div>

            <div class="mt-6 pt-4 border-t border-gray-100">
                <button class="w-full py-3.5 rounded-2xl bg-peach-500 text-white font-extrabold text-sm shadow-md hover:bg-peach-600 transition-all">
                    Simpan Jam Operasional
                </button>
            </div>
        </form>

        <!-- Card 3: Tanggal Libur / Tutup -->
        <div class="md:col-span-2 bg-white p-4 sm:p-6 rounded-3xl shadow-card border border-lavender-50 min-w-0">
            <div class="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                <div class="w-10 h-10 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center font-bold">
                    <i class="fa-solid fa-calendar-xmark"></i>
                </div>
                <div>
                    <h3 class="text-base font-extrabold text-gray-800">Tanggal Libur / Tutup</h3>
                    <p class="text-xs font-semibold text-gray-400">Pemesan tidak bisa memilih tanggal-tanggal ini</p>
                </div>
            </div>
            <form method="POST" action="{{ route('admin.pengaturan.libur.store') }}" class="flex flex-col sm:flex-row gap-2 mb-4">
                @csrf
                <input type="date" name="tanggal" required min="{{ date('Y-m-d') }}" class="w-full sm:w-auto px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-300">
                <input type="text" name="keterangan" maxlength="100" placeholder="Keterangan (opsional, cth: Libur Lebaran)" class="flex-1 min-w-0 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-300">
                <button class="px-5 py-3 rounded-2xl bg-red-500 text-white font-extrabold text-sm shadow-md hover:bg-red-600 transition-all whitespace-nowrap">+ Tambah Libur</button>
            </form>
            <div class="flex flex-wrap gap-2">
                @forelse($liburDates as $l)
                    <span class="inline-flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full bg-red-50 border border-red-100 text-xs font-extrabold text-red-500">
                        {{ $l->tanggal->translatedFormat('d M Y') }}{{ $l->keterangan ? ' · ' . $l->keterangan : '' }}
                        <form action="{{ route('admin.pengaturan.libur.destroy', $l) }}" method="POST" class="inline-flex" data-confirm="Tanggal libur {{ $l->tanggal->translatedFormat('d M Y') }} akan dihapus." data-confirm-title="Hapus Libur?" data-confirm-ok="Ya, Hapus" data-confirm-tone="red" data-confirm-icon="fa-trash-can">
                            @csrf @method('DELETE')
                            <button class="w-6 h-6 rounded-full bg-white text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors font-bold" title="Hapus tanggal libur">×</button>
                        </form>
                    </span>
                @empty
                    <p class="text-xs font-bold text-gray-400">Belum ada tanggal libur. Semua tanggal bisa dipesan.</p>
                @endforelse
            </div>
        </div>
    </div>

    <!-- Akun Login -->
    <div class="max-w-4xl mx-auto bg-white rounded-3xl shadow-card border border-lavender-50 p-6 mt-6 text-sm font-bold text-gray-600">
        <div class="flex items-center justify-between gap-3 mb-2">
            <h3 class="font-extrabold text-gray-800">Akun Login</h3>
            <button type="button" onclick="openAccountModal()" class="px-4 py-2 rounded-full bg-lavender-50 text-lavender-600 text-xs font-extrabold hover:bg-lavender-100 transition-colors flex items-center gap-1.5">
                <i class="fa-solid fa-pen-to-square"></i> Ubah
            </button>
        </div>
        <p>Email: <span class="font-extrabold">{{ auth()->user()->email }}</span></p>
        <button type="button" onclick="askLogout()" class="mt-4 w-full py-3 rounded-2xl bg-red-50 text-red-500 font-extrabold text-sm hover:bg-red-100 transition-all"><i class="fa-solid fa-right-from-bracket mr-2"></i>Keluar dari Dashboard</button>
    </div>
</div>

<!-- Modal Ubah Akun -->
<div id="accountModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 hidden items-center justify-center p-4">
    <div class="bg-white rounded-[2rem] shadow-float w-full max-w-md border border-lavender-50 relative max-h-[90vh] flex flex-col overflow-hidden">
        <div class="flex justify-between items-center gap-3 p-5 border-b border-gray-100 shrink-0">
            <div>
                <h3 class="text-lg font-extrabold text-gray-800">Ubah Akun Login</h3>
                <p class="text-xs font-semibold text-gray-400">Nama, email, dan kata sandi — kosongkan sandi bila tidak diganti</p>
            </div>
            <button type="button" onclick="closeAccountModal()" class="w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 shrink-0">
                <i class="fa-solid fa-xmark text-sm"></i>
            </button>
        </div>
        <form id="accountForm" method="POST" action="{{ route('admin.pengaturan.akun') }}" class="overflow-y-auto p-5 space-y-4">
            @csrf @method('PUT')
            <div id="accountErrors" class="hidden bg-red-50 border border-red-200 text-red-500 text-xs font-bold px-4 py-3 rounded-2xl"></div>
            <div>
                <label class="block text-xs font-extrabold text-gray-600 mb-1">Nama Pengelola</label>
                <input type="text" name="name" value="{{ old('name', auth()->user()->name) }}" required maxlength="100" class="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
            </div>
            <div>
                <label class="block text-xs font-extrabold text-gray-600 mb-1">Email Login</label>
                <input type="email" name="email" value="{{ old('email', auth()->user()->email) }}" required maxlength="100" class="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
            </div>
            <div>
                <label class="block text-xs font-extrabold text-gray-600 mb-1">Ulangi Email Baru <span class="font-semibold text-gray-400">(wajib sama, anti typo)</span></label>
                <input type="email" name="email_confirmation" value="{{ old('email_confirmation', auth()->user()->email) }}" required maxlength="100" class="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs font-extrabold text-gray-600 mb-1">Kata Sandi Baru</label>
                    <div class="relative">
                        <input type="password" id="accPassword" name="password" minlength="8" placeholder="Min. 8 karakter" class="w-full pl-4 pr-11 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                        <button type="button" onclick="togglePw('accPassword', this)" title="Tampilkan sandi" class="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-lavender-600 transition-colors">
                            <i class="fa-solid fa-eye text-xs"></i>
                        </button>
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-extrabold text-gray-600 mb-1">Ulangi Sandi</label>
                    <div class="relative">
                        <input type="password" id="accPasswordConfirm" name="password_confirmation" minlength="8" placeholder="Ulangi sandi" class="w-full pl-4 pr-11 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                        <button type="button" onclick="togglePw('accPasswordConfirm', this)" title="Tampilkan sandi" class="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-lavender-600 transition-colors">
                            <i class="fa-solid fa-eye text-xs"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-2 pt-1">
                <button type="button" onclick="closeAccountModal()" class="py-3 rounded-2xl bg-gray-100 text-gray-600 font-extrabold text-sm hover:bg-gray-200 transition-colors">Batal</button>
                <button class="py-3 rounded-2xl bg-lavender-600 text-white font-extrabold text-sm shadow-md hover:bg-lavender-700 transition-all">Simpan Akun</button>
            </div>
        </form>
    </div>
</div>
@endsection

@push('scripts')
<script>
    // Sinkron: select status <-> checkbox <-> hidden is_open
    const statusSelect = document.getElementById('statusSelect');
    const isOpenCheck = document.getElementById('isOpenCheck');
    const isOpenHidden = document.getElementById('isOpenHidden');
    function syncFromSelect() {
        const open = statusSelect.value === 'open';
        isOpenCheck.checked = open;
        isOpenHidden.value = open ? 1 : 0;
    }
    function syncFromCheck() {
        statusSelect.value = isOpenCheck.checked ? 'open' : 'closed';
        isOpenHidden.value = isOpenCheck.checked ? 1 : 0;
    }
    statusSelect?.addEventListener('change', syncFromSelect);
    isOpenCheck?.addEventListener('change', syncFromCheck);

    // Modal Ubah Akun
    const accountModal = document.getElementById('accountModal');
    function togglePw(id, btn) {
        const input = document.getElementById(id);
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.innerHTML = `<i class="fa-solid ${show ? 'fa-eye-slash' : 'fa-eye'} text-xs"></i>`;
        btn.title = show ? 'Sembunyikan sandi' : 'Tampilkan sandi';
    }    function openAccountModal() {
        accountModal.classList.remove('hidden');
        accountModal.classList.add('flex');
    }
    function closeAccountModal() {
        accountModal.classList.add('hidden');
        accountModal.classList.remove('flex');
    }
    accountModal?.addEventListener('click', e => { if (e.target === accountModal) closeAccountModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && accountModal && !accountModal.classList.contains('hidden')) closeAccountModal(); });
    @if(collect(['name', 'email', 'password'])->intersect($errors->keys())->isNotEmpty())
        openAccountModal();
    @endif

    // Simpan akun via AJAX agar error tampil di dalam modal
    document.getElementById('accountForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const box = document.getElementById('accountErrors');
        const saveBtn = form.querySelector('button:not([type="button"])');
        const oldLabel = saveBtn.innerHTML;
        box.classList.add('hidden');
        box.innerHTML = '';
        saveBtn.disabled = true;
        saveBtn.innerText = 'Menyimpan...';
        try {
            const res = await fetch(form.action, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name=csrf-token]').content,
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: new FormData(form),
            });
            if (res.status === 422) {
                const data = await res.json();
                const msgs = Object.values(data.errors || {}).flat();
                const ul = document.createElement('ul');
                ul.className = 'list-disc pl-4 space-y-0.5';
                (msgs.length ? msgs : ['Gagal menyimpan. Periksa isian form.']).forEach(m => {
                    const li = document.createElement('li');
                    li.textContent = m;
                    ul.appendChild(li);
                });
                box.appendChild(ul);
                box.classList.remove('hidden');
                form.scrollTop = 0;
            } else if (res.ok) {
                window.location.reload();
            } else {
                box.textContent = 'Terjadi kesalahan. Silakan coba lagi.';
                box.classList.remove('hidden');
            }
        } catch (err) {
            box.textContent = 'Tidak dapat terhubung. Periksa koneksi internet.';
            box.classList.remove('hidden');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = oldLabel;
        }
    });
</script>
@endpush
