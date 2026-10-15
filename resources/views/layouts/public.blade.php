<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Bersihinkost - Jasa Bersih-Bersih Kost Panggilan')</title>
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
    <style>
        html { -webkit-text-size-adjust: 100%; }
        body { font-family:'Nunito',sans-serif; background-color:#F9F8FC; color:#2D3748; overflow-x:hidden; }
        img, video, canvas, svg { max-width:100%; height:auto; }
        img { display:block; }
        /* Cegah zoom otomatis iOS saat fokus input + tap target nyaman di HP */
        input, select, textarea { font-size:14px; }
        @media (max-width: 640px) {
            input, select, textarea { font-size:16px; }
            button, a { -webkit-tap-highlight-color: transparent; }
        }
        .scrollbar-hide { -ms-overflow-style:none; scrollbar-width:none; }
        .scrollbar-hide::-webkit-scrollbar { display:none; }
        /* Pastikan konten panjang (alamat/URL) tidak melebar keluar layar HP */
        .break-anywhere { overflow-wrap:anywhere; word-break:break-word; }
        ::-webkit-scrollbar{width:8px;height:8px}::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#ddd6fe;border-radius:999px}::-webkit-scrollbar-thumb:hover{background:#a78bfa}
    </style>
    @stack('head')
</head>
<body class="min-h-screen flex flex-col selection:bg-peach-400 selection:text-white">
    @yield('content')
    @stack('scripts')
</body>
</html>
