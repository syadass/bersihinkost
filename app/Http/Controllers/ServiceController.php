<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        $category = $request->get('category', 'all');
        $search = trim($request->get('search', ''));

        $categories = Category::withCount('services')->orderBy('name')->get();

        $q = Service::orderBy('id');
        if ($category !== 'all') {
            $q->where('category', $category);
        }
        if ($search !== '') {
            $q->where(function ($w) use ($search) {
                $w->where('name', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%");
            });
        }
        $services = $q->get();
        $servicesData = $services->map(function ($s) {
            return [
                'id' => $s->id,
                'name' => $s->name,
                'category' => $s->category,
                'price' => $s->price,
                'duration_minutes' => $s->duration_minutes,
                'image_url' => $s->image_url,
                'image_src' => $s->image_src,
                'is_local_image' => $s->usesLocalImage(),
                'is_active' => (bool) $s->is_active,
            ];
        })->values()->all();
        $categoryNames = Category::orderBy('name')->pluck('name')->all();
        return view('admin.layanan.index', compact('services', 'servicesData', 'categories', 'category', 'search', 'categoryNames'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'category' => 'required|string|max:50|exists:categories,name',
            'price' => 'required|integer|min:0',
            'duration_minutes' => 'required|integer|min:5|max:480',
            'image_url' => 'nullable|url|max:500',
            'image_file' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'is_active' => 'nullable|boolean',
        ]);
        if ($request->hasFile('image_file')) {
            $data['image_url'] = $request->file('image_file')->store('services', 'public');
        }
        unset($data['image_file']);
        $data['is_active'] = $request->boolean('is_active', true);
        Service::create($data);
        return back()->with('ok', 'Layanan ditambahkan.');
    }

    public function update(Request $request, Service $service)
    {
        // Laravel route-model binding uses {service}; support {layanan} alias via explicit lookup
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'category' => 'required|string|max:50|exists:categories,name',
            'price' => 'required|integer|min:0',
            'duration_minutes' => 'required|integer|min:5|max:480',
            'image_url' => 'nullable|url|max:500',
            'image_file' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'hapus_gambar' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ]);

        $newImage = $data['image_url'] ?? null;
        if ($request->hasFile('image_file')) {
            $newImage = $request->file('image_file')->store('services', 'public');
        }
        if ($newImage || $request->boolean('hapus_gambar')) {
            $this->deleteLocalImage($service);
        }
        $data['image_url'] = $newImage;
        unset($data['image_file'], $data['hapus_gambar']);
        $data['is_active'] = $request->boolean('is_active');
        $service->update($data);
        return back()->with('ok', 'Layanan diperbarui.');
    }

    public function destroy(Service $service)
    {
        if ($service->orderItems()->exists()) {
            $service->update(['is_active' => false]);
            return back()->with('ok', 'Layanan pernah dipesan, jadi dinonaktifkan (tidak dihapus).');
        }
        $this->deleteLocalImage($service);
        $service->delete();
        return back()->with('ok', 'Layanan dihapus.');
    }

    public function storeCategory(Request $request)
    {
        $data = $request->validate(['name' => 'required|string|max:50|unique:categories,name']);
        Category::create($data);
        return back()->with('ok', "Kategori \"{$data['name']}\" ditambahkan.");
    }

    public function renameCategory(Request $request)
    {
        $data = $request->validate([
            'old' => 'required|string|max:50|exists:categories,name',
            'new' => 'required|string|max:50|different:old|unique:categories,name',
        ]);
        DB::transaction(function () use ($data) {
            Category::where('name', $data['old'])->update(['name' => $data['new']]);
            Service::where('category', $data['old'])->update(['category' => $data['new']]);
        });
        return back()->with('ok', "Kategori \"{$data['old']}\" diubah menjadi \"{$data['new']}\".");
    }

    public function deleteCategory(Request $request)
    {
        $data = $request->validate([
            'category' => 'required|string|max:50|exists:categories,name',
        ]);
        if (Service::where('category', $data['category'])->exists()) {
            return back()->withErrors(['category' => "Kategori \"{$data['category']}\" sedang digunakan layanan. Ubah atau hapus layanannya terlebih dahulu."]);
        }
        Category::where('name', $data['category'])->delete();
        return back()->with('ok', "Kategori \"{$data['category']}\" dihapus.");
    }

    private function deleteLocalImage(Service $service): void
    {
        if ($service->usesLocalImage()) {
            Storage::disk('public')->delete($service->image_url);
        }
    }
}
