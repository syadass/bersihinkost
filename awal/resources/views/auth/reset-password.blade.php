@extends('layouts.public')
@section('title', 'Reset Kata Sandi - Bersihinkost')

@section('content')
<div class="flex-1 w-full flex items-center justify-center p-4 relative overflow-hidden">
    <!-- Background Decorative Blur Circles -->
    <div class="absolute -top-20 -left-20 w-72 h-72 bg-lavender-200 rounded-full blur-3xl opacity-50"></div>
    <div class="absolute -bottom-20 -right-20 w-72 h-72 bg-peach-200 rounded-full blur-3xl opacity-50"></div>

    <!-- Card Container -->
    <main class="w-full max-w-md bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-float border border-lavender-50 p-5 sm:p-10 relative z-10 flex flex-col items-center">

        <div class="w-16 h-16 bg-gradient-to-tr from-emerald-400 to-emerald-500 rounded-3xl flex items-center justify-center text-white shadow-lg mb-5">
            <i class="fa-solid fa-lock-open text-2xl"></i>
        </div>

        <h1 class="text-2xl font-extrabold text-gray-800 tracking-tight text-center">Buat Sandi Baru</h1>
        <p class="text-xs font-bold text-lavender-500 mt-1 mb-8 text-center">Minimal 8 karakter — jangan pakai sandi lama</p>

        @if($errors->any())
            <div class="w-full mb-4 bg-red-50 border border-red-200 text-red-500 text-xs font-bold px-4 py-3 rounded-2xl">{{ $errors->first() }}</div>
        @endif

        <form method="POST" action="{{ route('password.update') }}" class="w-full space-y-4">
            @csrf
            <input type="hidden" name="token" value="{{ $token }}">
            <div>
                <label class="block text-xs font-extrabold text-gray-600 mb-1.5">Email Akun</label>
                <div class="relative">
                    <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                        <i class="fa-solid fa-envelope text-xs"></i>
                    </span>
                    <input type="email" name="email" value="{{ old('email', request('email')) }}" required placeholder="nama@bersihinkost.com" class="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lavender-400 transition-all">
                </div>
            </div>

            <div>
                <label class="block text-xs font-extrabold text-gray-600 mb-1.5">Kata Sandi Baru</label>
                <div class="relative">
                    <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                        <i class="fa-solid fa-lock text-xs"></i>
                    </span>
                    <input type="password" id="password" name="password" required minlength="8" placeholder="••••••••" class="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lavender-400 transition-all">
                    <button type="button" onclick="togglePw('password', this)" title="Tampilkan sandi" class="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-lavender-600 transition-colors">
                        <i class="fa-solid fa-eye text-xs"></i>
                    </button>
                </div>
            </div>

            <div>
                <label class="block text-xs font-extrabold text-gray-600 mb-1.5">Ulangi Sandi Baru</label>
                <div class="relative">
                    <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                        <i class="fa-solid fa-lock text-xs"></i>
                    </span>
                    <input type="password" id="password_confirmation" name="password_confirmation" required minlength="8" placeholder="••••••••" class="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lavender-400 transition-all">
                    <button type="button" onclick="togglePw('password_confirmation', this)" title="Tampilkan sandi" class="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-lavender-600 transition-colors">
                        <i class="fa-solid fa-eye text-xs"></i>
                    </button>
                </div>
            </div>

            <button type="submit" class="w-full py-4 rounded-2xl bg-emerald-500 text-white font-extrabold text-sm shadow-lg hover:bg-emerald-600 hover:shadow-xl transition-all flex justify-center items-center gap-2 mt-2">
                <i class="fa-solid fa-check"></i> Simpan Sandi Baru
            </button>
        </form>

        <div class="mt-8 pt-6 border-t border-gray-100 w-full text-center">
            <a href="{{ route('login') }}" class="text-xs font-extrabold text-gray-400 hover:text-lavender-600 transition-colors flex items-center justify-center gap-1.5">
                <i class="fa-solid fa-arrow-left text-[10px]"></i> Kembali ke Login
            </a>
        </div>
    </main>
</div>
@endsection

@push('scripts')
<script>
    function togglePw(id, btn) {
        const input = document.getElementById(id);
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.innerHTML = `<i class="fa-solid ${show ? 'fa-eye-slash' : 'fa-eye'} text-xs"></i>`;
        btn.title = show ? 'Sembunyikan sandi' : 'Tampilkan sandi';
    }
</script>
@endpush
