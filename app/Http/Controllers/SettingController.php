<?php

namespace App\Http\Controllers;

use App\Models\ClosureDate;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index()
    {
        $setting = Setting::current();
        $liburDates = ClosureDate::orderBy('tanggal')->get();
        return view('admin.pengaturan.index', compact('setting', 'liburDates'));
    }

    public function updateProfil(Request $request)
    {
        $data = $request->validate([
            'business_name' => 'required|string|max:100',
            'operator_name' => 'required|string|max:100',
            'admin_wa_number' => 'required|string|max:20',
        ]);
        // normalisasi: hanya digit
        $data['admin_wa_number'] = preg_replace('/\D/', '', $data['admin_wa_number']);
        Setting::current()->update($data);
        return back()->with('ok', 'Profil usaha disimpan.');
    }

    public function updateOperasional(Request $request)
    {
        $data = $request->validate([
            'is_open' => 'nullable|boolean',
            'jam_mulai' => 'required|date_format:H:i',
            'jam_selesai' => 'required|date_format:H:i',
            'catatan_publik' => 'nullable|string|max:500',
        ]);
        $data['is_open'] = $request->boolean('is_open');
        Setting::current()->update($data);
        return back()->with('ok', 'Jam operasional disimpan.');
    }

    public function updateAccount(Request $request)    {
        $user = $request->user();
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|max:100|unique:users,email,' . $user->id . '|confirmed',
            'password' => 'nullable|string|min:8|confirmed',
        ]);
        $user->name = $data['name'];
        $user->email = $data['email'];
        if (! empty($data['password'])) {
            $user->password = $data['password'];
        }
        $user->save();
        return back()->with('ok', 'Akun login berhasil diperbarui.');
    }

    public function storeHoliday(Request $request)
    {
        $data = $request->validate([
            'tanggal' => 'required|date|after_or_equal:today|unique:closure_dates,tanggal',
            'keterangan' => 'nullable|string|max:100',
        ], [
            'tanggal.unique' => 'Tanggal tersebut sudah terdaftar sebagai libur.',
        ]);
        ClosureDate::create($data);
        return back()->with('ok', 'Tanggal libur ditambahkan. Pemesan tidak bisa memilih tanggal tersebut.');
    }

    public function destroyHoliday(ClosureDate $libur)
    {
        $libur->delete();
        return back()->with('ok', 'Tanggal libur dihapus.');
    }
}
