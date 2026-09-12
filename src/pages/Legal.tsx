import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, FileText } from 'lucide-react';
import { Seo } from '../components/Seo';
import { fetchLegalPage } from '../lib/api';
import { renderMarkdown } from '../lib/markdown';
import type { LegalPage } from '../lib/types';

export default function Legal() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<LegalPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      if (!slug) return;
      try {
        const p = await fetchLegalPage(slug);
        setPage(p);
      } catch {
        setPage(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-stone-300 border-t-accent-600" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="container-content flex flex-col items-center justify-center py-20 text-center">
        <FileText className="h-16 w-16 text-stone-300" />
        <h1 className="mt-4 text-2xl font-bold text-stone-900">Pagina niet gevonden</h1>
        <Link to="/" className="mt-6 btn-primary">Terug naar home</Link>
      </div>
    );
  }

  return (
    <>
      <Seo title={page.title} description={page.body?.slice(0, 160) ?? undefined} url={`/legal/${page.slug}`} />
      <div className="border-b border-stone-200 bg-stone-50">
        <div className="container-content flex items-center gap-2 py-3 text-sm text-stone-500">
          <Link to="/" className="hover:text-stone-900">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-stone-900">{page.title}</span>
        </div>
        <div className="container-content pb-8">
          <h1 className="text-2xl font-bold text-stone-900 md:text-3xl">{page.title}</h1>
        </div>
      </div>
      <div className="container-content py-8">
        <div className="prose prose-stone max-w-3xl">
          <div className="text-stone-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMarkdown(page.body ?? '') }} />
        </div>
      </div>
    </>
  );
}
