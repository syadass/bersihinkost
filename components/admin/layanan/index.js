'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useConfirmModal } from '@/components/layouts/admin'

function initials(name) {
  const parts = String(name || 'A').trim().split(/\s+/)
  return ((parts[0]?.[0] || 'A') + (parts[1]?.[0] || '')).toUpperCase()
}

export default function LayananIndex({ userName = 'Administrator' }) {
  return <LayananIndexInner userName={userName} />
}

function LayananIndexInner({ userName }) {
  const router = useRouter()
  const confirm = useConfirmModal()
  const sp = useSearchParams()
  const [services, setServices] = useState([])
  const [servicesData, setServicesData] = useState([])
  const [categories, setCategories] = useState([])
  const [categoryNames, setCategoryNames] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState({ ok: '', err: '' })
  const [displayName, setDisplayName] = useState(userName || 'Administrator')
  const reqSeqRef = useRef(0)

  const category = sp.get('category') || 'all'
  const search = sp.get('search') || ''
  const [searchInput, setSearchInput] = useState(search)

  // service modal state
  const [serviceModalOpen, setServiceModalOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [svcForm, setSvcForm] = useState({ name: '', category: '', price: '', duration_minutes: '', is_active: true, image_url: '', hapus_gambar: false })
  const [imageMode, setImageMode] = useState('url')
  const [imageFile, setImageFile] = useState(null)
  const [previewSrc, setPreviewSrc] = useState('')
  const [uploadHint, setUploadHint] = useState('Klik untuk pilih gambar (JPG/PNG/WebP, maks 2MB)')
  const [saving, setSaving] = useState(false)

  // category modal state
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [catName, setCatName] = useState('')
  const [catEditOld, setCatEditOld] = useState(null)
  const [catSaving, setCatSaving] = useState(false)

  useEffect(() => { setSearchInput(search) }, [search])

  async function load() {
    const seq = ++reqSeqRef.current
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (category && category !== 'all') qs.set('category', category)
      if (search) qs.set('search', search)
      const r = await fetch(`/api/services?${qs.toString()}`, { cache: 'no-store' })
      const d = await r.json().catch(() => ({}))
      if (seq !== reqSeqRef.current) return
      if (!r.ok) {
        throw new Error(d?.message || 'Gagal memuat layanan.')
      }
      const svcs = Array.isArray(d.services) ? d.services : []
      setServices(svcs)
      setServicesData(Array.isArray(d.servicesData) ? d.servicesData : svcs.map((s) => ({
        id: s.id, name: s.name, category: s.category, price: s.price, duration_minutes: s.duration_minutes,
        image_url: s.image_url, image_src: s.image_url || null, is_active: s.is_active,
      })))
      // categories with counts from /api/categories + derive from services if needed
      const cr = await fetch('/api/categories', { cache: 'no-store' })
      const cd = await cr.json().catch(() => ({}))
      if (seq !== reqSeqRef.current) return
      const cats = Array.isArray(cd.categories) ? cd.categories : []
      // enrich counts
      let all = svcs
      if (category !== 'all' || search) {
        const ar = await fetch('/api/services', { cache: 'no-store' })
        const ad = await ar.json().catch(() => ({}))
        if (seq !== reqSeqRef.current) return
        if (ar.ok) all = Array.isArray(ad.services) ? ad.services : svcs
      }
      const counts = {}
      for (const s of all) counts[s.category] = (counts[s.category] || 0) + 1
      setCategories(cats.map((c) => ({ ...c, services_count: counts[c.name] ?? c.service_count ?? 0 })))
      setCategoryNames(cats.map((c) => c.name))
      setMsg((m) => ({ ...m, err: '' }))
    } catch (err) {
      if (seq !== reqSeqRef.current) return
      setMsg((m) => ({ ok: '', err: err?.message || 'Gagal memuat layanan.' }))
    } finally {
      if (seq === reqSeqRef.current) setLoading(false)
    }
  }

  useEffect(() => { load() }, [category, search])

  useEffect(() => {
    fetch('/api/settings', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (d?.setting?.operator_name) setDisplayName(d.setting.operator_name) })
      .catch(() => {})
  }, [])

  const catActiveCls = 'px-5 py-2.5 rounded-full bg-lavender-600 text-white font-bold text-sm shadow-md flex items-center gap-2 whitespace-nowrap transition-transform hover:scale-105'
  const catIdleCls = 'px-5 py-2.5 rounded-full bg-white text-gray-600 font-bold text-sm shadow-card hover:bg-lavender-50 hover:text-lavender-600 transition-all flex items-center gap-2 whitespace-nowrap'

  function goFilter(next) {
    const p = new URLSearchParams()
    if (next.search) p.set('search', next.search)
    if (next.category && next.category !== 'all') p.set('category', next.category)
    const qs = p.toString()
    router.push(`/admin/layanan${qs ? `?${qs}` : ''}`)
  }

  function openModal() {
    setEditId(null)
    const defaultCat = categoryNames[0] || ''
    setSvcForm({ name: '', category: defaultCat, price: '', duration_minutes: '', is_active: true, image_url: '', hapus_gambar: false })
    setImageMode('url'); setImageFile(null); setPreviewSrc(''); setUploadHint('Klik untuk pilih gambar (JPG/PNG/WebP, maks 2MB)')
    if (!defaultCat) {
      setMsg({ ok: '', err: 'Belum ada kategori. Tambahkan kategori terlebih dahulu sebelum menambah layanan.' })
    } else {
      setMsg((m) => ({ ...m, err: '' }))
    }
    setServiceModalOpen(true)
  }
  function closeModal() { setServiceModalOpen(false) }

  function editService(id) {
    const s = servicesData.find((x) => x.id == id) || services.find((x) => x.id == id)
    if (!s) return
    setEditId(id)
    const src = s.image_src || s.image_url || ''
    const isRemote = !!(s.image_url && String(s.image_url).startsWith('http'))
    const cat = s.category || categoryNames[0] || ''
    setSvcForm({
      name: s.name || '',
      category: cat,
      price: s.price ?? '',
      duration_minutes: s.duration_minutes ?? '',
      is_active: !!s.is_active,
      image_url: isRemote ? s.image_url : '',
      hapus_gambar: false,
    })
    setImageMode(isRemote || !src ? 'url' : 'upload')
    setImageFile(null)
    setPreviewSrc(src || '')
    setUploadHint(src && !isRemote ? 'File tersimpan — pilih file baru untuk mengganti' : 'Klik untuk pilih gambar (JPG/PNG/WebP, maks 2MB)')
    setServiceModalOpen(true)
  }

  function updatePreviewFromUrl(v) { setPreviewSrc(v || '') }
  function clearImageInput() { setSvcForm((f) => ({ ...f, image_url: '' })); setImageFile(null); setPreviewSrc(''); setUploadHint('Klik untuk pilih gambar (JPG/PNG/WebP, maks 2MB)') }

  async function submitService(e) {
    e.preventDefault()
    setSaving(true); setMsg({ ok: '', err: '' })
    try {
      const categoryValue = (svcForm.category || '').trim()
      if (!categoryValue) {
        throw new Error('Kategori wajib dipilih. Tambahkan kategori terlebih dahulu jika belum ada.')
      }
      const fd = new FormData()
      fd.set('name', svcForm.name)
      fd.set('category', categoryValue)
      fd.set('price', String(svcForm.price))
      fd.set('duration_minutes', String(svcForm.duration_minutes))
      if (svcForm.is_active) fd.set('is_active', 'on')
      if (svcForm.hapus_gambar) fd.set('hapus_gambar', 'on')
      if (imageMode === 'url') {
        if (svcForm.image_url) fd.set('image_url', svcForm.image_url)
      } else {
        if (imageFile) fd.set('image_file', imageFile)
      }
      const url = editId ? `/api/services/${editId}` : '/api/services'
      const method = editId ? 'PUT' : 'POST'
      const r = await fetch(url, { method, body: fd })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) {
        if (Array.isArray(d)) {
          const catIssue = d.find((x) => Array.isArray(x?.path) && x.path.includes('category'))
          if (catIssue) throw new Error('Kategori wajib dipilih.')
          throw new Error(d[0]?.message || 'Data layanan tidak valid.')
        }
        if (typeof d?.message === 'string' && d.message.trim().startsWith('[')) {
          try {
            const arr = JSON.parse(d.message)
            if (Array.isArray(arr)) {
              const catIssue = arr.find((x) => Array.isArray(x?.path) && x.path.includes('category'))
              if (catIssue) throw new Error('Kategori wajib dipilih.')
              throw new Error(arr[0]?.message || 'Data layanan tidak valid.')
            }
          } catch {}
        }
        throw new Error(d.message || 'Gagal menyimpan layanan.')
      }
      setMsg({ ok: d.message || 'Berhasil.', err: '' })
      closeModal()
      await load()
    } catch (err) {
      setMsg({ ok: '', err: err.message || 'Gagal menyimpan layanan.' })
    } finally {
      setSaving(false)
    }
  }

  function deleteService(s) {
    confirm.open({
      title: 'Hapus Layanan?',
      message: `Layanan "${s.name}" akan dihapus/dinonaktifkan.`,
      confirmText: 'Ya, Hapus',
      tone: 'red',
      icon: 'fa-trash-can',
      onConfirm: async () => {
        try {
          const r = await fetch(`/api/services/${s.id}`, { method: 'DELETE' })
          const d = await r.json().catch(() => ({}))
          if (!r.ok) throw new Error(d.message || 'Gagal.')
          setMsg({ ok: d.message || 'Berhasil.', err: '' })
          await load()
        } catch (err) { setMsg({ ok: '', err: err.message || 'Gagal.' }) }
      },
    })
  }

  // category modal
  function openCategoryModal() { resetCategoryForm(); setCatModalOpen(true) }
  function closeCategoryModal() { setCatModalOpen(false) }
  function resetCategoryForm() { setCatName(''); setCatEditOld(null) }
  function editCategory(name) { setCatEditOld(name); setCatName(name) }

  async function submitCategory(e) {
    e.preventDefault()
    setCatSaving(true); setMsg({ ok: '', err: '' })
    try {
      let r, d
      if (catEditOld) {
        r = await fetch('/api/categories', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ old: catEditOld, new: catName }) })
      } else {
        r = await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: catName }) })
      }
      d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.message || 'Gagal.')
      setMsg({ ok: d.message || 'Berhasil.', err: '' })
      resetCategoryForm()
      await load()
    } catch (err) { setMsg({ ok: '', err: err.message || 'Gagal.' }) }
    finally { setCatSaving(false) }
  }

  function deleteCategory(name) {
    confirm.open({
      title: 'Hapus Kategori?',
      message: `Kategori "${name}" akan dihapus dari daftar.`,
      confirmText: 'Ya, Hapus',
      tone: 'red',
      icon: 'fa-trash-can',
      onConfirm: async () => {
        try {
          const r = await fetch(`/api/categories?category=${encodeURIComponent(name)}`, { method: 'DELETE' })
          const d = await r.json().catch(() => ({}))
          if (!r.ok) throw new Error(d.message || 'Gagal.')
          setMsg({ ok: d.message || 'Berhasil.', err: '' })
          await load()
        } catch (err) { setMsg({ ok: '', err: err.message || 'Gagal.' }) }
      },
    })
  }

  const totalAll = categories.reduce((a, c) => a + (c.services_count || 0), 0)

  return (
    <>
      {msg.ok ? <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-3 rounded-2xl text-sm font-bold flex items-center gap-2"><i className="fa-solid fa-circle-check"></i> {msg.ok}</div> : null}
      {msg.err ? <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-5 py-3 rounded-2xl text-sm font-bold">{msg.err}</div> : null}

      <header className="mb-5 sm:mb-6 pt-2">
        <div className="flex flex-col xl:flex-row xl:items-center gap-3">
          <div className="shrink-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">Kelola Layanan & Harga</h1>
            <p className="text-xs sm:text-sm font-bold text-lavender-500">Tambah, ubah, atau atur daftar jasa pembersihan kost</p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 xl:ml-auto min-w-0">
            <div className="flex flex-col min-[520px]:flex-row min-[520px]:items-center gap-2 min-w-0">
              <form className="relative flex-1 sm:flex-none sm:w-64 md:w-72 min-w-0" onSubmit={(e) => { e.preventDefault(); goFilter({ search: searchInput, category }) }}>
                {category !== 'all' && <input type="hidden" name="category" value={category} />}
                <span className="absolute inset-y-0 left-0 flex items-center pl-5 text-gray-400">
                  <i className="fa-solid fa-magnifying-glass text-xs"></i>
                </span>
                <input type="text" name="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Cari layanan..." className="w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-3xl bg-white border-none shadow-card text-sm font-bold text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lavender-400 transition-all" />
              </form>

              <div className="flex items-center gap-2 shrink-0">
                <button onClick={openCategoryModal} className="flex-1 min-[520px]:flex-none px-4 sm:px-5 py-3 sm:py-3.5 rounded-3xl bg-white text-lavender-600 border border-lavender-200 font-extrabold text-xs sm:text-sm shadow-card hover:bg-lavender-50 transition-all flex items-center justify-center gap-2 whitespace-nowrap" title="Kelola kategori">
                  <i className="fa-solid fa-tags text-xs"></i> <span className="hidden min-[380px]:inline">Kelola Kategori</span><span className="min-[380px]:hidden">Kategori</span>
                </button>

                <button onClick={openModal} className="flex-1 min-[520px]:flex-none px-4 sm:px-5 py-3 sm:py-3.5 rounded-3xl bg-lavender-600 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-lavender-200 hover:bg-lavender-700 transition-all flex items-center justify-center gap-2 whitespace-nowrap">
                  <i className="fa-solid fa-plus text-xs"></i> Tambah
                </button>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-3 bg-white pl-3 pr-5 py-2 rounded-full shadow-card border border-lavender-100 shrink-0 xl:self-auto">
              <div className="w-10 h-10 rounded-full bg-peach-100 text-peach-600 flex items-center justify-center font-extrabold border-2 border-white shadow-sm">
                {initials(displayName)}
              </div>
              <div>
                <p className="text-sm font-extrabold text-gray-800 leading-tight">{displayName}</p>
                <p className="text-[10px] font-extrabold text-peach-500 uppercase tracking-wider">Solo Operator</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-5 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
        <a href={`/admin/layanan${search ? `?search=${encodeURIComponent(search)}` : ''}`} className={category === 'all' ? catActiveCls : catIdleCls} onClick={(e) => { e.preventDefault(); goFilter({ search, category: 'all' }) }}>
          <i className="fa-solid fa-layer-group text-xs"></i> Semua ({totalAll || services.length})
        </a>
        {categories.map((c) => (
          <a key={c.id || c.name} href="#" onClick={(e) => { e.preventDefault(); goFilter({ search, category: c.name }) }} className={category === c.name ? catActiveCls : catIdleCls}>
            {c.name} ({c.services_count ?? 0})
          </a>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-32 sm:pb-36 lg:pb-6 pr-2 min-h-0">
        {(search || category !== 'all') && (
          <div className="flex items-center gap-3 mb-4">
            <p className="text-xs font-bold text-gray-400">
              {services.length} hasil
              {search ? <> untuk &quot;<span className="text-gray-700">{search}</span>&quot;</> : null}
              {category !== 'all' ? <> di kategori &quot;<span className="text-gray-700">{category}</span>&quot;</> : null}
            </p>
            <a href="/admin/layanan" onClick={(e) => { e.preventDefault(); router.push('/admin/layanan') }} className="text-xs font-extrabold text-red-500 hover:underline">Reset</a>
          </div>
        )}
        <div id="servicesGrid" className={`grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 transition-opacity duration-300 ${loading && services.length > 0 ? 'opacity-60' : 'opacity-100'}`}>
          {loading && services.length === 0 ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={`sk-${i}`} className="bg-white p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-card border border-lavender-50 flex flex-col animate-fade-in">
                <div className="w-full h-24 sm:h-36 rounded-xl sm:rounded-2xl mb-2 sm:mb-3 skeleton" />
                <div className="h-4 w-3/4 rounded-lg skeleton mb-2" />
                <div className="h-3 w-1/2 rounded-lg skeleton mb-2" />
                <div className="h-5 w-24 rounded-lg skeleton mb-3 sm:mb-4" />
                <div className="flex gap-1.5 sm:gap-2 pt-2 sm:pt-3 border-t border-gray-100 mt-auto">
                  <div className="flex-1 h-9 sm:h-10 rounded-lg sm:rounded-xl skeleton" />
                  <div className="w-10 h-9 sm:h-10 rounded-xl skeleton" />
                </div>
              </div>
            ))
          ) : (
            services.map((s) => (
              <div key={s.id} className="bg-white p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-card border border-lavender-50 flex flex-col justify-between group hover:shadow-lg transition-all min-w-0">
                <div className="min-w-0">
                  <div className="w-full h-24 sm:h-36 rounded-xl sm:rounded-2xl mb-2 sm:mb-3 overflow-hidden relative bg-lavender-50">
                    {s.image_url ? (
                      <img src={s.image_url} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lavender-300 text-4xl"><i className="fa-solid fa-broom"></i></div>
                    )}
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-extrabold text-lavender-700 shadow-sm">
                      <i className="fa-regular fa-clock mr-1"></i>{s.duration_minutes} Menit
                    </div>
                    <span className="absolute top-2 left-2 bg-white/95 text-lavender-700 px-2.5 py-1 rounded-full text-[10px] font-extrabold shadow-sm border border-lavender-100">{s.category}</span>
                    {!s.is_active && <span className="absolute bottom-2 left-2 bg-white/95 text-gray-700 px-2.5 py-1 rounded-full text-[10px] font-extrabold shadow-sm border border-gray-200">NONAKTIF</span>}
                  </div>
                  <h3 className="block text-xs sm:text-base font-extrabold mb-0.5 sm:mb-1 leading-tight line-clamp-2" style={{ color: '#111827' }}>{s.name || '-'}</h3>
                  <p className="text-sm sm:text-lg font-extrabold text-peach-500 mb-2 sm:mb-4 truncate">Rp{Number(s.price || 0).toLocaleString('id-ID')}</p>
                </div>

                <div className="flex gap-1.5 sm:gap-2 pt-2 sm:pt-3 border-t border-gray-100">
                  <button onClick={() => editService(s.id)} className="flex-1 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-lavender-50 text-lavender-600 text-[11px] sm:text-xs font-extrabold hover:bg-lavender-100 transition-colors flex items-center justify-center gap-1.5 min-w-0">
                    <i className="fa-solid fa-pen-to-square"></i> <span className="hidden min-[380px]:inline">Ubah</span>
                  </button>
                  <button onClick={() => deleteService(s)} className="w-10 py-2.5 rounded-xl bg-red-50 text-red-500 text-xs font-extrabold hover:bg-red-100 transition-colors flex items-center justify-center" title="Hapus Layanan">
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {!loading && services.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-16 bg-white rounded-3xl shadow-card border border-lavender-50 mt-5">
            <div className="w-20 h-20 rounded-full bg-lavender-50 text-lavender-300 flex items-center justify-center text-3xl mb-3 border-2 border-dashed border-lavender-200">
              <i className="fa-solid fa-list-check"></i>
            </div>
            <p className="text-base font-extrabold text-gray-700">Belum ada layanan</p>
            <p className="text-xs font-medium text-gray-400 mt-1">Klik "Tambah Layanan Baru" untuk membuat yang pertama</p>
          </div>
        )}
      </div>

      {/* Modal Form Tambah/Edit Layanan */}
      {serviceModalOpen && (
        <div id="serviceModal" className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto" onClick={(e) => { if (e.target.id === 'serviceModal') closeModal() }}>
          <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] shadow-float w-full max-w-md p-5 sm:p-7 border border-lavender-50 relative my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 id="modalTitle" className="text-xl font-extrabold text-gray-800">{editId ? 'Ubah Layanan & Harga' : 'Tambah Layanan Baru'}</h3>
              <button onClick={closeModal} className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <form id="serviceForm" onSubmit={submitService} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-gray-600 mb-1">Nama Layanan</label>
                <input type="text" id="serviceName" value={svcForm.name} onChange={(e) => setSvcForm({ ...svcForm, name: e.target.value })} required placeholder="Contoh: Vacuum Kasur" className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400" />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-gray-600 mb-1">Kategori</label>
                {categoryNames.length > 0 ? (
                  <>
                    <select id="serviceCategory" value={svcForm.category} onChange={(e) => setSvcForm({ ...svcForm, category: e.target.value })} required className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400">
                      {categoryNames.map((cn) => <option key={cn} value={cn}>{cn}</option>)}
                    </select>
                    <p className="text-[11px] font-semibold text-gray-400 mt-1">Kategori baru? Tambahkan dulu lewat tombol "Atur Kategori".</p>
                  </>
                ) : (
                  <p className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">Belum ada kategori. <button type="button" onClick={() => { closeModal(); openCategoryModal(); }} className="underline font-extrabold">Tambah kategori dulu</button>.</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-gray-600 mb-1">Tarif (Rp)</label>
                  <input type="number" id="servicePrice" value={svcForm.price} onChange={(e) => setSvcForm({ ...svcForm, price: e.target.value })} required min="0" placeholder="50000" className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400" />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-gray-600 mb-1">Durasi (menit)</label>
                  <input type="number" id="serviceDuration" value={svcForm.duration_minutes} onChange={(e) => setSvcForm({ ...svcForm, duration_minutes: e.target.value })} required min="5" max="480" placeholder="45" className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-extrabold text-gray-600 mb-2">Gambar Layanan <span className="font-semibold text-gray-400">(opsional)</span></label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-gray-100 mb-3">
                  <button type="button" id="tabUrl" onClick={() => { setImageMode('url'); setImageFile(null) }} className={imageMode === 'url' ? 'py-2 rounded-xl text-xs font-extrabold bg-white text-lavender-600 shadow-sm transition-all' : 'py-2 rounded-xl text-xs font-extrabold text-gray-400 transition-all'}>Link URL</button>
                  <button type="button" id="tabUpload" onClick={() => { setImageMode('upload'); setSvcForm((f) => ({ ...f, image_url: '' })) }} className={imageMode === 'upload' ? 'py-2 rounded-xl text-xs font-extrabold bg-white text-lavender-600 shadow-sm transition-all' : 'py-2 rounded-xl text-xs font-extrabold text-gray-400 transition-all'}>Unggah File</button>
                </div>
                <div id="paneUrl" className={imageMode === 'url' ? '' : 'hidden'}>
                  <input type="url" id="serviceImageUrl" value={svcForm.image_url} onChange={(e) => { setSvcForm({ ...svcForm, image_url: e.target.value }); updatePreviewFromUrl(e.target.value) }} placeholder="https://images.unsplash.com/..." className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400" />
                </div>
                <div id="paneUpload" className={imageMode === 'upload' ? '' : 'hidden'}>
                  <label htmlFor="serviceImageFile" className="block cursor-pointer px-4 py-6 rounded-2xl bg-gray-50 border-2 border-dashed border-lavender-200 text-center hover:bg-lavender-50 transition-colors">
                    <i className="fa-solid fa-cloud-arrow-up text-2xl text-lavender-400"></i>
                    <p id="uploadHint" className="text-xs font-extrabold text-gray-600 mt-2">{uploadHint}</p>
                  </label>
                  <input type="file" id="serviceImageFile" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; setImageFile(f); setUploadHint(f.name); const reader = new FileReader(); reader.onload = (ev) => setPreviewSrc(ev.target.result); reader.readAsDataURL(f) }} />
                </div>
                <div id="imagePreviewWrap" className={`${previewSrc ? '' : 'hidden'} mt-3 relative`}>
                  <img id="imagePreview" src={previewSrc} alt="Pratinjau" className="w-full h-32 rounded-2xl object-cover border border-gray-200" />
                  <button type="button" onClick={clearImageInput} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80" title="Hapus gambar">
                    <i className="fa-solid fa-xmark text-xs"></i>
                  </button>
                </div>
                {editId && (servicesData.find((x) => x.id == editId)?.image_src || servicesData.find((x) => x.id == editId)?.image_url) && (
                  <label id="hapusGambarWrap" className="flex items-center gap-2 text-xs font-extrabold text-red-500 mt-2">
                    <input type="checkbox" checked={svcForm.hapus_gambar} onChange={(e) => setSvcForm({ ...svcForm, hapus_gambar: e.target.checked })} className="w-4 h-4 accent-red-500" /> Hapus gambar saat ini
                  </label>
                )}
              </div>
              <label className="flex items-center gap-2 text-xs font-extrabold text-gray-600">
                <input type="checkbox" id="serviceActive" checked={!!svcForm.is_active} onChange={(e) => setSvcForm({ ...svcForm, is_active: e.target.checked })} className="w-4 h-4 accent-purple-600" /> Tampilkan di halaman publik
              </label>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-600 font-extrabold text-sm hover:bg-gray-200 transition-colors">Batal</button>
                <button type="submit" disabled={saving} className="flex-1 py-3.5 rounded-2xl bg-lavender-600 text-white font-extrabold text-sm shadow-md hover:bg-lavender-700 transition-all disabled:opacity-60">{saving ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Kelola Kategori */}
      {catModalOpen && (
        <div id="categoryModal" className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto" onClick={(e) => { if (e.target.id === 'categoryModal') closeCategoryModal() }}>
          <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] shadow-float w-full max-w-lg p-5 sm:p-7 border border-lavender-50 relative my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-xl font-extrabold text-gray-800">Kelola Kategori Layanan</h3>
                <p className="text-xs font-semibold text-gray-400">Tambah, ubah, atau hapus kategori</p>
              </div>
              <button onClick={closeCategoryModal} className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <form id="categoryForm" onSubmit={submitCategory} className="bg-lavender-50/50 p-4 rounded-2xl border border-lavender-100 mb-5 flex gap-2">
              <input type="text" id="categoryNameInput" value={catName} onChange={(e) => setCatName(e.target.value)} required maxLength={50} placeholder="Nama Kategori Baru..." className="flex-1 min-w-0 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-lavender-400" />
              <button type="submit" id="categorySubmitBtn" disabled={catSaving} className="px-5 py-2.5 rounded-xl bg-lavender-600 text-white font-extrabold text-xs shadow-md hover:bg-lavender-700 transition-all whitespace-nowrap disabled:opacity-60">
                {catEditOld ? 'Perbarui' : 'Tambah'}
              </button>
              {catEditOld && (
                <button type="button" id="categoryCancelBtn" onClick={resetCategoryForm} className="px-3 py-2.5 rounded-xl bg-gray-200 text-gray-600 font-extrabold text-xs hover:bg-gray-300 transition-all whitespace-nowrap">Batal</button>
              )}
            </form>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {categories.length ? categories.map((c) => (
                <div key={c.id || c.name} className="bg-gray-50 px-4 py-3 rounded-2xl flex items-center justify-between border border-gray-100">
                  <span className="text-sm font-extrabold text-gray-800">{c.name} <span className="text-[10px] font-extrabold text-gray-400">({c.services_count ?? 0})</span></span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => editCategory(c.name)} className="px-3 py-1.5 rounded-xl bg-lavender-50 text-lavender-600 text-xs font-extrabold hover:bg-lavender-100 transition-colors">
                      <i className="fa-solid fa-pen mr-1"></i> Ubah
                    </button>
                    <button onClick={() => deleteCategory(c.name)} className="px-3 py-1.5 rounded-xl bg-red-50 text-red-500 text-xs font-extrabold hover:bg-red-100 transition-colors">
                      <i className="fa-solid fa-trash-can mr-1"></i> Hapus
                    </button>
                  </div>
                </div>
              )) : <p className="text-center text-xs text-gray-400 py-4 font-bold">Belum ada kategori.</p>}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 text-right">
              <button type="button" onClick={closeCategoryModal} className="px-6 py-3 rounded-2xl bg-lavender-600 text-white font-extrabold text-xs shadow-md hover:bg-lavender-700 transition-all">Selesai</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
