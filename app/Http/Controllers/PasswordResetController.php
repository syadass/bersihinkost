<?php

namespace App\Http\Controllers;

use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class PasswordResetController extends Controller
{
    public function showLinkRequestForm()
    {
        return view('auth.forgot-password');
    }

    public function sendResetLink(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        try {
            $status = Password::sendResetLink($request->only('email'));
        } catch (\Exception $e) {
            report($e);
            return back()->withErrors(['email' => 'Gagal menghubungi server email. Periksa koneksi & pengaturan email, lalu coba lagi.'])->onlyInput('email');
        }

        return $status === Password::RESET_LINK_SENT
            ? back()->with('ok', 'Tautan reset kata sandi telah dikirim ke email. Berlaku 60 menit, cek juga folder spam.')
            : back()->withErrors(['email' => __($status)])->onlyInput('email');
    }

    public function showResetForm(string $token)
    {
        return view('auth.reset-password', ['token' => $token]);
    }

    public function reset(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill(['password' => $password])->setRememberToken(Str::random(60));
                $user->save();
                event(new PasswordReset($user));
            }
        );

        return $status === Password::PASSWORD_RESET
            ? redirect()->route('login')->with('ok', 'Kata sandi berhasil diganti. Silakan masuk dengan sandi baru.')
            : back()->withErrors(['email' => __($status)])->onlyInput('email');
    }
}
