import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BANK_LOGOS } from '../data/bankLogos';
import idealLogo from '../assets/ideal/ideal-logo.svg';
import adyenLogo from '../assets/ideal/adyen.png';
import finomLogo from '../assets/ideal/finom.png';
import successLight from '../assets/ideal/success-light.png';
import successDark from '../assets/ideal/success-dark.png';

const PINK = '#CC0066';
const BG = '#EEF5F7';
const TEXT = '#232323';
const BODY_FONT = '"Lexend Deca", sans-serif';
const HEAD_FONT = '"Roboto Slab", serif';

const BANKS = [
  'ABN AMRO', 'Adyen', 'ASN Bank', 'ASN Bank vh RegioBank',
  'ASN Bank voorheen SNS', 'bunq', 'BUUT', 'Finom', 'ING', 'Knab',
  'Mollie', 'N26', 'Nationale-Nederlanden', 'Rabobank', 'Revolut',
  'Triodos Bank', 'Van Lanschot Kempen', 'Yoursafe',
];

function formatAmount(value: string | null) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '€0,00';
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);
}

function useIdealFonts() {
  useEffect(() => {
    const id = 'ideal-official-fonts';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Lexend+Deca:wght@300;400;500;600&family=Roboto+Slab:wght@600&display=swap';
      document.head.appendChild(link);
    }
  }, []);
}

function useLockPage() {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);
}

function BankLogo({ name }: { name: string }) {
  const [failed, setFailed] = useState(false);
  const aliases: Record<string, string> = {
    'ASN Bank vh RegioBank': 'RegioBank',
    'bunq': 'Bunq',
  };
  const local = name === 'Adyen' ? adyenLogo : name === 'Finom' ? finomLogo : undefined;
  const src = local || BANK_LOGOS[name] || BANK_LOGOS[aliases[name]];

  if (!src || failed) {
    return (
      <div className="bank-logo-fallback" aria-hidden="true">
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <div className="bank-logo">
      <img src={src} alt="" onError={() => setFailed(true)} />
    </div>
  );
}

function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const colors = [PINK, '#FFD500', '#00A7E1', '#6DD400', '#FF7A00', '#F26AAE'];
    const pieces = Array.from({ length: 72 }, () => ({
      x: Math.random() * window.innerWidth,
      y: -Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.35,
      vy: 0.32 + Math.random() * 0.45,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.008,
      w: 5 + Math.random() * 6,
      h: 3 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
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
        if (p.y > window.innerHeight + 20) {
          p.y = -20;
          p.x = Math.random() * window.innerWidth;
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [active]);

  return <canvas ref={canvasRef} className="confetti" aria-hidden="true" />;
}

export default function IdealPayment() {
  useIdealFonts();
  useLockPage();

  const [params] = useSearchParams();
  const navigate = useNavigate();
  const amount = formatAmount(params.get('amount'));
  const order = params.get('order') || '';
  const tracking = params.get('tracking') || '';

  const [loadingIntro, setLoadingIntro] = useState(true);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [bankLoading, setBankLoading] = useState(false);
  const [transfer, setTransfer] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoadingIntro(false), 800);
    return () => window.clearTimeout(timer);
  }, []);

  const copy = async (value: string, key: string) => {
    try {
      await navigator.clipboard?.writeText(value.replace(/\s/g, ''));
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard can be unavailable in some browsers; the page remains usable.
    }
  };

  const goToOrderSuccess = () => {
    navigate(`/checkout/success?order=${encodeURIComponent(order)}&tracking=${encodeURIComponent(tracking)}`);
  };

  if (loadingIntro) {
    return (
      <div className="ideal-root ideal-loading">
        <div className="loading-center">
          <img src={idealLogo} alt="iDEAL | Wero" className="loading-logo" />
          <div className="loading-dots" aria-label="Laden"><i /><i /><i /></div>
        </div>
        <IdealStyles />
      </div>
    );
  }

  if (success) {
    return (
      <div className={`ideal-root success-root ${dark ? 'dark' : ''}`}>
        <Confetti active />
        <main className="success-content">
          <img src={dark ? successDark : successLight} alt="" className="success-image" />
          <h1>Betaling geslaagd</h1>
          <p>Je betaling is succesvol verwerkt.</p>
          <button className="primary-button" onClick={goToOrderSuccess}>Verder</button>
          <button className="mode-button" onClick={() => setDark(v => !v)}>{dark ? 'Lichte modus' : 'Donkere modus'}</button>
        </main>
        <IdealStyles />
      </div>
    );
  }

  const header = (
    <header className="ideal-header">
      <img src={idealLogo} alt="iDEAL | Wero" />
      <div className="amount">
        <strong>{amount}</strong>
        <span>WaveGitaar</span>
      </div>
    </header>
  );

  if (confirm) {
    return (
      <div className={`ideal-root ${dark ? 'dark' : ''}`}>
        {header}
        <main className="center-main">
          <section className="payment-card">
            <button className="back-button" onClick={() => setConfirm(false)}>← Terug</button>
            <h1>Betaling bevestigen</h1>
            <p>Heb je het bedrag al handmatig overgemaakt?</p>
            <button className="primary-button" onClick={() => setSuccess(true)}>Ja, ik heb betaald</button>
            <button className="secondary-button" onClick={() => setConfirm(false)}>Nee, nog niet betaald</button>
          </section>
        </main>
        <IdealStyles />
      </div>
    );
  }

  if (transfer) {
    const details: [string, string, string][] = [
      ['Bedrag', amount, 'amount'],
      ['Ten name van', 'WaveGitaar', 'name'],
      ['IBAN', 'NL00 0000 0000 0000 00', 'iban'],
      ['Omschrijving', order || 'WaveGitaar bestelling', 'reference'],
    ];

    return (
      <div className={`ideal-root ${dark ? 'dark' : ''}`}>
        {header}
        <main className="center-main">
          <section className="payment-card">
            <button className="back-button" onClick={() => setTransfer(false)}>← Terug</button>
            <h1>Handmatig overmaken</h1>
            <p>Maak het bedrag over met onderstaande betaalgegevens.</p>
            <div className="transfer-list">
              {details.map(([label, value, key], index) => (
                <div className="transfer-row" key={key}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                  {(key === 'iban' || key === 'reference') && (
                    <button onClick={() => copy(value, key)}>{copied === key ? 'Gekopieerd' : 'Kopieer'}</button>
                  )}
                </div>
              ))}
            </div>
            <button className="primary-button" onClick={() => setConfirm(true)}>Ik heb betaald</button>
          </section>
        </main>
        <IdealStyles />
      </div>
    );
  }

  if (selectedBank && bankLoading) {
    return (
      <div className={`ideal-root ${dark ? 'dark' : ''}`}>
        {header}
        <main className="center-main">
          <section className="payment-card bank-loading">
            <div className="spinner" />
            <h1>Bankomgeving openen</h1>
            <p>{selectedBank}</p>
          </section>
        </main>
        <IdealStyles />
      </div>
    );
  }

  if (selectedBank) {
    return (
      <div className={`ideal-root ${dark ? 'dark' : ''}`}>
        {header}
        <main className="center-main">
          <section className="payment-card">
            <button className="back-button" onClick={() => setSelectedBank(null)}>← Terug naar banken</button>
            <h1>Handmatig betalen</h1>
            <p>De testomgeving kan geen echte banktransactie uitvoeren. Je kunt het bedrag handmatig overmaken.</p>
            <button className="primary-button" onClick={() => setTransfer(true)}>Handmatig overmaken</button>
            <button className="secondary-button" onClick={() => setSelectedBank(null)}>Andere bank kiezen</button>
          </section>
        </main>
        <IdealStyles />
      </div>
    );
  }

  return (
    <div className={`ideal-root ${dark ? 'dark' : ''}`}>
      {header}
      <main className="bank-main">
        <section className="bank-section">
          <div className="bank-title">
            <h1>Kies je bank</h1>
            <p>Selecteer je bank om verder te gaan.</p>
          </div>
          <div className="bank-grid">
            {BANKS.map(name => (
              <button
                className="bank-row"
                key={name}
                onClick={() => {
                  setSelectedBank(name);
                  setBankLoading(true);
                  window.setTimeout(() => setBankLoading(false), 900);
                }}
              >
                <BankLogo name={name} />
                <span>{name}</span>
              </button>
            ))}
          </div>
          <div className="secure-note">Veilige betaalomgeving</div>
        </section>
      </main>
      <IdealStyles />
    </div>
  );
}

function IdealStyles() {
  return (
    <style>{`
      .ideal-root{position:fixed;inset:0;z-index:999999;overflow:auto;background:${BG};color:${TEXT};font-family:${BODY_FONT};font-weight:300;line-height:1.5;letter-spacing:.00938em;-webkit-font-smoothing:antialiased;}
      .ideal-root *{box-sizing:border-box;}
      .ideal-root button{font-family:${BODY_FONT};}
      .ideal-root.dark{background:#121212;color:#fff;}
      .ideal-header{height:92px;background:${PINK};display:flex;align-items:center;justify-content:space-between;padding:0 clamp(20px,5vw,64px);color:#fff;}
      .ideal-header img{width:106px;height:40px;object-fit:contain;display:block;}
      .amount{text-align:right;display:flex;flex-direction:column;line-height:1.25;}
      .amount strong{font-size:22px;font-weight:600;letter-spacing:-.02em;}
      .amount span{font-size:13px;opacity:.9;margin-top:3px;}
      .ideal-loading{display:grid;place-items:center;background:#fff;}
      .loading-center{display:flex;flex-direction:column;align-items:center;gap:22px;}
      .loading-logo{width:106px;height:40px;object-fit:contain;animation:idealPulse 1.05s ease-in-out infinite;}
      .loading-dots{display:flex;gap:5px;}
      .loading-dots i{width:5px;height:5px;border-radius:50%;background:#68727a;animation:dotPulse 1s ease-in-out infinite;}
      .loading-dots i:nth-child(2){animation-delay:.15s}.loading-dots i:nth-child(3){animation-delay:.3s}
      .bank-main{min-height:calc(100dvh - 92px);display:flex;justify-content:center;padding:clamp(42px,7vh,72px) 20px 48px;}
      .bank-section{width:min(720px,100%);}
      .bank-title{text-align:center;margin-bottom:30px;}
      .bank-title h1,.payment-card h1{font-family:${HEAD_FONT};font-weight:600;margin:0 0 12px;font-size:clamp(30px,4vw,42px);line-height:1.15;letter-spacing:-.025em;}
      .bank-title p,.payment-card>p{margin:0;color:#68727a;font-size:15px;}
      .dark .bank-title p,.dark .payment-card>p{color:#b7bec4;}
      .bank-grid{display:grid;grid-template-columns:1fr;gap:10px;}
      .bank-row{width:100%;min-height:72px;border:1px solid #9aa1a5;border-radius:12px;background:#fff;color:#17191b;display:flex;align-items:center;gap:16px;padding:8px 14px;cursor:pointer;text-align:left;font-size:16px;font-weight:400;transition:border-color .16s ease,box-shadow .16s ease,transform .16s ease;}
      .bank-row:hover{border-color:#555;box-shadow:0 4px 16px rgba(35,35,35,.08);transform:translateY(-1px);}
      .dark .bank-row{background:#1c1c1c;color:#fff;border-color:#444;}
      .bank-logo{width:48px;height:48px;border-radius:8px;display:grid;place-items:center;overflow:hidden;flex:0 0 48px;background:#fff;}
      .bank-logo img{width:48px;height:48px;object-fit:contain;display:block;}
      .bank-logo-fallback{width:48px;height:48px;border-radius:8px;background:#e9eef0;color:#333;display:grid;place-items:center;font-weight:600;font-size:14px;flex:0 0 48px;}
      .secure-note{text-align:center;color:#7a858c;font-size:12px;margin-top:24px;}
      .center-main{min-height:calc(100dvh - 92px);display:grid;place-items:center;padding:32px 20px;}
      .payment-card{width:min(560px,100%);background:#fff;border:1px solid #d7dee1;border-radius:20px;box-shadow:0 18px 55px rgba(30,55,65,.10);padding:36px clamp(22px,5vw,48px);display:flex;flex-direction:column;align-items:center;text-align:center;}
      .dark .payment-card{background:#1c1c1c;border-color:#363b42;box-shadow:0 18px 55px rgba(0,0,0,.3);}
      .back-button{align-self:flex-start;border:0;background:none;color:${PINK};font-size:13px;font-weight:500;cursor:pointer;padding:0;margin-bottom:24px;}
      .primary-button,.secondary-button{width:100%;border:0;border-radius:12px;padding:16px 20px;font-size:15px;font-weight:500;cursor:pointer;margin-top:12px;}
      .primary-button{background:${PINK};color:#fff;}
      .secondary-button{background:#232323;color:#fff;}
      .mode-button{border:0;background:none;color:#68727a;font-size:12px;cursor:pointer;margin-top:14px;}
      .transfer-list{width:100%;margin-top:24px;border:1px solid #d7dee1;border-radius:14px;overflow:hidden;text-align:left;}
      .dark .transfer-list{border-color:#363b42;}
      .transfer-row{min-height:60px;display:grid;grid-template-columns:105px 1fr auto;align-items:center;gap:12px;padding:10px 14px;border-bottom:1px solid #edf0f1;}
      .dark .transfer-row{border-bottom-color:#30343a;}
      .transfer-row:last-child{border-bottom:0;}
      .transfer-row>span{font-size:12px;color:#68727a;}
      .transfer-row strong{font-size:13px;font-weight:400;overflow-wrap:anywhere;}
      .transfer-row button{border:0;background:none;color:${PINK};font-size:12px;cursor:pointer;white-space:nowrap;}
      .bank-loading{min-height:310px;justify-content:center;}
      .spinner{width:48px;height:48px;border-radius:50%;border:3px solid #dce2e5;border-top-color:${PINK};animation:spin .8s linear infinite;margin-bottom:24px;}
      .confetti{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;}
      .success-root{display:grid;place-items:center;overflow:hidden;}
      .success-content{position:relative;z-index:1;width:min(560px,calc(100% - 40px));display:flex;flex-direction:column;align-items:center;text-align:center;}
      .success-image{width:min(300px,55vw);height:min(300px,55vw);object-fit:contain;display:block;margin:0 auto 10px;}
      .success-content h1{font-family:${HEAD_FONT};font-weight:600;font-size:clamp(30px,5vw,42px);line-height:1.15;margin:0 0 10px;letter-spacing:-.025em;}
      .success-content p{margin:0 0 24px;color:#68727a;font-size:15px;}
      .dark .success-content p{color:#b7bec4;}
      .success-content .primary-button{width:min(520px,100%);margin-top:0;}
      @keyframes idealPulse{0%,100%{transform:scale(1);opacity:.94}50%{transform:scale(1.035);opacity:1}}
      @keyframes dotPulse{0%,80%,100%{transform:scale(.65);opacity:.35}40%{transform:scale(1);opacity:1}}
      @keyframes spin{to{transform:rotate(360deg)}}
      @media (min-width:760px){.bank-grid{grid-template-columns:1fr 1fr;}.bank-row{min-height:72px;}}
      @media (max-width:600px){.ideal-header{height:76px;padding:0 18px}.ideal-header img{width:96px;height:36px}.amount strong{font-size:18px}.amount span{font-size:11px}.bank-main{min-height:calc(100dvh - 76px);padding:34px 14px}.center-main{min-height:calc(100dvh - 76px);padding:20px 14px}.payment-card{border-radius:16px;padding:28px 18px}.transfer-row{grid-template-columns:82px 1fr auto;gap:8px}.bank-title h1{font-size:31px}}
    `}</style>
  );
}
