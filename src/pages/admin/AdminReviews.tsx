import { useEffect, useState } from 'react';
import { Check, Trash2, Star } from 'lucide-react';
import { fetchAllReviews, updateReview, deleteReview } from '../../lib/api';
import type { Review } from '../../lib/types';

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { setReviews(await fetchAllReviews()); }
    catch { /* fail silently */ }
    finally { setLoading(false); }
  };

  const toggleApprove = async (r: Review) => {
    try {
      await updateReview(r.id, { is_approved: !r.is_approved });
      setReviews(reviews.map((x) => (x.id === r.id ? { ...x, is_approved: !r.is_approved } : x)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Bijwerken mislukt.');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Review verwijderen?')) return;
    try { await deleteReview(id); setReviews(reviews.filter((r) => r.id !== id)); }
    catch (err) { alert(err instanceof Error ? err.message : 'Verwijderen mislukt.'); }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-stone-300 border-t-accent-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-stone-900">Reviews ({reviews.length})</h2>
      {reviews.length === 0 ? (
        <p className="text-center text-sm text-stone-400 py-16">Nog geen reviews.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-stone-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                      {r.avatar_url ? (
                        <img src={r.avatar_url} alt={r.author_name} className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-200 text-xs font-semibold text-stone-600">
                          {r.author_name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')}
                        </div>
                      )}
                      <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`h-4 w-4 ${s <= r.rating ? 'fill-accent-400 text-accent-400' : 'text-stone-300'}`} />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-stone-900">{r.author_name}</span>
                    {(r as Review & { product?: { name?: string } }).product?.name && (
                      <span className="text-xs text-stone-400">— {(r as Review & { product?: { name?: string } }).product?.name}</span>
                    )}
                    {r.is_example && <span className="badge bg-stone-100 text-stone-500">Voorbeeld</span>}
                    <span className={`badge ${r.is_approved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {r.is_approved ? 'Goedgekeurd' : 'In afwachting'}
                    </span>
                  </div>
                  {r.title && <h3 className="mt-2 text-sm font-semibold text-stone-900">{r.title}</h3>}
                  {r.body && <p className="mt-1 text-sm text-stone-600">{r.body}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => toggleApprove(r)} className={`rounded-md p-2 ${r.is_approved ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}>
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={() => remove(r.id)} className="rounded-md p-2 text-stone-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
