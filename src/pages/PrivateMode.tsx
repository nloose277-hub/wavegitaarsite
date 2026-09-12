import { Lock } from 'lucide-react';
import { Seo } from '../components/Seo';

export default function PrivateMode() {
  return (
    <>
      <Seo title="Even offline" url="/" />
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-stone-200 bg-white shadow-sm">
          <Lock className="h-9 w-9 text-stone-400" strokeWidth={1.5} />
        </div>
        <h1 className="mt-8 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
          We zijn bijna zover
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-stone-500">
          WaveGitaar is momenteel in onderhoud. We werken aan de website om je een betere ervaring te bieden. Kom binnenkort terug.
        </p>
        <a
          href="/admin"
          className="mt-8 rounded-lg border border-stone-300 bg-white px-6 py-2.5 text-sm font-semibold text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-900"
        >
          Naar beheer
        </a>
      </div>
    </>
  );
}
