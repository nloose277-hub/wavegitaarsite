import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { fetchSiteSettings, fetchWhatsappSettings, fetchSiteContent } from './api';
import type { WhatsappSettings, SiteContent } from './types';

type SiteContextType = {
  settings: Record<string, string>;
  whatsapp: WhatsappSettings | null;
  content: Record<string, SiteContent>;
  loading: boolean;
  refresh: () => void;
};

const SiteContext = createContext<SiteContextType | null>(null);

export function SiteProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [whatsapp, setWhatsapp] = useState<WhatsappSettings | null>(null);
  const [content, setContent] = useState<Record<string, SiteContent>>({});
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [s, w, c] = await Promise.all([
          fetchSiteSettings(),
          fetchWhatsappSettings(),
          fetchSiteContent(),
        ]);
        setSettings(s);
        setWhatsapp(w);
        setContent(c);
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshKey]);

  return (
    <SiteContext.Provider
      value={{ settings, whatsapp, content, loading, refresh: () => setRefreshKey((k) => k + 1) }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used within SiteProvider');
  return ctx;
}
