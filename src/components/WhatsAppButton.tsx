import { useEffect, useState } from 'react';
import { X, Check } from 'lucide-react';

type WhatsAppData = {
  is_enabled: boolean;
  employee_name: string;
  employee_status: string;
  phone_number: string;
  profile_image_url: string | null;
  welcome_message: string;
  show_on_desktop: boolean;
  show_on_mobile: boolean;
};

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

export function WhatsAppButton() {
  const [data, setData] = useState<WhatsAppData | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/whatsapp_settings?limit=1`, {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        });
        const json = await res.json();
        if (json[0]) setData(json[0]);
      } catch {
        // fail silently
      }
    })();
  }, []);

  if (!data || !data.is_enabled) return null;

  const phone = data.phone_number.replace(/\D/g, '');
  const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent('Hoi! ik heb een vraag over..')}`;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-72 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl">
          <div className="flex items-center justify-between bg-[#075E54] p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-full bg-white/20">
                {data.profile_image_url ? (
                  <img src={data.profile_image_url} alt={data.employee_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white">
                    <WhatsAppIcon className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{data.employee_name}</p>
                <p className="flex items-center gap-1 text-xs text-green-200">
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                  {data.employee_status}
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-full p-1 text-white/80 hover:bg-white/20">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="bg-[#ECE5DD] p-4 min-h-28">
            <div className="relative rounded-lg bg-white p-3 text-sm text-stone-700 shadow-sm">
              <p>Hoi! Stel je vraag over een gitaar en we helpen je graag verder.</p>
              <span className="absolute bottom-1 right-2 text-[10px] text-stone-400">12:30</span>
            </div>
          </div>
          <div className="border-t border-stone-100 bg-white p-3">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1ebd5b]"
            >
              <WhatsAppIcon className="h-5 w-5" />
              Start gesprek
            </a>
          </div>
        </div>
      )}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-colors hover:bg-[#1ebd5b] animate-bounce-subtle"
          aria-label="WhatsApp"
        >
          {open ? <X className="h-6 w-6" /> : <WhatsAppIcon className="h-7 w-7" />}
        </button>
        {!open && (
          <span className="absolute top-0 right-0 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-red-500 border-2 border-white" />
          </span>
        )}
      </div>
    </div>
  );
}
