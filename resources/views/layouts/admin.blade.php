<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Bersihinkost Manager')</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        lavender: {50:'#f5f3ff',100:'#ede9fe',200:'#ddd6fe',300:'#c4b5fd',400:'#a78bfa',500:'#8b5cf6',600:'#7c3aed',700:'#6d28d9',800:'#5b21b6',900:'#4c1d95'},
                        peach: {50:'#fff1f2',100:'#ffe4e6',200:'#fecdd3',300:'#fda4af',400:'#fb7185',500:'#f43f5e',600:'#e11d48',700:'#be123c'},
                        base: '#F9F8FC'
                    },
                    fontFamily: { sans: ['Nunito','sans-serif'] },
                    boxShadow: { 'float': '0 20px 40px -15px rgba(124, 58, 237, 0.15)', 'card': '0 10px 30px -10px rgba(0, 0, 0, 0.05)' }
                }
            }
        }
    </script>
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        html { -webkit-text-size-adjust: 100%; }
        body { font-family:'Nunito',sans-serif; background-color:#F9F8FC; color:#2D3748; overflow-x:hidden; }
        img, video, canvas { max-width:100%; height:auto; }
        input, select, textarea { font-size:14px; }
        @media (max-width: 640px) {
            input, select, textarea { font-size:16px; } /* cegah auto-zoom iOS */
            button, a { -webkit-tap-highlight-color: transparent; }
        }
        .scrollbar-hide { -ms-overflow-style:none; scrollbar-width:none; }
        .scrollbar-hide::-webkit-scrollbar { display:none; }
        .break-anywhere { overflow-wrap:anywhere; word-break:break-word; }
        /* Tabel admin: beri ruang scroll horizontal yang jelas di HP */
        .table-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; }
        .table-scroll table { min-width:640px; }
        @media print {
            body { background:#fff; }
            @page { margin: 12mm; }
            body.printing > aside, body.printing > main { display:none !important; }
            body.printing #printRoot { display:block !important; }
        }
        ::-webkit-scrollbar{width:8px;height:8px}::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#ddd6fe;border-radius:999px}::-webkit-scrollbar-thumb:hover{background:#a78bfa}
    </style>
    @stack('head')
</head>
<body class="min-h-screen lg:h-screen w-full flex flex-col lg:flex-row overflow-x-hidden lg:overflow-hidden p-3 sm:p-5 gap-3 sm:gap-5 selection:bg-peach-400 selection:text-white">

    <!-- Floating Pill Sidebar (Solo Management Focus) -->
    <aside class="w-full lg:w-24 bg-gradient-to-r lg:bg-gradient-to-b from-lavender-600 to-lavender-800 rounded-2xl sm:rounded-3xl lg:rounded-[3rem] flex flex-row lg:flex-col items-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3 lg:py-8 lg:px-0 shadow-float z-40 text-white shrink-0 sticky top-3 sm:top-5 lg:static">

        <!-- App Logo -->
        <a href="{{ route('admin.dashboard') }}" class="w-10 h-10 sm:w-11 sm:h-11 lg:w-14 lg:h-14 shrink-0 bg-white/20 rounded-full flex items-center justify-center lg:mb-8 backdrop-blur-md border border-white/30 shadow-inner">
            <i class="fa-solid fa-broom text-lg sm:text-xl lg:text-2xl text-white"></i>
        </a>

        <!-- Navigation Icons -->
        <nav class="flex flex-row lg:flex-col gap-1.5 sm:gap-2 lg:gap-6 w-auto lg:w-full items-center flex-1 justify-center lg:justify-start overflow-x-auto scrollbar-hide px-1">
            <a href="{{ route('admin.dashboard') }}" title="Dashboard Utama" class="{{ request()->routeIs('admin.dashboard') ? 'w-10 h-10 sm:w-11 sm:h-11 lg:w-14 lg:h-14 bg-white rounded-2xl lg:rounded-3xl flex items-center justify-center text-lavender-600 shadow-lg transform transition-transform hover:scale-105' : 'w-10 h-10 sm:w-11 sm:h-11 lg:w-14 lg:h-14 text-lavender-200 hover:bg-white/10 rounded-2xl lg:rounded-3xl flex items-center justify-center transition-colors' }}">
                <i class="fa-solid fa-chart-pie text-xl"></i>
            </a>
            <a href="{{ route('admin.pesanan.index') }}" title="Jadwal Hari Ini" class="{{ request()->routeIs('admin.pesanan.*') ? 'w-10 h-10 sm:w-11 sm:h-11 lg:w-14 lg:h-14 bg-white rounded-2xl lg:rounded-3xl flex items-center justify-center text-lavender-600 shadow-lg transform transition-transform hover:scale-105' : 'w-10 h-10 sm:w-11 sm:h-11 lg:w-14 lg:h-14 text-lavender-200 hover:bg-white/10 rounded-2xl lg:rounded-3xl flex items-center justify-center transition-colors' }}">
                <i class="fa-solid fa-calendar-check text-xl"></i>
            </a>
            <a href="{{ route('admin.layanan.index') }}" title="Kelola Layanan & Harga" class="{{ request()->routeIs('admin.layanan.*') ? 'w-10 h-10 sm:w-11 sm:h-11 lg:w-14 lg:h-14 bg-white rounded-2xl lg:rounded-3xl flex items-center justify-center text-lavender-600 shadow-lg transform transition-transform hover:scale-105' : 'w-10 h-10 sm:w-11 sm:h-11 lg:w-14 lg:h-14 text-lavender-200 hover:bg-white/10 rounded-2xl lg:rounded-3xl flex items-center justify-center transition-colors' }}">
                <i class="fa-solid fa-list-check text-xl"></i>
            </a>
        </nav>

        <!-- Settings + Logout -->
        <div class="flex flex-row lg:flex-col gap-1.5 sm:gap-2 lg:gap-4 mt-0 lg:mt-auto shrink-0">
            <button onclick="askLogout()" title="Keluar dari Dashboard" class="w-10 h-10 sm:w-11 sm:h-11 lg:w-14 lg:h-14 text-lavender-200 hover:bg-white/10 rounded-2xl lg:rounded-3xl flex items-center justify-center transition-colors">
                <i class="fa-solid fa-right-from-bracket text-xl"></i>
            </button>
            <a href="{{ route('admin.pengaturan.index') }}" title="Pengaturan" class="{{ request()->routeIs('admin.pengaturan.*') ? 'w-10 h-10 sm:w-11 sm:h-11 lg:w-14 lg:h-14 bg-white rounded-2xl lg:rounded-3xl flex items-center justify-center text-lavender-600 shadow-lg transform transition-transform hover:scale-105' : 'w-10 h-10 sm:w-11 sm:h-11 lg:w-14 lg:h-14 text-lavender-200 hover:bg-white/10 rounded-2xl lg:rounded-3xl flex items-center justify-center transition-colors' }}">
                <i class="fa-solid fa-gear text-xl"></i>
            </a>
        </div>
        <form id="logoutForm" action="{{ route('logout') }}" method="POST" class="hidden">@csrf</form>
    </aside>

    <!-- Middle Section: Main Dashboard Content -->
    <main class="flex-1 flex flex-col min-w-0 w-full bg-transparent overflow-visible pb-6 lg:pb-0">
        @if(session('ok') || $errors->any())
            <div class="mb-4 shrink-0">
                @if(session('ok'))
                    <div class="bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-3 rounded-2xl text-sm font-bold flex items-center gap-2">
                        <i class="fa-solid fa-circle-check"></i> {{ session('ok') }}
                    </div>
                @endif
                @if($errors->any())
                    <div class="bg-red-50 border border-red-200 text-red-600 px-5 py-3 rounded-2xl text-sm font-bold mt-2">
                        @foreach($errors->all() as $e)<div>{{ $e }}</div>@endforeach
                    </div>
                @endif
            </div>
        @endif
        @yield('content')
    </main>

    @yield('rightpanel')
    <div id="printRoot" class="hidden print:block"></div>

    <!-- Modal Konfirmasi Global (logout, hapus, batalkan, selesai, dll) -->
    <div id="confirmModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] hidden items-center justify-center p-4">
        <div class="bg-white rounded-[2rem] shadow-float w-full max-w-sm p-6 border border-lavender-50 text-center">
            <div id="confirmIconWrap" class="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-xl mb-3 bg-lavender-50 text-lavender-600">
                <i id="confirmIcon" class="fa-solid fa-circle-question"></i>
            </div>
            <h3 id="confirmTitle" class="text-lg font-extrabold text-gray-800">Yakin?</h3>
            <p id="confirmMessage" class="text-xs font-semibold text-gray-500 mt-1 mb-5">Tindakan ini tidak dapat dibatalkan.</p>
            <div class="grid grid-cols-2 gap-2">
                <button onclick="closeConfirmModal()" class="py-3 rounded-2xl bg-gray-100 text-gray-600 font-extrabold text-sm hover:bg-gray-200 transition-colors">Batal</button>
                <button id="confirmYesBtn" onclick="submitConfirmModal()" class="py-3 rounded-2xl bg-lavender-600 text-white font-extrabold text-sm shadow-md hover:bg-lavender-700 transition-all">Ya</button>
            </div>
        </div>
    </div>

    <script>
        let confirmCallback = null;
        const toneMap = {
            lavender: { box: 'bg-lavender-50 text-lavender-600', btn: 'bg-lavender-600 hover:bg-lavender-700', icon: 'fa-circle-question' },
            red: { box: 'bg-red-50 text-red-500', btn: 'bg-red-500 hover:bg-red-600', icon: 'fa-triangle-exclamation' },
            emerald: { box: 'bg-emerald-50 text-emerald-600', btn: 'bg-emerald-500 hover:bg-emerald-600', icon: 'fa-circle-check' },
            blue: { box: 'bg-blue-50 text-blue-600', btn: 'bg-blue-500 hover:bg-blue-600', icon: 'fa-calendar-days' },
            peach: { box: 'bg-peach-50 text-peach-600', btn: 'bg-peach-500 hover:bg-peach-600', icon: 'fa-file-arrow-down' },
        };
        function openConfirmModal({ title = 'Yakin?', message = 'Tindakan ini tidak dapat dibatalkan.', confirmText = 'Ya', tone = 'lavender', icon = null, onConfirm = null }) {
            const modal = document.getElementById('confirmModal');
            document.getElementById('confirmTitle').innerText = title;
            document.getElementById('confirmMessage').innerText = message;
            const yesBtn = document.getElementById('confirmYesBtn');
            yesBtn.innerText = confirmText;
            const t = toneMap[tone] || toneMap.lavender;
            document.getElementById('confirmIconWrap').className = 'w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-xl mb-3 ' + t.box;
            document.getElementById('confirmIcon').className = 'fa-solid ' + (icon || t.icon);
            yesBtn.className = 'py-3 rounded-2xl text-white font-extrabold text-sm shadow-md transition-all ' + t.btn;
            confirmCallback = onConfirm;
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
        function closeConfirmModal() {
            const modal = document.getElementById('confirmModal');
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            confirmCallback = null;
        }
        function submitConfirmModal() {
            const cb = confirmCallback;
            confirmCallback = null;
            document.getElementById('confirmModal').classList.add('hidden');
            document.getElementById('confirmModal').classList.remove('flex');
            if (typeof cb === 'function') cb();
        }
        document.getElementById('confirmModal')?.addEventListener('click', e => { if (e.target.id === 'confirmModal') closeConfirmModal(); });

        function askLogout() {
            openConfirmModal({
                title: 'Keluar dari Dashboard?',
                message: 'Sesi login akan diakhiri. Anda harus login ulang untuk mengelola pesanan.',
                confirmText: 'Ya, Keluar',
                tone: 'red',
                icon: 'fa-right-from-bracket',
                onConfirm: () => document.getElementById('logoutForm')?.submit()
            });
        }

        // Otomatis: semua form dengan atribut data-confirm akan memakai modal ini
        document.addEventListener('submit', function (e) {
            const form = e.target;
            if (!form || !form.hasAttribute || !form.hasAttribute('data-confirm')) return;
            if (form.dataset.confirmed === '1') { delete form.dataset.confirmed; return; }
            e.preventDefault();
            openConfirmModal({
                title: form.getAttribute('data-confirm-title') || 'Yakin?',
                message: form.getAttribute('data-confirm'),
                confirmText: form.getAttribute('data-confirm-ok') || 'Ya, Lanjutkan',
                tone: form.getAttribute('data-confirm-tone') || 'lavender',
                icon: form.getAttribute('data-confirm-icon') || null,
                onConfirm: () => { form.dataset.confirmed = '1'; form.requestSubmit ? form.requestSubmit() : form.submit(); }
            });
        });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') closeConfirmModal(); });
    </script>
    @stack('scripts')
</body>
</html>
