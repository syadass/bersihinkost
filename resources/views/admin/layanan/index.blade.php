@extends('layouts.admin')
@section('title', 'Kelola Layanan & Harga - Bersihinkost')

@section('content')
<!-- Header -->
<header class="flex flex-col gap-3 mb-5 sm:mb-6 pt-2">
    <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">Kelola Layanan & Harga</h1>
        <p class="text-xs sm:text-sm font-bold text-lavender-500">Tambah, ubah, atau atur daftar jasa pembersihan kost</p>
    </div>

    <div class="flex flex-col min-[520px]:flex-row min-[520px]:items-center gap-2">
        <!-- Search -->
        <form method="GET" action="{{ route('admin.layanan.index') }}" class="relative flex-1 min-w-0">
            @if(($category ?? 'all') !== 'all')
                <input type="hidden" name="category" value="{{ $category }}">
            @endif
            <span class="absolute inset-y-0 left-0 flex items-center pl-5 text-gray-400">
                <i class="fa-solid fa-magnifying-glass text-xs"></i>
            </span>
            <input type="text" name="search" value="{{ $search ?? '' }}" placeholder="Cari layanan..." class="w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-3xl bg-white border-none shadow-card text-sm font-bold text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lavender-400 transition-all">
        </form>

        <div class="flex items-center gap-2 shrink-0">
            <!-- Button Kelola Kategori -->
            <button onclick="openCategoryModal()" class="flex-1 min-[520px]:flex-none px-4 sm:px-5 py-3 sm:py-3.5 rounded-3xl bg-white text-lavender-600 border border-lavender-200 font-extrabold text-xs sm:text-sm shadow-card hover:bg-lavender-50 transition-all flex items-center justify-center gap-2 whitespace-nowrap" title="Kelola kategori">
                <i class="fa-solid fa-tags text-xs"></i> <span class="hidden min-[380px]:inline">Kelola Kategori</span><span class="min-[380px]:hidden">Kategori</span>
            </button>

            <!-- Button Tambah Layanan -->
            <button onclick="openModal()" class="flex-1 min-[520px]:flex-none px-4 sm:px-5 py-3 sm:py-3.5 rounded-3xl bg-lavender-600 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-lavender-200 hover:bg-lavender-700 transition-all flex items-center justify-center gap-2 whitespace-nowrap">
                <i class="fa-solid fa-plus text-xs"></i> Tambah
            </button>

            <!-- Owner Profile -->
            <div class="hidden min-[520px]:flex items-center gap-3 bg-white pl-3 pr-5 py-2 rounded-full shadow-card border border-lavender-100 shrink-0">
                <div class="w-10 h-10 rounded-full bg-peach-100 text-peach-600 flex items-center justify-center font-extrabold border-2 border-white shadow-sm">
                    {{ strtoupper(substr(auth()->user()->name, 0, 1)) }}{{ strtoupper(substr(explode(' ', auth()->user()->name)[1] ?? '', 0, 1)) }}
                </div>
                <div class="hidden lg:block">
                    <p class="text-sm font-extrabold text-gray-800 leading-tight">{{ auth()->user()->name }}</p>
                    <p class="text-[10px] font-extrabold text-peach-500 uppercase tracking-wider">Solo Operator</p>
                </div>
            </div>
        </div>
    </div>
</header>

@php
$catActiveCls = 'px-5 py-2.5 rounded-full bg-lavender-600 text-white font-bold text-sm shadow-md flex items-center gap-2 whitespace-nowrap transition-transform hover:scale-105';
$catIdleCls = 'px-5 py-2.5 rounded-full bg-white text-gray-600 font-bold text-sm shadow-card hover:bg-lavender-50 hover:text-lavender-600 transition-all flex items-center gap-2 whitespace-nowrap';
@endphp

<!-- Category Filter Pills -->
<div class="flex gap-2 sm:gap-3 mb-4 sm:mb-5 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
    <a href="{{ route('admin.layanan.index', array_filter(['search' => $search ?? null])) }}" class="{{ ($category ?? 'all') === 'all' ? $catActiveCls : $catIdleCls }}">
        <i class="fa-solid fa-layer-group text-xs"></i> Semua ({{ ($categories ?? collect())->sum('services_count') }})
    </a>
    @foreach($categories ?? [] as $c)
        <a href="{{ route('admin.layanan.index', array_filter(['category' => $c->name, 'search' => $search ?? null])) }}" class="{{ ($category ?? '') === $c->name ? $catActiveCls : $catIdleCls }}">
            {{ $c->name }} ({{ $c->services_count }})
        </a>
    @endforeach
</div>

<!-- Services Grid Container -->
<div class="flex-1 overflow-y-auto pb-6 pr-2 min-h-0">
    @if(!empty($search) || ($category ?? 'all') !== 'all')
        <div class="flex items-center gap-3 mb-4">
            <p class="text-xs font-bold text-gray-400">
                {{ $services->count() }} hasil
                @if(!empty($search)) untuk "<span class="text-gray-700">{{ $search }}</span>" @endif
                @if(($category ?? 'all') !== 'all') di kategori "<span class="text-gray-700">{{ $category }}</span>" @endif
            </p>
            <a href="{{ route('admin.layanan.index') }}" class="text-xs font-extrabold text-red-500 hover:underline">Reset</a>
        </div>
    @endif
    <div id="servicesGrid" class="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
        @foreach($services as $s)
            <div class="bg-white p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-card border border-lavender-50 flex flex-col justify-between group hover:shadow-lg transition-all min-w-0">
                <div class="min-w-0">
                    <div class="w-full h-24 sm:h-36 rounded-xl sm:rounded-2xl mb-2 sm:mb-3 overflow-hidden relative bg-lavender-50">
                        @if($s->image_src)
                            <img src="{{ $s->image_src }}" alt="{{ $s->name }}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                        @else
                            <div class="w-full h-full flex items-center justify-center text-lavender-300 text-4xl">
                                <i class="fa-solid fa-broom"></i>
                            </div>
                        @endif
                        <div class="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-extrabold text-lavender-700 shadow-sm">
                            <i class="fa-regular fa-clock mr-1"></i>{{ $s->duration_minutes }} Menit
                        </div>
                        <span class="absolute top-2 left-2 bg-lavender-600 text-white px-2.5 py-1 rounded-full text-[10px] font-extrabold shadow-sm">
                            {{ $s->category }}
                        </span>
                        @if(! $s->is_active)
                            <span class="absolute bottom-2 left-2 bg-gray-800/80 text-white px-2.5 py-1 rounded-full text-[10px] font-extrabold shadow-sm">NONAKTIF</span>
                        @endif
                    </div>
                    <h3 class="text-xs sm:text-base font-extrabold text-gray-800 mb-0.5 sm:mb-1 leading-tight line-clamp-2">{{ $s->name }}</h3>
                    <p class="text-sm sm:text-lg font-extrabold text-peach-500 mb-2 sm:mb-4 truncate">Rp{{ number_format($s->price, 0, ',', '.') }}</p>
                </div>

                <div class="flex gap-1.5 sm:gap-2 pt-2 sm:pt-3 border-t border-gray-100">
                    <button onclick='editService({{ $s->id }})' class="flex-1 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-lavender-50 text-lavender-600 text-[11px] sm:text-xs font-extrabold hover:bg-lavender-100 transition-colors flex items-center justify-center gap-1.5 min-w-0">
                        <i class="fa-solid fa-pen-to-square"></i> <span class="hidden min-[380px]:inline">Ubah</span>
                    </button>
                    <form method="POST" action="{{ route('admin.layanan.destroy', $s) }}" data-confirm="Layanan &quot;{{ $s->name }}&quot; akan dihapus/dinonaktifkan." data-confirm-title="Hapus Layanan?" data-confirm-ok="Ya, Hapus" data-confirm-tone="red" data-confirm-icon="fa-trash-can">
                        @csrf @method('DELETE')
                        <button class="w-10 py-2.5 rounded-xl bg-red-50 text-red-500 text-xs font-extrabold hover:bg-red-100 transition-colors flex items-center justify-center" title="Hapus Layanan">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </form>
                </div>
            </div>
        @endforeach
    </div>

    @if($services->isEmpty())
        <div class="flex flex-col items-center justify-center text-center py-16 bg-white rounded-3xl shadow-card border border-lavender-50 mt-5">
            <div class="w-20 h-20 rounded-full bg-lavender-50 text-lavender-300 flex items-center justify-center text-3xl mb-3 border-2 border-dashed border-lavender-200">
                <i class="fa-solid fa-list-check"></i>
            </div>
            <p class="text-base font-extrabold text-gray-700">Belum ada layanan</p>
            <p class="text-xs font-medium text-gray-400 mt-1">Klik "Tambah Layanan Baru" untuk membuat yang pertama</p>
        </div>
    @endif
</div>

<!-- Modal Form Tambah/Edit Layanan -->
<div id="serviceModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 hidden flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
    <div class="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] shadow-float w-full max-w-md p-5 sm:p-7 border border-lavender-50 relative my-auto max-h-[92vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-5">
            <h3 id="modalTitle" class="text-xl font-extrabold text-gray-800">Tambah Layanan Baru</h3>
            <button onclick="closeModal()" class="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <i class="fa-solid fa-xmark text-sm"></i>
            </button>
        </div>

        <form id="serviceForm" method="POST" action="{{ route('admin.layanan.store') }}" enctype="multipart/form-data" class="space-y-4">
            @csrf
            <span id="methodSlot"></span>
            <div>
                <label class="block text-xs font-extrabold text-gray-600 mb-1">Nama Layanan</label>
                <input type="text" id="serviceName" name="name" required placeholder="Contoh: Vacuum Kasur" class="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
            </div>
            <div>
                <label class="block text-xs font-extrabold text-gray-600 mb-1">Kategori</label>
                @if(count($categoryNames ?? []) > 0)
                    <select id="serviceCategory" name="category" required class="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                        @foreach($categoryNames as $cn)
                            <option value="{{ $cn }}">{{ $cn }}</option>
                        @endforeach
                    </select>
                    <p class="text-[11px] font-semibold text-gray-400 mt-1">Kategori baru? Tambahkan dulu lewat tombol "Atur Kategori".</p>
                @else
                    <p class="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">Belum ada kategori. <button type="button" onclick="closeModal(); openCategoryModal();" class="underline font-extrabold">Tambah kategori dulu</button>.</p>
                @endif
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs font-extrabold text-gray-600 mb-1">Tarif (Rp)</label>
                    <input type="number" id="servicePrice" name="price" required min="0" placeholder="50000" class="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                </div>
                <div>
                    <label class="block text-xs font-extrabold text-gray-600 mb-1">Durasi (menit)</label>
                    <input type="number" id="serviceDuration" name="duration_minutes" required min="5" max="480" placeholder="45" class="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                </div>
            </div>
            <div>
                <label class="block text-xs font-extrabold text-gray-600 mb-2">Gambar Layanan <span class="font-semibold text-gray-400">(opsional)</span></label>
                <div class="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-gray-100 mb-3">
                    <button type="button" id="tabUrl" onclick="setImageMode('url')" class="py-2 rounded-xl text-xs font-extrabold bg-white text-lavender-600 shadow-sm transition-all">Link URL</button>
                    <button type="button" id="tabUpload" onclick="setImageMode('upload')" class="py-2 rounded-xl text-xs font-extrabold text-gray-400 transition-all">Unggah File</button>
                </div>
                <div id="paneUrl">
                    <input type="url" id="serviceImageUrl" name="image_url" placeholder="https://images.unsplash.com/..." class="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                </div>
                <div id="paneUpload" class="hidden">
                    <label for="serviceImageFile" class="block cursor-pointer px-4 py-6 rounded-2xl bg-gray-50 border-2 border-dashed border-lavender-200 text-center hover:bg-lavender-50 transition-colors">
                        <i class="fa-solid fa-cloud-arrow-up text-2xl text-lavender-400"></i>
                        <p id="uploadHint" class="text-xs font-extrabold text-gray-600 mt-2">Klik untuk pilih gambar (JPG/PNG/WebP, maks 2MB)</p>
                    </label>
                    <input type="file" id="serviceImageFile" name="image_file" accept="image/jpeg,image/png,image/webp" class="hidden">
                </div>
                <div id="imagePreviewWrap" class="hidden mt-3 relative">
                    <img id="imagePreview" src="" alt="Pratinjau" class="w-full h-32 rounded-2xl object-cover border border-gray-200">
                    <button type="button" onclick="clearImageInput()" class="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80" title="Hapus gambar">
                        <i class="fa-solid fa-xmark text-xs"></i>
                    </button>
                </div>
                <label id="hapusGambarWrap" class="hidden items-center gap-2 text-xs font-extrabold text-red-500 mt-2">
                    <input type="checkbox" name="hapus_gambar" value="1" class="w-4 h-4 accent-red-500"> Hapus gambar saat ini
                </label>
            </div>
            <label class="flex items-center gap-2 text-xs font-extrabold text-gray-600">
                <input type="checkbox" id="serviceActive" name="is_active" value="1" checked class="w-4 h-4 accent-purple-600"> Tampilkan di halaman publik
            </label>

            <div class="pt-4 flex gap-3">
                <button type="button" onclick="closeModal()" class="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-600 font-extrabold text-sm hover:bg-gray-200 transition-colors">Batal</button>
                <button type="submit" class="flex-1 py-3.5 rounded-2xl bg-lavender-600 text-white font-extrabold text-sm shadow-md hover:bg-lavender-700 transition-all">Simpan</button>
            </div>
        </form>
    </div>
</div>
<!-- Modal Kelola Kategori -->
<div id="categoryModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 hidden flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
    <div class="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] shadow-float w-full max-w-lg p-5 sm:p-7 border border-lavender-50 relative my-auto max-h-[92vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-5">
            <div>
                <h3 class="text-xl font-extrabold text-gray-800">Kelola Kategori Layanan</h3>
                <p class="text-xs font-semibold text-gray-400">Tambah, ubah, atau hapus kategori</p>
            </div>
            <button onclick="closeCategoryModal()" class="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <i class="fa-solid fa-xmark text-sm"></i>
            </button>
        </div>

        <!-- Form Tambah / Edit Kategori -->
        <form id="categoryForm" method="POST" action="{{ route('admin.layanan.storeCategory') }}" class="bg-lavender-50/50 p-4 rounded-2xl border border-lavender-100 mb-5 flex gap-2">
            @csrf
            <span id="categoryMethodSlot"></span>
            <input type="hidden" id="categoryOld" name="old" value="">
            <input type="text" id="categoryNameInput" name="name" required maxlength="50" placeholder="Nama Kategori Baru..." class="flex-1 min-w-0 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
            <button type="submit" id="categorySubmitBtn" class="px-5 py-2.5 rounded-xl bg-lavender-600 text-white font-extrabold text-xs shadow-md hover:bg-lavender-700 transition-all whitespace-nowrap">
                Tambah
            </button>
            <button type="button" id="categoryCancelBtn" onclick="resetCategoryForm()" class="hidden px-3 py-2.5 rounded-xl bg-gray-200 text-gray-600 font-extrabold text-xs hover:bg-gray-300 transition-all whitespace-nowrap">
                Batal
            </button>
        </form>

        <!-- List Kategori -->
        <div class="max-h-60 overflow-y-auto space-y-2 pr-1">
            @forelse($categories ?? [] as $c)
                <div class="bg-gray-50 px-4 py-3 rounded-2xl flex items-center justify-between border border-gray-100">
                    <span class="text-sm font-extrabold text-gray-800">{{ $c->name }} <span class="text-[10px] font-extrabold text-gray-400">({{ $c->services_count }})</span></span>
                    <div class="flex items-center gap-2">
                        <button onclick="editCategory(@js($c->name))" class="px-3 py-1.5 rounded-xl bg-lavender-50 text-lavender-600 text-xs font-extrabold hover:bg-lavender-100 transition-colors">
                            <i class="fa-solid fa-pen mr-1"></i> Ubah
                        </button>
                        <form method="POST" action="{{ route('admin.layanan.deleteCategory') }}" data-confirm="Kategori &quot;{{ $c->name }}&quot; akan dihapus dari daftar." data-confirm-title="Hapus Kategori?" data-confirm-ok="Ya, Hapus" data-confirm-tone="red" data-confirm-icon="fa-trash-can" class="inline">
                            @csrf @method('DELETE')
                            <input type="hidden" name="category" value="{{ $c->name }}">
                            <button class="px-3 py-1.5 rounded-xl bg-red-50 text-red-500 text-xs font-extrabold hover:bg-red-100 transition-colors">
                                <i class="fa-solid fa-trash-can mr-1"></i> Hapus
                            </button>
                        </form>
                    </div>
                </div>
            @empty
                <p class="text-center text-xs text-gray-400 py-4 font-bold">Belum ada kategori.</p>
            @endforelse
        </div>

        <div class="mt-6 pt-4 border-t border-gray-100 text-right">
            <button type="button" onclick="closeCategoryModal()" class="px-6 py-3 rounded-2xl bg-lavender-600 text-white font-extrabold text-xs shadow-md hover:bg-lavender-700 transition-all">
                Selesai
            </button>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
    const servicesData = @json($servicesData);
    const serviceModal = document.getElementById('serviceModal');
    const modalTitle = document.getElementById('modalTitle');
    const serviceForm = document.getElementById('serviceForm');
    const methodSlot = document.getElementById('methodSlot');
    const storeUrl = "{{ route('admin.layanan.store') }}";
    const updateUrlTpl = "{{ route('admin.layanan.update', ['service' => '__ID__']) }}";

    const tabUrl = document.getElementById('tabUrl');
    const tabUpload = document.getElementById('tabUpload');
    const paneUrl = document.getElementById('paneUrl');
    const paneUpload = document.getElementById('paneUpload');
    const imageUrlInput = document.getElementById('serviceImageUrl');
    const imageFileInput = document.getElementById('serviceImageFile');
    const previewWrap = document.getElementById('imagePreviewWrap');
    const previewImg = document.getElementById('imagePreview');
    const uploadHint = document.getElementById('uploadHint');
    const hapusGambarWrap = document.getElementById('hapusGambarWrap');
    const tabOn = 'py-2 rounded-xl text-xs font-extrabold bg-white text-lavender-600 shadow-sm transition-all';
    const tabOff = 'py-2 rounded-xl text-xs font-extrabold text-gray-400 transition-all';

    function setImageMode(mode) {
        const isUrl = mode === 'url';
        paneUrl.classList.toggle('hidden', !isUrl);
        paneUpload.classList.toggle('hidden', isUrl);
        tabUrl.className = isUrl ? tabOn : tabOff;
        tabUpload.className = isUrl ? tabOff : tabOn;
        if (isUrl) { imageFileInput.value = ''; uploadHint.innerText = 'Klik untuk pilih gambar (JPG/PNG/WebP, maks 2MB)'; }
        else { imageUrlInput.value = ''; }
        updatePreview();
    }

    function updatePreview(src) {
        const url = src !== undefined ? src : imageUrlInput.value.trim();
        if (url) { previewImg.src = url; previewWrap.classList.remove('hidden'); }
        else previewWrap.classList.add('hidden');
    }

    function clearImageInput() {
        imageUrlInput.value = '';
        imageFileInput.value = '';
        uploadHint.innerText = 'Klik untuk pilih gambar (JPG/PNG/WebP, maks 2MB)';
        updatePreview('');
    }

    imageUrlInput?.addEventListener('input', () => updatePreview());
    imageFileInput?.addEventListener('change', () => {
        const f = imageFileInput.files[0];
        if (!f) return;
        uploadHint.innerText = f.name;
        const reader = new FileReader();
        reader.onload = e => { previewImg.src = e.target.result; previewWrap.classList.remove('hidden'); };
        reader.readAsDataURL(f);
    });

    function openModal() {
        modalTitle.innerText = 'Tambah Layanan Baru';
        serviceForm.action = storeUrl;
        methodSlot.innerHTML = '';
        serviceForm.reset();
        document.getElementById('serviceActive').checked = true;
        hapusGambarWrap.classList.add('hidden');
        hapusGambarWrap.classList.remove('flex');
        setImageMode('url');
        updatePreview('');
        serviceModal.classList.remove('hidden');
    }

    function closeModal() {
        serviceModal.classList.add('hidden');
    }

    function editService(id) {
        const s = servicesData.find(x => x.id == id);
        if (!s) return;
        modalTitle.innerText = 'Ubah Layanan & Harga';
        serviceForm.action = updateUrlTpl.replace('__ID__', s.id);
        methodSlot.innerHTML = '@method("PUT")';
        document.getElementById('serviceName').value = s.name;
        document.getElementById('serviceCategory').value = s.category;
        document.getElementById('servicePrice').value = s.price;
        document.getElementById('serviceDuration').value = s.duration_minutes;
        document.getElementById('serviceActive').checked = !!s.is_active;
        // Gambar saat ini
        imageUrlInput.value = '';
        imageFileInput.value = '';
        uploadHint.innerText = 'Klik untuk pilih gambar (JPG/PNG/WebP, maks 2MB)';
        const hasImage = !!(s.image_src);
        const isRemote = hasImage && s.image_url && s.image_url.indexOf('http') === 0;
        setImageMode(isRemote || !hasImage ? 'url' : 'upload');
        if (hasImage) {
            if (isRemote) imageUrlInput.value = s.image_url;
            else uploadHint.innerText = 'File tersimpan — pilih file baru untuk mengganti';
            previewImg.src = s.image_src;
            previewWrap.classList.remove('hidden');
        } else updatePreview('');
        if (hasImage) { hapusGambarWrap.classList.remove('hidden'); hapusGambarWrap.classList.add('flex'); }
        else { hapusGambarWrap.classList.add('hidden'); hapusGambarWrap.classList.remove('flex'); }
        serviceModal.classList.remove('hidden');
    }

    const categoryForm = document.getElementById('categoryForm');
    const categoryMethodSlot = document.getElementById('categoryMethodSlot');
    const categoryOldInput = document.getElementById('categoryOld');
    const categoryNameInput = document.getElementById('categoryNameInput');
    const categorySubmitBtn = document.getElementById('categorySubmitBtn');
    const categoryCancelBtn = document.getElementById('categoryCancelBtn');
    const storeCategoryUrl = "{{ route('admin.layanan.storeCategory') }}";
    const renameCategoryUrl = "{{ route('admin.layanan.renameCategory') }}";

    function openCategoryModal() {
        resetCategoryForm();
        document.getElementById('categoryModal').classList.remove('hidden');
    }
    function closeCategoryModal() {
        document.getElementById('categoryModal').classList.add('hidden');
    }
    function editCategory(name) {
        categoryForm.action = renameCategoryUrl;
        categoryMethodSlot.innerHTML = '@method("PUT")';
        categoryOldInput.value = name;
        categoryNameInput.value = name;
        categoryNameInput.name = 'new';
        categorySubmitBtn.innerText = 'Perbarui';
        categoryCancelBtn.classList.remove('hidden');
        categoryNameInput.focus();
    }
    function resetCategoryForm() {
        categoryForm.action = storeCategoryUrl;
        categoryMethodSlot.innerHTML = '';
        categoryOldInput.value = '';
        categoryNameInput.value = '';
        categoryNameInput.name = 'name';
        categorySubmitBtn.innerText = 'Tambah';
        categoryCancelBtn.classList.add('hidden');
    }

    serviceModal?.addEventListener('click', e => { if (e.target === serviceModal) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeCategoryModal(); } });
    document.getElementById('categoryModal')?.addEventListener('click', e => { if (e.target.id === 'categoryModal') closeCategoryModal(); });
</script>
@endpush
