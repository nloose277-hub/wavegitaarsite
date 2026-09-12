import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, X } from 'lucide-react';
import { fetchAllCategories, createCategory, updateCategory, deleteCategory } from '../../lib/api';
import type { Category } from '../../lib/types';

const EMPTY: Omit<Category, 'id' | 'created_at' | 'updated_at'> = {
  slug: '', name: '', description: null, parent_id: null,
  display_order: 0, is_visible: true,
};

export default function AdminCategories() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const c = await fetchAllCategories();
      setCats(c);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (c: Category) => { setEditing(c); setCreating(false); setForm({ ...EMPTY, ...c }); };
  const startCreate = () => { setCreating(true); setEditing(null); setForm(EMPTY); };
  const cancel = () => { setEditing(null); setCreating(false); setForm(EMPTY); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (creating) { await createCategory(form); }
      else if (editing) { await updateCategory(editing.id, form); }
      await load();
      cancel();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Opslaan mislukt.');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Categorie verwijderen?')) return;
    try { await deleteCategory(id); await load(); }
    catch (err) { alert(err instanceof Error ? err.message : 'Verwijderen mislukt.'); }
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
        <h2 className="text-lg font-semibold text-stone-900">Categorieën ({cats.length})</h2>
        {!isEditing && <button onClick={startCreate} className="btn-primary"><Plus className="h-4 w-4" /> Nieuwe categorie</button>}
      </div>

      {isEditing ? (
        <form onSubmit={save} className="rounded-xl border border-stone-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-stone-900">{creating ? 'Nieuwe categorie' : 'Bewerk categorie'}</h3>
            <button type="button" onClick={cancel} className="text-stone-400"><X className="h-5 w-5" /></button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="input-label">Naam *</label><input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" /></div>
            <div><label className="input-label">Slug *</label><input type="text" required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input-field" /></div>
            <div><label className="input-label">Volgorde</label><input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} className="input-field" /></div>
            <div><label className="flex items-center gap-2 text-sm text-stone-700 mt-6"><input type="checkbox" checked={form.is_visible} onChange={(e) => setForm({ ...form, is_visible: e.target.checked })} className="accent-accent-600" /> Zichtbaar</label></div>
          </div>
          <div><label className="input-label">Omschrijving</label><textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value || null })} className="input-field" rows={2} /></div>
          <div className="flex gap-3"><button type="submit" className="btn-primary">Opslaan</button><button type="button" onClick={cancel} className="btn-outline">Annuleren</button></div>
        </form>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
          <div className="divide-y divide-stone-100">
            {cats.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-900">{c.name}</p>
                  <p className="text-xs text-stone-400">/{c.slug}</p>
                </div>
                <span className={`badge ${c.is_visible ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'}`}>{c.is_visible ? 'Zichtbaar' : 'Verborgen'}</span>
                <button onClick={() => startEdit(c)} className="rounded-md p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-900"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => remove(c.id)} className="rounded-md p-2 text-stone-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
