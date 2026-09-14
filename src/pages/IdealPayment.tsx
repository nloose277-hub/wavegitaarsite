import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BANK_LOGOS } from '../data/bankLogos';
import idealLogo from '../assets/ideal/ideal-logo.svg';
import adyenLogo from '../assets/ideal/adyen.png';
import finomLogo from '../assets/ideal/finom.png';
import successLight from '../assets/ideal/success-light.png';
import successDark from '../assets/ideal/success-dark.png';

const PINK = '#CC0066';
const BLACK = '#111111';
const DARK = '#191919';
const PANEL = '#222222';
const BORDER = '#3b3b3b';
const TEXT = '#ffffff';
const MUTED = '#b7b7b7';

const BODY_FONT = '"Lexend Deca", sans-serif';
const HEAD_FONT = '"Roboto Slab", serif';

const BANKS = [
  'ABN AMRO',
  'Adyen',
  'ASN Bank',
  'ASN Bank vh RegioBank',
  'ASN Bank voorheen SNS',
  'bunq',
  'BUUT',
  'Finom',
  'ING',
  'Knab',
  'Mollie',
  'N26',
  'Nationale-Nederlanden',
  'Rabobank',
  'Revolut',
  'Triodos Bank',
  'Van Lanschot Kempen',
  'Yoursafe',
];

function formatAmount(value: string | null) {
  const n = Number(value);

  if (!Number.isFinite(n)) {
    return '€0,00';
  }

  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(n);
}

function useIdealFonts() {
  useEffect(() => {
    const id = 'ideal-official-fonts';

    if (!document.getElementById(id)) {
      const link = document.createElement('link');

      link.id = id;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Lexend+Deca:wght@300;400;500;600&family=Roboto+Slab:wght@600&display=swap';

      document.head.appendChild(link);
    }
  }, []);
}

function useLockPage() {
  useEffect(() => {
    const previous = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previous;
    };
  }, []);
}

function BankLogo({ name }: { name: string }) {
  const [failed, setFailed] = useState(false);

  const aliases: Record<string, string> = {
    'ASN Bank vh RegioBank': 'RegioBank',
    bunq: 'Bunq',
  };

  const local =
    name === 'Adyen'
      ? adyenLogo
      : name === 'Finom'
        ? finomLogo
        : undefined;

  const src =
    local ||
    BANK_LOGOS[name] ||
    BANK_LOGOS[aliases[name]];

  if (!src || failed) {
    return (
      <div className="bank-logo-fallback" aria-hidden="true">
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <div className="bank-logo">
      <img
        src={src}
        alt=""
        onError={() => setFailed(true)}
      />
    </div>
  );
}

/*
 * Decorative QR-style graphic.
 *
 * This is intentionally NON-FUNCTIONAL.
 * It does not contain a payment URL and cannot initiate a payment.
 */
function DecorativeQR() {
  const size = 29;

  const finder = (x: number, y: number) => {
    const cells: string[] = [];

    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 7; col++) {
        const outer =
          row === 0 ||
          row === 6 ||
          col === 0 ||
          col === 6;

        const inner =
          row >= 2 &&
          row <= 4 &&
          col >= 2 &&
          col <= 4;

        if (outer || inner) {
          cells.push(`${x + col},${y + row}`);
        }
      }
    }

    return cells;
  };

  const cells = new Set<string>();

  finder(0, 0).forEach((cell) => cells.add(cell));
  finder(size - 7, 0).forEach((cell) => cells.add(cell));
  finder(0, size - 7).forEach((cell) => cells.add(cell));

  /*
   * Deterministic decorative pattern.
   * It deliberately does not encode any URL/payment information.
   */
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nearFinder =
        (x < 8 && y < 8) ||
        (x >= size - 8 && y < 8) ||
        (x < 8 && y >= size - 8);

      if (nearFinder) continue;

      const value =
        (x * 17 +
          y * 31 +
          x * y * 7 +
          ((x + y) % 5) * 11) %
        13;

      if (value < 5) {
        cells.add(`${x},${y}`);
      }
    }
  }

  return (
    <div className="qr-shell" aria-hidden="true">
      <svg
        className="qr-svg"
        viewBox={`0 0 ${size} ${size}`}
        role="presentation"
      >
        <rect
          x="0"
          y="0"
          width={size}
          height={size}
          fill="#ffffff"
        />

        {Array.from(cells).map((cell) => {
          const [x, y] = cell.split(',').map(Number);

          return (
            <rect
              key={cell}
              x={x}
              y={y}
              width="1"
              height="1"
              fill="#000000"
            />
          );
        })}
      </svg>
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
      const dpr = Math.min(
        window.devicePixelRatio || 1,
        2
      );

      canvas.width =
        Math.floor(window.innerWidth * dpr);

      canvas.height =
        Math.floor(window.innerHeight * dpr);

      canvas.style.width =
        `${window.innerWidth}px`;

      canvas.style.height =
        `${window.innerHeight}px`;

      ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
      );
    };

    resize();

    window.addEventListener(
      'resize',
      resize
    );

    const colors = [
      PINK,
      '#FFD500',
      '#00A7E1',
      '#6DD400',
      '#FF7A00',
      '#F26AAE',
    ];

    const pieces = Array.from(
      { length: 72 },
      () => ({
        x:
          Math.random() *
          window.innerWidth,

        y:
          -Math.random() *
          window.innerHeight,

        vx:
          (Math.random() - 0.5) *
          0.35,

        vy:
          0.32 +
          Math.random() *
          0.45,

        rotation:
          Math.random() *
          Math.PI *
          2,

        rotationSpeed:
          (Math.random() - 0.5) *
          0.008,

        w:
          5 +
          Math.random() *
          6,

        h:
          3 +
          Math.random() *
          4,

        color:
          colors[
            Math.floor(
              Math.random() *
                colors.length
            )
          ],
      })
    );

    let raf = 0;

    const draw = () => {
      ctx.clearRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
      );

      for (const p of pieces) {
        ctx.save();

        ctx.translate(
          p.x,
          p.y
        );

        ctx.rotate(
          p.rotation
        );

        ctx.fillStyle =
          p.color;

        ctx.fillRect(
          -p.w / 2,
          -p.h / 2,
          p.w,
          p.h
        );

        ctx.restore();

        p.x += p.vx;
        p.y += p.vy;

        p.rotation +=
          p.rotationSpeed;

        if (
          p.y >
          window.innerHeight +
            20
        ) {
          p.y = -20;

          p.x =
            Math.random() *
            window.innerWidth;
        }
      }

      raf =
        requestAnimationFrame(
          draw
        );
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);

      window.removeEventListener(
        'resize',
        resize
      );
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="confetti"
      aria-hidden="true"
    />
  );
}

export default function IdealPayment() {
  useIdealFonts();
  useLockPage();

  const [params] =
    useSearchParams();

  const navigate =
    useNavigate();

  const amount =
    formatAmount(
      params.get('amount')
    );

  const order =
    params.get('order') || '';

  const tracking =
    params.get('tracking') || '';

  const [loadingIntro, setLoadingIntro] =
    useState(true);

  const [startScreen, setStartScreen] =
    useState(true);

  const [selectedBank, setSelectedBank] =
    useState<string | null>(null);

  const [bankLoading, setBankLoading] =
    useState(false);

  const [transfer, setTransfer] =
    useState(false);

  const [confirm, setConfirm] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [copied, setCopied] =
    useState<string | null>(null);

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        setLoadingIntro(false);
      }, 800);

    return () =>
      window.clearTimeout(timer);
  }, []);

  const copy = async (
    value: string,
    key: string
  ) => {
    try {
      await navigator.clipboard?.writeText(
        value.replace(/\s/g, '')
      );

      setCopied(key);

      window.setTimeout(
        () => setCopied(null),
        1500
      );
    } catch {
      // Clipboard unavailable.
    }
  };

  const goToOrderSuccess = () => {
    navigate(
      `/checkout/success?order=${encodeURIComponent(
        order
      )}&tracking=${encodeURIComponent(
        tracking
      )}`
    );
  };

  if (loadingIntro) {
    return (
      <div className="ideal-root ideal-loading">
        <div className="loading-center">
          <img
            src={idealLogo}
            alt="iDEAL | Wero"
            className="loading-logo"
          />

          <div
            className="loading-dots"
            aria-label="Laden"
          >
            <i />
            <i />
            <i />
          </div>
        </div>

        <IdealStyles />
      </div>
    );
  }

  if (success) {
    return (
      <div className="ideal-root success-root">
        <Confetti active />

        <main className="success-content">
          <img
            src={successLight}
            alt=""
            className="success-image"
          />

          <h1>
            Betaling geslaagd
          </h1>

          <p>
            Je betaling is succesvol verwerkt.
          </p>

          <button
            className="primary-button"
            onClick={
              goToOrderSuccess
            }
          >
            Verder
          </button>
        </main>

        <IdealStyles />
      </div>
    );
  }

  /*
   * STEP 1
   * Desktop: QR + internet banking.
   * Mobile: QR is automatically hidden.
   */
  if (startScreen) {
    return (
      <div className="ideal-root start-root">
        <header className="ideal-header">
          <div className="header-left">
            <button
              className="cancel-button"
              onClick={() =>
                navigate(-1)
              }
            >
              Cancel
            </button>
          </div>

          <div className="header-logo">
            <img
              src={idealLogo}
              alt="iDEAL | Wero"
            />
          </div>

          <div className="header-merchant">
            <strong>
              {amount}
            </strong>

            <span>
              WaveGitaar
            </span>
          </div>
        </header>

        <main className="start-main">
          <section className="start-panel">
            <div className="start-column qr-column">
              <DecorativeQR />

              <h1>
                Scan to pay
              </h1>

              <p>
                Scan with your banking app to pay
              </p>
            </div>

            <div className="desktop-divider" />

            <div className="start-column banking-column">
              <h1>
                Or use internet banking
              </h1>

              <button
                className="select-bank-button"
                onClick={() =>
                  setStartScreen(false)
                }
              >
                Select your bank
              </button>
            </div>
          </section>
        </main>

        <IdealStyles />
      </div>
    );
  }

  const header = (
    <header className="ideal-header">
      <div className="header-left">
        <button
          className="cancel-button"
          onClick={() =>
            navigate(-1)
          }
        >
          Cancel
        </button>
      </div>

      <div className="header-logo">
        <img
          src={idealLogo}
          alt="iDEAL | Wero"
        />
      </div>

      <div className="header-merchant">
        <strong>
          {amount}
        </strong>

        <span>
          WaveGitaar
        </span>
      </div>
    </header>
  );

  /*
   * STEP 2
   * Bank selection.
   */
  if (
    !selectedBank &&
    !transfer &&
    !confirm
  ) {
    return (
      <div className="ideal-root bank-root">
        {header}

        <main className="bank-main">
          <section className="bank-section">
            <button
              className="back-button"
              onClick={() =>
                setStartScreen(true)
              }
            >
              ← Back
            </button>

            <div className="bank-title">
              <h1>
                Select your bank
              </h1>

              <p>
                Choose your bank to continue.
              </p>
            </div>

            <div className="bank-grid">
              {BANKS.map(
                (name) => (
                  <button
                    className="bank-row"
                    key={name}
                    onClick={() => {
                      setSelectedBank(
                        name
                      );

                      setBankLoading(
                        true
                      );

                      window.setTimeout(
                        () => {
                          setBankLoading(
                            false
                          );
                        },
                        900
                      );
                    }}
                  >
                    <BankLogo
                      name={name}
                    />

                    <span>
                      {name}
                    </span>

                    <span className="bank-arrow">
                      ›
                    </span>
                  </button>
                )
              )}
            </div>

            <div className="secure-note">
              Secure payment environment
            </div>
          </section>
        </main>

        <IdealStyles />
      </div>
    );
  }

  /*
   * STEP 3
   * Loading after bank selection.
   */
  if (
    selectedBank &&
    bankLoading
  ) {
    return (
      <div className="ideal-root">
        {header}

        <main className="center-main">
          <section className="payment-card bank-loading">
            <div className="spinner" />

            <h1>
              Opening bank environment
            </h1>

            <p>
              {selectedBank}
            </p>
          </section>
        </main>

        <IdealStyles />
      </div>
    );
  }

  /*
   * STEP 4
   * Manual test payment.
   */
  if (
    selectedBank &&
    !transfer
  ) {
    return (
      <div className="ideal-root">
        {header}

        <main className="center-main">
          <section className="payment-card">
            <button
              className="back-button"
              onClick={() =>
                setSelectedBank(null)
              }
            >
              ← Back to banks
            </button>

            <h1>
              Handmatige betaling
            </h1>

            <p>
              Deze testomgeving kan geen
              echte banktransactie uitvoeren.
              Je kunt het bedrag handmatig
              overmaken.
            </p>

            <button
              className="primary-button"
              onClick={() =>
                setTransfer(true)
              }
            >
              Handmatig overmaken
            </button>

            <button
              className="secondary-button"
              onClick={() =>
                setSelectedBank(null)
              }
            >
              Andere bank kiezen
            </button>
          </section>
        </main>

        <IdealStyles />
      </div>
    );
  }

  /*
   * STEP 5
   * Manual transfer details.
   */
  if (transfer) {
    const details: [
      string,
      string,
      string
    ][] = [
      [
        'Bedrag',
        amount,
        'amount',
      ],
      [
        'Ten name van',
        'WaveGitaar',
        'name',
      ],
      [
        'IBAN',
        'NL00 0000 0000 0000 00',
        'iban',
      ],
      [
        'Omschrijving',
        order ||
          'WaveGitaar bestelling',
        'reference',
      ],
    ];

    return (
      <div className="ideal-root">
        {header}

        <main className="center-main">
          <section className="payment-card">
            <button
              className="back-button"
              onClick={() =>
                setTransfer(false)
              }
            >
              ← Back
            </button>

            <h1>
              Handmatig overmaken
            </h1>

            <p>
              Maak het bedrag over met
              onderstaande betaalgegevens.
            </p>

            <div className="transfer-list">
              {details.map(
                ([
                  label,
                  value,
                  key,
                ]) => (
                  <div
                    className="transfer-row"
                    key={key}
                  >
                    <span>
                      {label}
                    </span>

                    <strong>
                      {value}
                    </strong>

                    {(
                      key ===
                        'iban' ||
                      key ===
                        'reference'
                    ) && (
                      <button
                        onClick={() =>
                          copy(
                            value,
                            key
                          )
                        }
                      >
                        {copied ===
                        key
                          ? 'Gekopieerd'
                          : 'Kopieer'}
                      </button>
                    )}
                  </div>
                )
              )}
            </div>

            <button
              className="primary-button"
              onClick={() =>
                setConfirm(true)
              }
            >
              Ik heb betaald
            </button>
          </section>
        </main>

        <IdealStyles />
      </div>
    );
  }

  /*
   * STEP 6
   * Confirmation.
   */
  if (confirm) {
    return (
      <div className="ideal-root">
        {header}

        <main className="center-main">
          <section className="payment-card">
            <button
              className="back-button"
              onClick={() =>
                setConfirm(false)
              }
            >
              ← Back
            </button>

            <h1>
              Betaling bevestigen
            </h1>

            <p>
              Heb je het bedrag al
              handmatig overgemaakt?
            </p>

            <button
              className="primary-button"
              onClick={() =>
                setSuccess(true)
              }
            >
              Ja, ik heb betaald
            </button>

            <button
              className="secondary-button"
              onClick={() =>
                setConfirm(false)
              }
            >
              Nee, nog niet betaald
            </button>
          </section>
        </main>

        <IdealStyles />
      </div>
    );
  }

  return null;
}

function IdealStyles() {
  return (
    <style>{`
      * {
        box-sizing: border-box;
      }

      .ideal-root {
        position: fixed;
        inset: 0;
        z-index: 999999;
        overflow: auto;
        background: ${BLACK};
        color: ${TEXT};
        font-family: ${BODY_FONT};
        font-weight: 300;
        line-height: 1.5;
        letter-spacing: .00938em;
        -webkit-font-smoothing: antialiased;
      }

      .ideal-root button {
        font-family: ${BODY_FONT};
      }

      /* HEADER */

      .ideal-header {
        position: relative;
        height: 96px;
        background: ${PINK};
        color: #fff;
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        padding: 0 42px;
      }

      .header-left {
        justify-self: start;
      }

      .header-logo {
        justify-self: center;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .header-logo img {
        width: 112px;
        height: 42px;
        object-fit: contain;
        display: block;
      }

      .header-merchant {
        justify-self: end;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        line-height: 1.25;
      }

      .header-merchant strong {
        font-size: 21px;
        font-weight: 600;
      }

      .header-merchant span {
        font-size: 13px;
        margin-top: 4px;
        opacity: .92;
      }

      .cancel-button {
        border: 0;
        background: transparent;
        color: #fff;
        padding: 8px 0;
        font-size: 14px;
        font-weight: 400;
        cursor: pointer;
      }

      .cancel-button:hover {
        text-decoration: underline;
      }

      /* LOADING */

      .ideal-loading {
        display: grid;
        place-items: center;
        background: #fff;
      }

      .loading-center {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 22px;
      }

      .loading-logo {
        width: 108px;
        height: 42px;
        object-fit: contain;
        animation: idealPulse 1.05s ease-in-out infinite;
      }

      .loading-dots {
        display: flex;
        gap: 5px;
      }

      .loading-dots i {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #68727a;
        animation: dotPulse 1s ease-in-out infinite;
      }

      .loading-dots i:nth-child(2) {
        animation-delay: .15s;
      }

      .loading-dots i:nth-child(3) {
        animation-delay: .3s;
      }

      /* START SCREEN */

      .start-root {
        background: ${BLACK};
      }

      .start-main {
        min-height: calc(100dvh - 96px);
        display: grid;
        place-items: center;
        padding: 46px 30px 60px;
      }

      .start-panel {
        width: min(1040px, 100%);
        min-height: 500px;
        background: ${DARK};
        border: 1px solid ${BORDER};
        border-radius: 22px;
        display: grid;
        grid-template-columns: 1fr 1px 1fr;
        overflow: hidden;
        box-shadow:
          0 30px 80px rgba(0,0,0,.45);
      }

      .start-column {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 60px 50px;
      }

      .qr-column {
        min-width: 0;
      }

      .banking-column {
        min-width: 0;
      }

      .desktop-divider {
        width: 1px;
        height: 300px;
        align-self: center;
        background: #414141;
      }

      .qr-shell {
        width: 236px;
        height: 236px;
        padding: 12px;
        background: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        margin-bottom: 30px;
      }

      .qr-svg {
        width: 100%;
        height: 100%;
        display: block;
        shape-rendering: crispEdges;
      }

      .start-column h1 {
        font-family: ${HEAD_FONT};
        font-weight: 600;
        font-size: 25px;
        line-height: 1.2;
        margin: 0 0 12px;
        color: #fff;
      }

      .start-column p {
        color: ${MUTED};
        font-size: 15px;
        margin: 0;
        max-width: 300px;
      }

      .banking-column h1 {
        max-width: 330px;
        margin-bottom: 30px;
      }

      .select-bank-button {
        width: min(340px, 100%);
        min-height: 58px;
        border: 1px solid #fff;
        border-radius: 7px;
        background: transparent;
        color: #fff;
        padding: 15px 25px;
        font-size: 15px;
        font-weight: 500;
        cursor: pointer;
        transition:
          background .15s ease,
          color .15s ease;
      }

      .select-bank-button:hover {
        background: #fff;
        color: #111;
      }

      /* BANK SCREEN */

      .bank-root {
        background: ${BLACK};
      }

      .bank-main {
        min-height: calc(100dvh - 96px);
        display: flex;
        justify-content: center;
        padding: 45px 24px 60px;
      }

      .bank-section {
        width: min(850px, 100%);
      }

      .back-button {
        border: 0;
        background: transparent;
        color: #fff;
        font-size: 13px;
        font-weight: 400;
        cursor: pointer;
        padding: 4px 0;
        margin-bottom: 30px;
      }

      .back-button:hover {
        color: #ddd;
      }

      .bank-title {
        text-align: center;
        margin-bottom: 34px;
      }

      .bank-title h1 {
        font-family: ${HEAD_FONT};
        font-size: clamp(30px, 4vw, 40px);
        font-weight: 600;
        line-height: 1.15;
        margin: 0 0 10px;
      }

      .bank-title p {
        margin: 0;
        color: ${MUTED};
        font-size: 14px;
      }

      .bank-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .bank-row {
        width: 100%;
        min-height: 68px;
        border: 1px solid ${BORDER};
        border-radius: 9px;
        background: ${PANEL};
        color: #fff;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 8px 14px;
        cursor: pointer;
        text-align: left;
        font-size: 14px;
        font-weight: 400;
        transition:
          border-color .15s ease,
          background .15s ease;
      }

      .bank-row:hover {
        border-color: #666;
        background: #292929;
      }

      .bank-logo {
        width: 46px;
        height: 46px;
        flex: 0 0 46px;
        border-radius: 7px;
        overflow: hidden;
        background: #fff;
        display: grid;
        place-items: center;
      }

      .bank-logo img {
        width: 46px;
        height: 46px;
        object-fit: contain;
        display: block;
      }

      .bank-logo-fallback {
        width: 46px;
        height: 46px;
        flex: 0 0 46px;
        border-radius: 7px;
        background: #eee;
        color: #222;
        display: grid;
        place-items: center;
        font-size: 13px;
        font-weight: 600;
      }

      .bank-arrow {
        margin-left: auto;
        color: #999;
        font-size: 23px;
        line-height: 1;
      }

      .secure-note {
        text-align: center;
        color: #777;
        font-size: 11px;
        margin-top: 25px;
      }

      /* GENERAL PAYMENT SCREENS */

      .center-main {
        min-height: calc(100dvh - 96px);
        display: grid;
        place-items: center;
        padding: 35px 20px;
      }

      .payment-card {
        width: min(560px, 100%);
        background: ${DARK};
        border: 1px solid ${BORDER};
        border-radius: 18px;
        box-shadow:
          0 25px 70px rgba(0,0,0,.42);
        padding: 38px clamp(22px, 5vw, 48px);
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .payment-card h1 {
        font-family: ${HEAD_FONT};
        font-size: clamp(28px, 4vw, 38px);
        line-height: 1.15;
        font-weight: 600;
        margin: 0 0 12px;
      }

      .payment-card > p {
        color: ${MUTED};
        font-size: 14px;
        margin: 0;
        max-width: 450px;
      }

      .primary-button,
      .secondary-button {
        width: 100%;
        border-radius: 8px;
        padding: 15px 20px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        margin-top: 12px;
      }

      .primary-button {
        border: 1px solid ${PINK};
        background: ${PINK};
        color: #fff;
      }

      .primary-button:hover {
        filter: brightness(1.08);
      }

      .secondary-button {
        border: 1px solid #555;
        background: transparent;
        color: #fff;
      }

      .secondary-button:hover {
        background: #292929;
      }

      /* BANK LOADING */

      .bank-loading {
        min-height: 310px;
        justify-content: center;
      }

      .spinner {
        width: 46px;
        height: 46px;
        border-radius: 50%;
        border: 3px solid #444;
        border-top-color: ${PINK};
        animation: spin .8s linear infinite;
        margin-bottom: 25px;
      }

      /* TRANSFER */

      .transfer-list {
        width: 100%;
        margin-top: 24px;
        border: 1px solid ${BORDER};
        border-radius: 10px;
        overflow: hidden;
        text-align: left;
      }

      .transfer-row {
        min-height: 62px;
        display: grid;
        grid-template-columns: 105px 1fr auto;
        align-items: center;
        gap: 12px;
        padding: 10px 14px;
        border-bottom: 1px solid #303030;
      }

      .transfer-row:last-child {
        border-bottom: 0;
      }

      .transfer-row > span {
        color: #929292;
        font-size: 11px;
      }

      .transfer-row strong {
        font-size: 13px;
        font-weight: 400;
        overflow-wrap: anywhere;
      }

      .transfer-row button {
        border: 0;
        background: transparent;
        color: #fff;
        font-size: 11px;
        cursor: pointer;
      }

      .transfer-row button:hover {
        text-decoration: underline;
      }

      /* SUCCESS */

      .success-root {
        display: grid;
        place-items: center;
        overflow: hidden;
      }

      .success-content {
        position: relative;
        z-index: 1;
        width: min(560px, calc(100% - 40px));
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .success-image {
        width: min(280px, 55vw);
        height: min(280px, 55vw);
        object-fit: contain;
        display: block;
        margin-bottom: 8px;
      }

      .success-content h1 {
        font-family: ${HEAD_FONT};
        font-size: clamp(30px, 5vw, 42px);
        font-weight: 600;
        line-height: 1.15;
        margin: 0 0 10px;
      }

      .success-content p {
        color: ${MUTED};
        font-size: 14px;
        margin: 0 0 24px;
      }

      .success-content .primary-button {
        width: min(430px, 100%);
        margin-top: 0;
      }

      .confetti {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }

      /* ANIMATIONS */

      @keyframes idealPulse {
        0%, 100% {
          transform: scale(1);
          opacity: .94;
        }

        50% {
          transform: scale(1.035);
          opacity: 1;
        }
      }

      @keyframes dotPulse {
        0%, 80%, 100% {
          transform: scale(.65);
          opacity: .35;
        }

        40% {
          transform: scale(1);
          opacity: 1;
        }
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* MOBILE */

      @media (max-width: 759px) {
        .ideal-header {
          height: 76px;
          padding: 0 18px;
        }

        .header-logo img {
          width: 96px;
          height: 36px;
        }

        .header-merchant strong {
          font-size: 17px;
        }

        .header-merchant span {
          font-size: 10px;
        }

        .cancel-button {
          font-size: 12px;
        }

        /*
         * Mobile intentionally removes the QR and
         * desktop split layout.
         */
        .start-main {
          min-height: calc(100dvh - 76px);
          padding: 25px 16px;
          place-items: center;
        }

        .start-panel {
          min-height: auto;
          width: 100%;
          display: flex;
          flex-direction: column;
          border-radius: 16px;
        }

        .qr-column {
          display: none;
        }

        .desktop-divider {
          display: none;
        }

        .banking-column {
          min-height: 390px;
          padding: 40px 24px;
        }

        .banking-column h1 {
          font-size: 27px;
          max-width: 290px;
          margin-bottom: 28px;
        }

        .select-bank-button {
          min-height: 56px;
        }

        .bank-main {
          min-height: calc(100dvh - 76px);
          padding: 28px 14px 45px;
        }

        .bank-section {
          width: 100%;
        }

        .bank-title {
          margin-bottom: 25px;
        }

        .bank-title h1 {
          font-size: 30px;
        }

        .bank-grid {
          grid-template-columns: 1fr;
          gap: 7px;
        }

        .bank-row {
          min-height: 64px;
          border-radius: 8px;
        }

        .bank-logo,
        .bank-logo img,
        .bank-logo-fallback {
          width: 44px;
          height: 44px;
        }

        .center-main {
          min-height: calc(100dvh - 76px);
          padding: 18px 14px;
        }

        .payment-card {
          border-radius: 15px;
          padding: 28px 18px;
        }

        .payment-card h1 {
          font-size: 28px;
        }

        .transfer-row {
          grid-template-columns: 78px 1fr auto;
          gap: 8px;
        }

        .success-image {
          width: min(240px, 60vw);
          height: min(240px, 60vw);
        }
      }

      @media (max-width: 390px) {
        .ideal-header {
          padding: 0 14px;
        }

        .header-logo img {
          width: 86px;
        }

        .header-merchant strong {
          font-size: 15px;
        }

        .header-merchant span {
          font-size: 9px;
        }

        .bank-title h1 {
          font-size: 27px;
        }

        .bank-row {
          min-height: 60px;
        }

        .bank-row {
          font-size: 13px;
        }
      }
    `}</style>
  );
}