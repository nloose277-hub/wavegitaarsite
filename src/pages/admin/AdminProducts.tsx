import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, X, ChevronDown, ChevronRight, Upload, Palette, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import {
  fetchAdminProducts, createProduct, updateProduct, deleteProduct,
  fetchAllCategories, fetchAdminProductImages, addProductImage, deleteProductImage,
  uploadProductImage,
} from '../../lib/api';
import { formatPrice } from '../../lib/types';
import type { Product, Category, ProductImage, ColorOption } from '../../lib/types';

const EMPTY_PRODUCT: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category' | 'images'> = {
  slug: '', name: '', brand: 'Fender', category_id: null,
  short_description: '', description: '', price: 0, compare_price: null,
  sku: '', stock: 0, weight: null, lead_time: '1-3 werkdagen',
  specifications: null, features: null, is_visible: true, is_featured: false,
  badge: null, meta_title: null, meta_description: null, display_order: 0,
  color_options: null,
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<typeof EMPTY_PRODUCT>(EMPTY_PRODUCT);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([fetchAdminProducts(), fetchAllCategories()]);
      setProducts(p);
      setCategories(c);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  const startEdit = async (p: Product) => {
    setEditing(p);
    setCreating(false);
    setForm({ ...EMPTY_PRODUCT, ...p });
    const imgs = await fetchAdminProductImages(p.id);
    setImages(imgs);
  };

  const startCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm(EMPTY_PRODUCT);
    setImages([]);
  };

  const cancel = () => {
    setEditing(null);
    setCreating(false);
    setForm(EMPTY_PRODUCT);
    setImages([]);
    setError('');
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const { category: _c, images: _i, id: _id, created_at: _ca, updated_at: _ua, ...cleanForm } = form;
      if (creating) {
        const p = await createProduct(cleanForm);
        setProducts([...products, p]);
      } else if (editing) {
        await updateProduct(editing.id, cleanForm);
        setProducts(products.map((p) => (p.id === editing.id ? { ...p, ...cleanForm } : p)));
      }
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
      cancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Opslaan mislukt.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit product wilt verwijderen?')) return;
    try {
      await deleteProduct(id);
      setProducts(products.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verwijderen mislukt.');
    }
  };

  const addImage = async (productId: string) => {
    if (!imageUrl.trim()) return;
    try {
      await addProductImage(productId, imageUrl, imageAlt, images.length);
      const imgs = await fetchAdminProductImages(productId);
      setImages(imgs);
      setImageUrl('');
      setImageAlt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Afbeelding toevoegen mislukt.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, productId: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const url = await uploadProductImage(files[i]);
        await addProductImage(productId, url, imageAlt || files[i].name.replace(/\.[^.]+$/, ''), images.length + i);
      }
      const imgs = await fetchAdminProductImages(productId);
      setImages(imgs);
      setImageAlt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload mislukt.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = async (imgId: string, productId: string) => {
    try {
      await deleteProductImage(imgId);
      const imgs = await fetchAdminProductImages(productId);
      setImages(imgs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verwijderen mislukt.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-stone-300 border-t-accent-600" />
      </div>
    );
  }

  const isEditing = creating || editing !== null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-900">Producten ({products.length})</h2>
        {!isEditing && (
          <button onClick={startCreate} className="btn-primary">
            <Plus className="h-4 w-4" /> Nieuw product
          </button>
        )}
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {isEditing ? (
        <form onSubmit={save} className="rounded-xl border border-stone-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-stone-900">{creating ? 'Nieuw product' : 'Bewerk product'}</h3>
            <button type="button" onClick={cancel} className="text-stone-400 hover:text-stone-600"><X className="h-5 w-5" /></button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="input-label">Naam *</label><input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" /></div>
            <div><label className="input-label">Slug *</label><input type="text" required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input-field" /></div>
            <div><label className="input-label">Merk</label><input type="text" value={form.brand ?? ''} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="input-field" /></div>
            <div>
              <label className="input-label">Categorie</label>
              <select value={form.category_id ?? ''} onChange={(e) => setForm({ ...form, category_id: e.target.value || null })} className="input-field">
                <option value="">— Geen —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label className="input-label">Prijs (€) *</label><input type="number" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className="input-field" /></div>
            <div><label className="input-label">Vergelijk prijs (€)</label><input type="number" step="0.01" value={form.compare_price ?? ''} onChange={(e) => setForm({ ...form, compare_price: e.target.value ? parseFloat(e.target.value) : null })} className="input-field" /></div>
            <div><label className="input-label">SKU</label><input type="text" value={form.sku ?? ''} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="input-field" /></div>
            <div><label className="input-label">Voorraad</label><input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })} className="input-field" /></div>
            <div><label className="input-label">Badge</label><input type="text" value={form.badge ?? ''} onChange={(e) => setForm({ ...form, badge: e.target.value || null })} className="input-field" placeholder="Bijv. Bestseller" /></div>
            <div><label className="input-label">Levertijd</label><input type="text" value={form.lead_time ?? ''} onChange={(e) => setForm({ ...form, lead_time: e.target.value })} className="input-field" /></div>
            <div><label className="input-label">Gewicht</label><input type="text" value={form.weight ?? ''} onChange={(e) => setForm({ ...form, weight: e.target.value })} className="input-field" /></div>
            <div><label className="input-label">Volgorde</label><input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} className="input-field" /></div>
          </div>
          <div><label className="input-label">Korte omschrijving</label><textarea value={form.short_description ?? ''} onChange={(e) => setForm({ ...form, short_description: e.target.value })} className="input-field" rows={2} /></div>
          <div><label className="input-label">Omschrijving</label><textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={4} /></div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-stone-700"><input type="checkbox" checked={form.is_visible} onChange={(e) => setForm({ ...form, is_visible: e.target.checked })} className="accent-accent-600" /> Zichtbaar</label>
            <label className="flex items-center gap-2 text-sm text-stone-700"><input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="accent-accent-600" /> Uitgelicht</label>
          </div>

          <ColorOptionsEditor
            options={form.color_options}
            onChange={(opts) => setForm({ ...form, color_options: opts })}
          />

          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
              {saving ? 'Opslaan...' : 'Opslaan'}
            </button>
            <button type="button" onClick={cancel} className="btn-outline" disabled={saving}>Annuleren</button>
            {savedFlash && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-green-700">
                <CheckCircle2 className="h-4 w-4" /> Opgeslagen & live op de site
              </span>
            )}
          </div>
        </form>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
          <div className="divide-y divide-stone-100">
            {products.map((p) => (
              <div key={p.id}>
                <div className="flex items-center gap-3 p-4">
                  <button onClick={() => setExpanded(expanded === p.id ? null : p.id)} className="text-stone-400 hover:text-stone-600">
                    {expanded === p.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-stone-900">{p.name}</p>
                    <p className="text-xs text-stone-400">{p.brand} &middot; {p.category?.name ?? 'Geen categorie'}</p>
                  </div>
                  <span className="text-sm font-semibold text-stone-900">{formatPrice(p.price)}</span>
                  <span className={`badge ${p.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{p.stock > 0 ? `${p.stock} op voorraad` : 'Uitverkocht'}</span>
                  <button onClick={() => startEdit(p)} className="rounded-md p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-900"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(p.id)} className="rounded-md p-2 text-stone-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
                {expanded === p.id && (
                  <div className="border-t border-stone-100 bg-stone-50 p-4">
                    <p className="text-sm text-stone-600 mb-2">{p.short_description}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {p.features?.map((f, i) => <span key={i} className="badge bg-stone-100 text-stone-600">{f}</span>)}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image manager (when editing existing product) */}
      {editing && (
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <h3 className="mb-4 font-semibold text-stone-900">Afbeeldingen</h3>
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <div><label className="input-label">Image URL</label><input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="input-field" placeholder="https://..." /></div>
            <div><label className="input-label">Alt tekst</label><input type="text" value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} className="input-field" /></div>
          </div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => addImage(editing.id)} className="btn-outline"><Upload className="h-4 w-4" /> Toevoegen via URL</button>
            <label className="btn-primary cursor-pointer">
              <ImageIcon className="h-4 w-4" /> Foto uploaden
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileUpload(e, editing.id)} disabled={uploading} />
            </label>
            {uploading && <span className="text-sm text-stone-500">Uploaden...</span>}
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            {images.map((img) => (
              <div key={img.id} className="relative group">
                <div className="aspect-square overflow-hidden rounded-lg border border-stone-200">
                  <img src={img.url} alt={img.alt ?? ''} className="h-full w-full object-cover" />
                </div>
                <button onClick={() => removeImage(img.id, editing.id)} className="absolute right-1 top-1 rounded-md bg-white/90 p-1 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ColorOptionsEditor({ options, onChange }: { options: ColorOption[] | null; onChange: (opts: ColorOption[] | null) => void }) {
  const [open, setOpen] = useState(false);
  const list = options ?? [];

  const add = () => {
    onChange([...list, { name: '', hex: '#1a1a1a', stock: null, price_adjustment: null }]);
    setOpen(true);
  };
  const update = (i: number, patch: Partial<ColorOption>) => {
    onChange(list.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
  };
  const remove = (i: number) => {
    const next = list.filter((_, idx) => idx !== i);
    onChange(next.length === 0 ? null : next);
  };

  return (
    <div className="rounded-xl border border-stone-200">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-4 py-3 text-left">
        <span className="flex items-center gap-2 text-sm font-semibold text-stone-900">
          <Palette className="h-4 w-4 text-accent-600" /> Kleur varianten {list.length > 0 && <span className="rounded-full bg-accent-100 px-2 py-0.5 text-xs text-accent-700">{list.length}</span>}
        </span>
        {open ? <ChevronDown className="h-4 w-4 text-stone-400" /> : <ChevronRight className="h-4 w-4 text-stone-400" />}
      </button>
      {open && (
        <div className="border-t border-stone-200 p-4 space-y-3">
          <p className="text-xs text-stone-500">Voeg verschillende kleuren toe. De klant kan een kleur kiezen op de productpagina.</p>
          {list.map((opt, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-stone-100 bg-stone-50 p-3">
              <input type="color" value={opt.hex} onChange={(e) => update(i, { hex: e.target.value })} className="h-9 w-9 shrink-0 cursor-pointer rounded border border-stone-300" title="Kleur" />
              <input type="text" value={opt.name} onChange={(e) => update(i, { name: e.target.value })} className="input-field flex-1 min-w-[120px]" placeholder="Kleur naam (bijv. Zwart)" />
              <input type="number" value={opt.stock ?? ''} onChange={(e) => update(i, { stock: e.target.value ? Number(e.target.value) : null })} className="input-field w-20" placeholder="Voorraad" />
              <input type="number" value={opt.price_adjustment ?? ''} onChange={(e) => update(i, { price_adjustment: e.target.value ? Number(e.target.value) : null })} className="input-field w-24" placeholder="+/- prijs" step="0.01" />
              <button type="button" onClick={() => remove(i)} className="rounded-md p-2 text-stone-400 hover:bg-red-50 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button type="button" onClick={add} className="flex items-center gap-1.5 text-sm font-medium text-accent-700 hover:text-accent-800">
            <Plus className="h-4 w-4" /> Kleur toevoegen
          </button>
        </div>
      )}
    </div>
  );
}


