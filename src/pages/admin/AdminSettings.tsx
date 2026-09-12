import { useEffect, useState } from 'react';
import { Save, Check } from 'lucide-react';
import {
  fetchAllSiteSettings, updateSiteSetting,
  fetchAllSiteContent, updateSiteContent,
  fetchAdminWhatsappSettings, updateWhatsappSettings,
  fetchAllLegalPages, updateLegalPage, createLegalPage,
} from '../../lib/api';
import type { SiteSetting, SiteContent, WhatsappSettings, LegalPage } from '../../lib/types';

export default function AdminSettings() {
  const [tab, setTab] = useState<'general' | 'content' | 'whatsapp' | 'legal'>('general');
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [content, setContent] = useState<SiteContent[]>([]);
  const [whatsapp, setWhatsapp] = useState<WhatsappSettings | null>(null);
  const [legalPages, setLegalPages] = useState<LegalPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [s, c, w, l] = await Promise.all([
        fetchAllSiteSettings(),
        fetchAllSiteContent(),
        fetchAdminWhatsappSettings(),
        fetchAllLegalPages(),
      ]);
      setSettings(s);
      setContent(c);
      setWhatsapp(w);
      setLegalPages(l);
    } catch { /* fail silently */ }
    finally { setLoading(false); }
  };

  const showSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const saveSetting = async (key: string, value: string) => {
    try { await updateSiteSetting(key, value); showSaved(); }
    catch (e) { alert(e instanceof Error ? e.message : 'Opslaan mislukt.'); }
  };

  const saveContent = async (section: string, updates: Partial<SiteContent>) => {
    try { await updateSiteContent(section, updates); showSaved(); }
    catch (e) { alert(e instanceof Error ? e.message : 'Opslaan mislukt.'); }
  };

  const saveWhatsapp = async () => {
    if (!whatsapp) return;
    try { await updateWhatsappSettings(whatsapp.id, whatsapp); showSaved(); }
    catch (e) { alert(e instanceof Error ? e.message : 'Opslaan mislukt.'); }
  };

  const saveLegalPage = async (p: LegalPage) => {
    try { await updateLegalPage(p.id, { title: p.title, body: p.body, is_published: p.is_published }); showSaved(); }
    catch (e) { alert(e instanceof Error ? e.message : 'Opslaan mislukt.'); }
  };

  const createLegal = async () => {
    const slug = prompt('Slug voor nieuwe pagina (bijv. cookiebeleid):');
    if (!slug) return;
    const title = prompt('Titel:') ?? slug;
    try { await createLegalPage({ slug, title, body: '' }); await load(); }
    catch (e) { alert(e instanceof Error ? e.message : 'Aanmaken mislukt.'); }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-stone-300 border-t-accent-600" />
      </div>
    );
  }

  const tabs = [
    { id: 'general' as const, label: 'Algemeen' },
    { id: 'content' as const, label: 'Content' },
    { id: 'whatsapp' as const, label: 'WhatsApp' },
    { id: 'legal' as const, label: 'Juridisch' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-900">Instellingen</h2>
        {saved && <span className="flex items-center gap-1 text-sm text-green-600"><Check className="h-4 w-4" /> Opgeslagen</span>}
      </div>

      <div className="flex gap-1 border-b border-stone-200">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-accent-600 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-stone-900">Site op privé</h3>
                <p className="mt-1 text-sm text-stone-500">Zet de hele winkel in onderhoudsmodus. Bezoekers zien een &quot;we zijn bijna zover&quot;-pagina. Het beheer blijft gewoon bereikbaar.</p>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
                <input
                  type="checkbox"
                  checked={settings.find((s) => s.key === 'site_private')?.value === 'true'}
                  onChange={(e) => saveSetting('site_private', e.target.checked ? 'true' : 'false')}
                  className="h-5 w-5 accent-stone-900"
                />
                Prive
              </label>
            </div>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-5 space-y-4">
            {settings.map((s) => (
            <div key={s.id}>
              <label className="input-label">{s.key}</label>
              <div className="flex gap-2">
                <input type="text" defaultValue={s.value ?? ''} onBlur={(e) => saveSetting(s.key, e.target.value)} className="input-field" />
              </div>
              <p className="mt-1 text-xs text-stone-400">{s.category}</p>
            </div>
            ))}
            {settings.length === 0 && <p className="text-sm text-stone-400">Geen instellingen gevonden.</p>}
          </div>
        </div>
      )}

      {tab === 'content' && (
        <div className="space-y-4">
          {content.map((c) => (
            <div key={c.id} className="rounded-xl border border-stone-200 bg-white p-5 space-y-3">
              <h3 className="font-semibold text-stone-900">{c.section}</h3>
              <div><label className="input-label">Titel</label><input type="text" defaultValue={c.title ?? ''} onBlur={(e) => saveContent(c.section, { title: e.target.value })} className="input-field" /></div>
              <div><label className="input-label">Subtitel</label><input type="text" defaultValue={c.subtitle ?? ''} onBlur={(e) => saveContent(c.section, { subtitle: e.target.value })} className="input-field" /></div>
              <div><label className="input-label">Tekst</label><textarea defaultValue={c.body ?? ''} onBlur={(e) => saveContent(c.section, { body: e.target.value })} className="input-field" rows={3} /></div>
              <div><label className="input-label">Afbeelding URL</label><input type="text" defaultValue={c.image_url ?? ''} onBlur={(e) => saveContent(c.section, { image_url: e.target.value })} className="input-field" /></div>
            </div>
          ))}
          {content.length === 0 && <p className="text-sm text-stone-400">Geen content gevonden.</p>}
        </div>
      )}

      {tab === 'whatsapp' && whatsapp && (
        <div className="rounded-xl border border-stone-200 bg-white p-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="input-label">Naam medewerker</label><input type="text" value={whatsapp.employee_name} onChange={(e) => setWhatsapp({ ...whatsapp, employee_name: e.target.value })} className="input-field" /></div>
            <div><label className="input-label">Status</label><input type="text" value={whatsapp.employee_status} onChange={(e) => setWhatsapp({ ...whatsapp, employee_status: e.target.value })} className="input-field" /></div>
            <div><label className="input-label">Telefoonnummer</label><input type="text" value={whatsapp.phone_number} onChange={(e) => setWhatsapp({ ...whatsapp, phone_number: e.target.value })} className="input-field" /></div>
            <div><label className="input-label">Profiel foto URL</label><input type="text" value={whatsapp.profile_image_url ?? ''} onChange={(e) => setWhatsapp({ ...whatsapp, profile_image_url: e.target.value })} className="input-field" /></div>
          </div>
          <div><label className="input-label">Welkomstbericht</label><textarea value={whatsapp.welcome_message} onChange={(e) => setWhatsapp({ ...whatsapp, welcome_message: e.target.value })} className="input-field" rows={2} /></div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-stone-700"><input type="checkbox" checked={whatsapp.is_enabled} onChange={(e) => setWhatsapp({ ...whatsapp, is_enabled: e.target.checked })} className="accent-accent-600" /> Ingeschakeld</label>
            <label className="flex items-center gap-2 text-sm text-stone-700"><input type="checkbox" checked={whatsapp.show_on_desktop} onChange={(e) => setWhatsapp({ ...whatsapp, show_on_desktop: e.target.checked })} className="accent-accent-600" /> Toon op desktop</label>
            <label className="flex items-center gap-2 text-sm text-stone-700"><input type="checkbox" checked={whatsapp.show_on_mobile} onChange={(e) => setWhatsapp({ ...whatsapp, show_on_mobile: e.target.checked })} className="accent-accent-600" /> Toon op mobiel</label>
          </div>
          <button onClick={saveWhatsapp} className="btn-primary"><Save className="h-4 w-4" /> Opslaan</button>
        </div>
      )}

      {tab === 'legal' && (
        <div className="space-y-4">
          <button onClick={createLegal} className="btn-primary">Nieuwe pagina</button>
          {legalPages.map((p) => (
            <div key={p.id} className="rounded-xl border border-stone-200 bg-white p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-stone-900">{p.title}</h3>
                <label className="flex items-center gap-2 text-sm text-stone-700"><input type="checkbox" checked={p.is_published} onChange={(e) => setLegalPages(legalPages.map((x) => x.id === p.id ? { ...x, is_published: e.target.checked } : x))} className="accent-accent-600" /> Gepubliceerd</label>
              </div>
              <div><label className="input-label">Titel</label><input type="text" value={p.title} onChange={(e) => setLegalPages(legalPages.map((x) => x.id === p.id ? { ...x, title: e.target.value } : x))} className="input-field" /></div>
              <div><label className="input-label">Tekst</label><textarea value={p.body ?? ''} onChange={(e) => setLegalPages(legalPages.map((x) => x.id === p.id ? { ...x, body: e.target.value } : x))} className="input-field" rows={6} /></div>
              <button onClick={() => saveLegalPage(p)} className="btn-outline">Opslaan</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
