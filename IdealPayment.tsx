import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BANK_LOGOS } from '../data/bankLogos';
import idealLogo from '../assets/ideal/ideal-logo.svg';
import successLight from '../assets/ideal/success-light.png';
import successDark from '../assets/ideal/success-dark.png';

const PRIMARY = '#CC0066';
const BG = '#EEF5F7';
const FONT = '"Lexend Deca", sans-serif';
const HEAD = '"Roboto Slab", Georgia, serif';

const BANKS = [
  'ABN AMRO', 'Adyen', 'ASN Bank', 'ASN Bank vh RegioBank',
  'ASN Bank voorheen SNS', 'bunq', 'BUUT', 'Finom', 'ING', 'Knab',
  'Mollie', 'N26', 'Nationale-Nederlanden', 'Rabobank', 'Revolut',
  'Triodos Bank', 'Van Lanschot Kempen', 'Yoursafe',
];

const MONOGRAMS: Record<string, { text: string; background: string; color: string }> = {
  Adyen: { text: 'adyen', background: '#0b1f33', color: '#fff' },
  Finom: { text: 'finom', background: '#20252d', color: '#fff' },
};

function formatAmount(value: string | null) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '€0,00';
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);
}

function loadFonts() {
  const id = 'wavegitaar-payment-fonts';
  if (document.getElementById(id)) return () => {};
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Lexend+Deca:wght@300;400;500;600&family=Roboto+Slab:wght@400;700&display=swap';
  document.head.appendChild(link);
  return () => link.remove();
}

function BankLogo({ name }: { name: string }) {
  const [failed, setFailed] = useState(false);
  const aliases: Record<string, string> = {
    'ASN Bank vh RegioBank': 'RegioBank',
  };
  const src = BANK_LOGOS[name] || BANK_LOGOS[aliases[name]];
  const mark = MONOGRAMS[name];

  if (mark) {
    return (
      <div style={{ ...logoBox, background: mark.background, color: mark.color, fontSize: name === 'Adyen' ? 15 : 14, fontWeight: 600, letterSpacing: '-.4px' }}>
        {mark.text}
      </div>
    );
  }

  if (!src || failed) {
    return (
      <div style={{ ...logoBox, background: '#fff', color: '#4d5660', fontSize: 16, fontWeight: 700 }}>
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <div style={logoBox}>
      <img
        src={src}
        alt=""
        onError={() => setFailed(true)}
        style={{ width: 40, height: 40, objectFit: 'contain', display: 'block' }}
      />
    </div>
  );
}

export default function IdealPayment() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const amount = formatAmount(params.get('amount'));
  const order = params.get('order') || '';
  const tracking = params.get('tracking') || '';

  const [introLoading, setIntroLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [transfer, setTransfer] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [dark, setDark] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => loadFonts(), []);

  useEffect(() => {
    const timer = window.setTimeout(() => setIntroLoading(false), 800);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!success) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const colors = [PRIMARY, '#ff6eb4', '#ffd700', '#00c8ff', '#7cfc00', '#ff4500'];
    const pieces = Array.from({ length: 85 }, () => ({
      x: Math.random() * canvas.width,
      y: -Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.7,
      vy: 0.55 + Math.random() * 0.75,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.012,
      w: 5 + Math.random() * 6,
      h: 3 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of pieces) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();

        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        if (p.y > canvas.height + 20) {
          p.y = -20 - Math.random() * 120;
          p.x = Math.random() * canvas.width;
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [success]);

  const root = {
    minHeight: '100dvh',
    background: dark ? '#111315' : BG,
    color: dark ? '#fff' : '#232323',
    fontFamily: FONT,
    display: 'flex',
    flexDirection: 'column' as const,
  };

  const goToOrderSuccess = () => {
    navigate(`/checkout/success?order=${encodeURIComponent(order)}&tracking=${encodeURIComponent(tracking)}`);
  };

  const copy = (value: string, key: string) => {
    navigator.clipboard?.writeText(value.replace(/\s/g, '')).then(() => {
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1500);
    });
  };

  if (introLoading) {
    return (
      <div style={{ ...root, position: 'fixed', inset: 0, alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
          <div style={{ width: 108, height: 108, borderRadius: 28, background: '#fff', boxShadow: '0 12px 40px rgba(0,0,0,.10)', display: 'grid', placeItems: 'center', animation: 'idealPulse 1.1s ease-in-out infinite' }}>
            <img src={idealLogo} alt="iDEAL" style={{ width: 78, height: 48, objectFit: 'contain', display: 'block' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#5e6870', fontSize: 14 }}>
            <span>Beveiligde betaalomgeving openen</span>
            <span style={{ display: 'inline-flex', gap: 3 }}><i style={dot} /><i style={{ ...dot, animationDelay: '.15s' }} /><i style={{ ...dot, animationDelay: '.3s' }} /></span>
          </div>
        </div>
        <style>{`@keyframes idealPulse{0%,100%{transform:scale(1);opacity:.96}50%{transform:scale(1.035);opacity:1}}@keyframes dotPulse{0%,80%,100%{transform:scale(.65);opacity:.35}40%{transform:scale(1);opacity:1}}`}</style>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ ...root, position: 'fixed', inset: 0, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', background: dark ? '#111315' : BG }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, width: 'min(600px, calc(100% - 40px))', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img
            src={dark ? successDark : successLight}
            alt=""
            style={{ width: 240, height: 240, objectFit: 'contain', display: 'block', margin: '0 auto 4px' }}
          />
          <h1 style={{ ...successHeading, margin: '0 0 10px' }}>Betaling is <span style={{ color: PRIMARY, fontStyle: 'italic' }}>gelukt!</span></h1>
          <p style={{ ...successText, margin: '0 0 28px' }}>Bedankt voor je betaling aan WaveGitaar.</p>
          <button onClick={goToOrderSuccess} style={btn}>Verder</button>
          <button onClick={() => setDark(v => !v)} style={themeButton}>{dark ? 'Lichte modus' : 'Donkere modus'}</button>
        </div>
      </div>
    );
  }

  const pageTop = (
    <div style={{ width: 'min(860px, calc(100% - 32px))', margin: '0 auto', padding: '26px 0 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
      <img src={idealLogo} alt="iDEAL" style={{ width: 92, height: 40, objectFit: 'contain', display: 'block' }} />
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{amount}</div>
        <div style={{ fontSize: 12, opacity: .55 }}>WaveGitaar</div>
      </div>
    </div>
  );

  if (confirm) {
    return (
      <div style={root}>
        {pageTop}
        <main style={content}>
          <section style={panel(dark)}>
            <button onClick={() => setConfirm(false)} style={back}>← Terug</button>
            <h2 style={heading}>Betaling bevestigen</h2>
            <p style={muted}>Heb je het bedrag al overgemaakt naar onze rekening?</p>
            <button onClick={() => setSuccess(true)} style={btn}>Ja, ik heb betaald</button>
            <button onClick={() => setConfirm(false)} style={secondary}>Nee, nog niet betaald</button>
          </section>
        </main>
        <div style={bottomBar}>
          <span>WaveGitaar betaalomgeving</span>
          <button onClick={() => setDark(v => !v)} style={themeButton}>{dark ? 'Lichte modus' : 'Donkere modus'}</button>
        </div>
      </div>
    );
  }

  if (transfer) {
    const details = [
      ['Bedrag', amount, 'bedrag'],
      ['Ten name van', 'WaveGitaar', 'naam'],
      ['IBAN', 'NL00 0000 0000 0000 00', 'iban'],
      ['Omschrijving', order || 'WaveGitaar bestelling', 'omschrijving'],
    ];

    return (
      <div style={root}>
        {pageTop}
        <main style={content}>
          <section style={panel(dark)}>
            <button onClick={() => setTransfer(false)} style={back}>← Terug</button>
            <h2 style={heading}>Handmatig overmaken</h2>
            <p style={muted}>Maak het bedrag over naar onderstaande gegevens. Je bestelling wordt verwerkt na ontvangst van de betaling.</p>
            <div style={{ background: dark ? '#191c20' : '#fff', border: `1px solid ${dark ? '#30343a' : '#d9dfe2'}`, borderRadius: 16, overflow: 'hidden', marginBottom: 22, width: '100%' }}>
              {details.map(([label, value, key], i) => (
                <div key={key} onClick={() => key !== 'bedrag' && key !== 'naam' && copy(value, key)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 16px', borderBottom: i < 3 ? `1px solid ${dark ? '#30343a' : '#edf0f1'}` : 'none', cursor: key === 'iban' || key === 'omschrijving' ? 'pointer' : 'default' }}>
                  <span style={{ width: 100, flexShrink: 0, fontSize: 12, opacity: .55 }}>{label}</span>
                  <span style={{ flex: 1, fontSize: 13, overflowWrap: 'anywhere' }}>{value}</span>
                  {(key === 'iban' || key === 'omschrijving') && <span style={{ fontSize: 12, color: copied === key ? '#07963a' : PRIMARY, whiteSpace: 'nowrap' }}>{copied === key ? 'Gekopieerd' : 'Kopieer'}</span>}
                </div>
              ))}
            </div>
            <button onClick={() => setConfirm(true)} style={btn}>Ik heb betaald</button>
            <button onClick={() => setTransfer(false)} style={secondary}>Annuleren</button>
          </section>
        </main>
        <div style={bottomBar}><span>WaveGitaar betaalomgeving</span><button onClick={() => setDark(v => !v)} style={themeButton}>{dark ? 'Lichte modus' : 'Donkere modus'}</button></div>
      </div>
    );
  }

  if (selected && loading) {
    return (
      <div style={root}>
        {pageTop}
        <main style={content}>
          <section style={{ ...panel(dark), minHeight: 420, justifyContent: 'center' }}>
            <div style={{ width: 54, height: 54, borderRadius: '50%', border: `3px solid ${dark ? '#363b42' : '#d9dfe2'}`, borderTopColor: PRIMARY, animation: 'spin .85s linear infinite' }} />
            <p style={{ ...muted, marginTop: 20, marginBottom: 0 }}>Verbinding maken met {selected}…</p>
          </section>
        </main>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (selected) {
    return (
      <div style={root}>
        {pageTop}
        <main style={content}>
          <section style={panel(dark)}>
            <button onClick={() => setSelected(null)} style={back}>← Terug naar banken</button>
            <h2 style={heading}>Betaling kan niet worden afgerond</h2>
            <p style={muted}>Op dit moment kan de betaling via {selected} niet worden afgerond. Je kunt je bestelling alsnog verwerken door het bedrag handmatig over te maken.</p>
            <button onClick={() => setTransfer(true)} style={btn}>Handmatig overmaken</button>
            <button onClick={() => setSelected(null)} style={secondary}>Andere bank kiezen</button>
          </section>
        </main>
        <div style={bottomBar}><span>WaveGitaar betaalomgeving</span><button onClick={() => setDark(v => !v)} style={themeButton}>{dark ? 'Lichte modus' : 'Donkere modus'}</button></div>
      </div>
    );
  }

  return (
    <div style={root}>
      {pageTop}
      <main style={content}>
        <section style={panel(dark)}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: '.02em', textTransform: 'uppercase', opacity: .5, marginBottom: 8 }}>Betaling</div>
            <h1 style={mainHeading}>Kies je bank</h1>
            <p style={{ ...muted, marginBottom: 0 }}>Selecteer je bank om verder te gaan.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 10, width: '100%' }}>
            {BANKS.map(name => (
              <button
                key={name}
                onClick={() => {
                  setSelected(name);
                  setLoading(true);
                  window.setTimeout(() => setLoading(false), 1800);
                }}
                style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '10px 12px', border: `1px solid ${dark ? '#30343a' : '#d9dfe2'}`, borderRadius: 14, background: dark ? '#191c20' : '#fff', color: 'inherit', transition: 'transform .15s ease, box-shadow .15s ease' }}
              >
                <BankLogo name={name} />
                <span style={{ fontSize: 14, fontWeight: 500 }}>{name}</span>
              </button>
            ))}
          </div>
        </section>
      </main>
      <div style={bottomBar}><span>WaveGitaar betaalomgeving</span><button onClick={() => setDark(v => !v)} style={themeButton}>{dark ? 'Lichte modus' : 'Donkere modus'}</button></div>
    </div>
  );
}

const logoBox = {
  width: 48,
  height: 48,
  flexShrink: 0,
  borderRadius: 10,
  display: 'grid',
  placeItems: 'center',
  overflow: 'hidden',
};

const dot = {
  width: 5,
  height: 5,
  borderRadius: '50%',
  background: '#68727a',
  animation: 'dotPulse 1s ease-in-out infinite',
};

const content = {
  flex: 1,
  width: 'min(860px, calc(100% - 32px))',
  margin: '0 auto',
  padding: '8px 0 34px',
  display: 'flex',
  justifyContent: 'center',
};

const panel = (dark: boolean) => ({
  width: '100%',
  maxWidth: 720,
  background: dark ? '#15181b' : 'rgba(255,255,255,.96)',
  border: `1px solid ${dark ? '#2d3238' : '#dce2e5'}`,
  borderRadius: 22,
  boxShadow: dark ? '0 20px 60px rgba(0,0,0,.25)' : '0 20px 60px rgba(30,55,65,.10)',
  padding: '34px clamp(20px, 4vw, 42px) 40px',
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
});

const heading = {
  margin: '0 0 10px',
  fontFamily: HEAD,
  fontWeight: 400,
  fontSize: 30,
  lineHeight: 1.2,
  textAlign: 'center' as const,
};

const mainHeading = {
  ...heading,
  fontSize: 'clamp(30px, 5vw, 42px)',
  marginBottom: 10,
};

const successHeading = {
  fontFamily: HEAD,
  fontWeight: 400,
  fontSize: 'clamp(30px, 5vw, 38px)',
  lineHeight: 1.2,
};

const successText = {
  fontSize: 14,
  opacity: .62,
  lineHeight: 1.7,
};

const muted = {
  textAlign: 'center' as const,
  opacity: .62,
  lineHeight: 1.7,
  fontSize: 14,
  maxWidth: 560,
  margin: '0 0 26px',
};

const btn = {
  all: 'unset' as const,
  boxSizing: 'border-box' as const,
  width: '100%',
  maxWidth: 520,
  background: PRIMARY,
  color: '#fff',
  padding: '16px 20px',
  borderRadius: 13,
  textAlign: 'center' as const,
  cursor: 'pointer',
  fontFamily: FONT,
  fontSize: 14,
  fontWeight: 500,
  marginBottom: 10,
};

const secondary = {
  ...btn,
  background: '#17191b',
};

const back = {
  all: 'unset' as const,
  alignSelf: 'flex-start',
  color: PRIMARY,
  fontFamily: FONT,
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  marginBottom: 22,
};

const bottomBar = {
  width: 'min(860px, calc(100% - 32px))',
  margin: '0 auto',
  padding: '16px 0 22px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  fontSize: 11,
  opacity: .55,
};

const themeButton = {
  all: 'unset' as const,
  cursor: 'pointer',
  fontFamily: FONT,
  fontSize: 11,
};
