<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\PublicController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\SettingController;
use Illuminate\Support\Facades\Route;

Route::get('/', [PublicController::class, 'index'])->name('home');
Route::post('/orders', [PublicController::class, 'store'])->name('orders.store');
Route::get('/orders/sukses/{order}', [PublicController::class, 'success'])->name('orders.success');

Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->name('login.post');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::get('/lupa-sandi', [PasswordResetController::class, 'showLinkRequestForm'])->name('password.request');
Route::post('/lupa-sandi', [PasswordResetController::class, 'sendResetLink'])->name('password.email');
Route::get('/reset-sandi/{token}', [PasswordResetController::class, 'showResetForm'])->name('password.reset');
Route::post('/reset-sandi', [PasswordResetController::class, 'reset'])->name('password.update');

Route::middleware('auth')->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [AdminController::class, 'dashboard'])->name('dashboard');

    Route::get('/pesanan', [OrderController::class, 'index'])->name('pesanan.index');
    Route::get('/pesanan/buat', [OrderController::class, 'create'])->name('pesanan.create');
    Route::get('/pesanan/laporan', [OrderController::class, 'laporanDownload'])->name('pesanan.laporan');
    Route::post('/pesanan/manual', [OrderController::class, 'manualStore'])->name('pesanan.manual');
    Route::get('/pesanan/{order}', [OrderController::class, 'show'])->name('pesanan.show');
    Route::get('/pesanan/{order}/invoice', [OrderController::class, 'invoice'])->name('pesanan.invoice');
    Route::get('/pesanan/{order}/edit', [OrderController::class, 'edit'])->name('pesanan.edit');
    Route::put('/pesanan/{order}', [OrderController::class, 'update'])->name('pesanan.update');
    Route::patch('/pesanan/{order}/acc', [OrderController::class, 'acc'])->name('pesanan.acc');
    Route::patch('/pesanan/{order}/reschedule', [OrderController::class, 'reschedule'])->name('pesanan.reschedule');
    Route::patch('/pesanan/{order}/batal', [OrderController::class, 'cancel'])->name('pesanan.cancel');
    Route::patch('/pesanan/{order}/selesai', [OrderController::class, 'complete'])->name('pesanan.selesai');
    Route::delete('/pesanan/{order}', [OrderController::class, 'destroy'])->name('pesanan.destroy');

    Route::get('/layanan', [ServiceController::class, 'index'])->name('layanan.index');
    Route::post('/layanan', [ServiceController::class, 'store'])->name('layanan.store');
    Route::post('/layanan-kategori', [ServiceController::class, 'storeCategory'])->name('layanan.storeCategory');
    Route::put('/layanan-kategori', [ServiceController::class, 'renameCategory'])->name('layanan.renameCategory');
    Route::delete('/layanan-kategori', [ServiceController::class, 'deleteCategory'])->name('layanan.deleteCategory');
    Route::put('/layanan/{service}', [ServiceController::class, 'update'])->name('layanan.update');
    Route::delete('/layanan/{service}', [ServiceController::class, 'destroy'])->name('layanan.destroy');

    Route::get('/pengaturan', [SettingController::class, 'index'])->name('pengaturan.index');
    Route::put('/pengaturan/profil', [SettingController::class, 'updateProfil'])->name('pengaturan.profil');
    Route::put('/pengaturan/operasional', [SettingController::class, 'updateOperasional'])->name('pengaturan.operasional');
    Route::put('/pengaturan/akun', [SettingController::class, 'updateAccount'])->name('pengaturan.akun');
    Route::post('/pengaturan/libur', [SettingController::class, 'storeHoliday'])->name('pengaturan.libur.store');
    Route::delete('/pengaturan/libur/{libur}', [SettingController::class, 'destroyHoliday'])->name('pengaturan.libur.destroy');
});
