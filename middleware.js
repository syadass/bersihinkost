export function middleware(req) {
  // Proteksi login dinonaktifkan: /admin bisa diakses langsung tanpa login.
  return
}

export const config = {
  matcher: ['/admin/:path*'],
}
