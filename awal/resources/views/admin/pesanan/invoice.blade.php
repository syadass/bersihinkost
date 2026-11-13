<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice #{{ $order->id }} - Bersihinkost</title>
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
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body { font-family: 'Nunito', sans-serif; background: #F9F8FC; color: #2D3748; }
        @media print {
            body { background: #fff; }
            .no-print { display: none !important; }
            .invoice-sheet { box-shadow: none !important; border: none !important; border-radius: 0 !important; max-width: 100% !important; margin: 0 !important; }
            @page { margin: 14mm; }
        }
    </style>
</head>
<body class="min-h-screen py-6 px-4">
    <div id="invoicePdf" class="invoice-sheet max-w-3xl mx-auto bg-white rounded-3xl shadow-card border border-lavender-50 overflow-hidden">
        @include('admin.pesanan._invoice_sheet')

        <div class="px-6 sm:px-10 pb-7">
            <!-- Tombol aksi (disembunyikan saat cetak & tidak ikut ke PDF) -->
            <div class="no-print flex flex-col sm:flex-row gap-3 pt-2" data-html2canvas-ignore="true">
                <button onclick="window.print()" class="flex-1 py-3.5 rounded-2xl bg-lavender-600 text-white font-extrabold text-sm shadow-md hover:bg-lavender-700 transition-all flex items-center justify-center gap-2">
                    <i class="fa-solid fa-print"></i> Cetak
                </button>
                <button onclick="downloadPdf()" class="flex-1 py-3.5 rounded-2xl bg-peach-500 text-white font-extrabold text-sm shadow-md hover:bg-peach-600 transition-all flex items-center justify-center gap-2">
                    <i class="fa-solid fa-file-arrow-down"></i> Unduh PDF
                </button>
                <button onclick="window.close()" class="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-600 font-extrabold text-sm hover:bg-gray-200 transition-colors">
                    Tutup
                </button>
            </div>
            <p id="dlStatus" class="no-print hidden text-center text-xs font-extrabold text-lavender-600">Menyiapkan PDF, mohon tunggu...</p>
        </div>
    </div>

    <script>
        function downloadPdf() {
            const status = document.getElementById('dlStatus');
            status.classList.remove('hidden');
            const el = document.getElementById('invoicePdf');
            const opt = {
                margin: 10,
                filename: 'invoice-#{{ $order->id }}-bersihinkost.pdf',
                image: { type: 'jpeg', quality: 0.95 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            html2pdf().set(opt).from(el).save()
                .then(() => status.classList.add('hidden'))
                .catch(() => {
                    status.innerText = 'Gagal membuat PDF otomatis. Gunakan tombol Cetak lalu pilih "Save as PDF".';
                });
        }
        @if(request('cetak'))
            window.addEventListener('load', () => window.print());
        @endif
        @if(request('unduh'))
            window.addEventListener('load', () => setTimeout(downloadPdf, 600));
        @endif
    </script>
</body>
</html>
