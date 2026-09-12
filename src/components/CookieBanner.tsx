import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X } from 'lucide-react';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[70] animate-slide-up">
      <div className="mx-auto max-w-4xl m-3 rounded-xl border border-stone-200 bg-white p-5 shadow-2xl md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-accent-600">
              <Cookie className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900">Wij gebruiken cookies</p>
              <p className="mt-1 text-xs text-stone-500 leading-relaxed">
                Wij gebruiken cookies om de website te verbeteren en je winkelervaring te personaliseren.
                Bekijk ons{' '}
                <Link to="/legal/privacybeleid" className="font-medium text-accent-600 hover:text-accent-700">
                  privacybeleid
                </Link>{' '}
                voor meer informatie.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={decline}
              className="rounded-lg px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100"
            >
              Weigeren
            </button>
            <button
              onClick={accept}
              className="rounded-lg bg-accent-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-700"
            >
              Accepteren
            </button>
            <button
              onClick={decline}
              className="rounded-md p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 md:hidden"
              aria-label="Sluiten"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
