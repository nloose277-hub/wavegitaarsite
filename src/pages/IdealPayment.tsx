import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BANK_LOGOS } from '../data/bankLogos';

import idealLogo from '../assets/ideal/ideal-logo.svg';
import adyenLogo from '../assets/ideal/adyen.png';
import finomLogo from '../assets/ideal/finom.png';
import successDark from '../assets/ideal/success-dark.png';

const PINK = '#D5006D';
const DARK = '#1B191A';
const DARKER = '#151415';
const CARD = '#242223';
const BORDER = '#555052';
const WHITE = '#FFFFFF';
const MUTED = '#B7B3B5';

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
    const id = 'wavegitaar-ideal-fonts';

    if (document.getElementById(id)) {
      return;
    }

    const link = document.createElement('link');

    link.id = id;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Lexend+Deca:wght@300;400;500;600&family=Roboto+Slab:wght@600&display=swap';

    document.head.appendChild(link);
  }, []);
}

function useLockPage() {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousMargin = document.body.style.margin;

    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.margin = previousMargin;
    };
  }, []);
}

/*
 * Removes near-white backgrounds from local raster bank logos.
 * This means Adyen/Finom can sit directly on the dark interface
 * without showing a white square behind them.
 */
function TransparentLogoFilter() {
  return (
    <svg
      width="0"
      height="0"
      style={{
        position: 'absolute',
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      <defs>
        <filter id="remove-white-background">
          <feColorMatrix
            type="matrix"
            values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              -1 -1 -1 3 0
            "
          />
        </filter>
      </defs>
    </svg>
  );
}

function BankLogo({ name }: { name: string }) {
  const [failed, setFailed] = useState(false);

  const aliases: Record<string, string> = {
    'ASN Bank vh RegioBank': 'RegioBank',
    'ASN Bank voorheen SNS': 'SNS',
    bunq: 'Bunq',
  };

  const localLogo =
    name === 'Adyen'
      ? adyenLogo
      : name === 'Finom'
        ? finomLogo
        : undefined;

  const source =
    localLogo ||
    BANK_LOGOS[name] ||
    BANK_LOGOS[aliases[name]];

  if (!source || failed) {
    return (
      <div className="bank-logo-fallback">
        {name
          .split(' ')
          .map((part) => part[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()}
      </div>
    );
  }

  return (
    <div className="bank-logo">
      <img
        src={source}
        alt=""
        onError={() => setFailed(true)}
      />
    </div>
  );
}

/*
 * Decorative QR only.
 * It intentionally does NOT contain a payment URL and cannot
 * start a real payment.
 */
function DecorativeQR() {
  const modules = 45;
  const cells: boolean[][] = [];

  let seed = 918273;

  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let y = 0; y < modules; y++) {
    cells[y] = [];

    for (let x = 0; x < modules; x++) {
      cells[y][x] = random() > 0.53;
    }
  }

  const reserved = Array.from(
    { length: modules },
    () => Array(modules).fill(false)
  );

  const finder = (startX: number, startY: number) => {
    for (let y = -1; y <= 7; y++) {
      for (let x = -1; x <= 7; x++) {
        const px = startX + x;
        const py = startY + y;

        if (
          px >= 0 &&
          px < modules &&
          py >= 0 &&
          py < modules
        ) {
          reserved[py][px] = true;

          if (
            x >= 0 &&
            x <= 6 &&
            y >= 0 &&
            y <= 6
          ) {
            const outer =
              x === 0 ||
              x === 6 ||
              y === 0 ||
              y === 6;

            const inner =
              x >= 2 &&
              x <= 4 &&
              y >= 2 &&
              y <= 4;

            cells[py][px] = outer || inner;
          } else {
            cells[py][px] = false;
          }
        }
      }
    }
  };

  finder(1, 1);
  finder(modules - 8, 1);
  finder(1, modules - 8);

  for (let y = 0; y < modules; y++) {
    for (let x = 0; x < modules; x++) {
      if (!reserved[y][x]) {
        const pattern =
          ((x * 13 + y * 7 + x * y) % 11) < 5;

        cells[y][x] =
          pattern !== cells[y][x]
            ? !cells[y][x]
            : cells[y][x];
      }
    }
  }

  const size = 540;
  const quiet = 5;
  const cellSize = size / (modules + quiet * 2);

  return (
    <div className="qr-shell" aria-hidden="true">
      <svg
        className="qr-svg"
        viewBox={`0 0 ${size} ${size}`}
        role="img"
      >
        <rect
          x="0"
          y="0"
          width={size}
          height={size}
          rx="18"
          fill="#FFFFFF"
        />

        {cells.map((row, y) =>
          row.map((filled, x) => {
            if (!filled) {
              return null;
            }

            return (
              <rect
                key={`${x}-${y}`}
                x={(x + quiet) * cellSize}
                y={(y + quiet) * cellSize}
                width={cellSize + 0.35}
                height={cellSize + 0.35}
                fill="#050505"
              />
            );
          })
        )}

        {/* Decorative iDEAL centre marker */}
        <rect
          x={size / 2 - 47}
          y={size / 2 - 47}
          width="94"
          height="94"
          rx="9"
          fill="#FFFFFF"
          stroke="#E8D84A"
          strokeWidth="5"
        />

        <rect
          x={size / 2 - 37}
          y={size / 2 - 37}
          width="74"
          height="74"
          rx="7"
          fill="#FFFFFF"
        />

        <image
          href={idealLogo}
          x={size / 2 - 30}
          y={size / 2 - 18}
          width="60"
          height="36"
          preserveAspectRatio="xMidYMid meet"
        />
      </svg>
    </div>
  );
}

function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

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

    const colors = [
      PINK,
      '#FFD500',
      '#00A7E1',
      '#6DD400',
      '#FF7A00',
      '#F26AAE',
    ];

    const pieces = Array.from({ length: 85 }, () => ({
      x: Math.random() * window.innerWidth,
      y: -Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.35,
      vy: 0.35 + Math.random() * 0.5,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.01,
      w: 5 + Math.random() * 6,
      h: 3 + Math.random() * 4,
      color:
        colors[Math.floor(Math.random() * colors.length)],
    }));

    let animationFrame = 0;

    const draw = () => {
      ctx.clearRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
      );

      for (const piece of pieces) {
        ctx.save();

        ctx.translate(piece.x, piece.y);
        ctx.rotate(piece.rotation);

        ctx.fillStyle = piece.color;

        ctx.fillRect(
          -piece.w / 2,
          -piece.h / 2,
          piece.w,
          piece.h
        );

        ctx.restore();

        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.rotation += piece.rotationSpeed;

        if (piece.y > window.innerHeight + 20) {
          piece.y = -20;
          piece.x = Math.random() * window.innerWidth;
        }
      }

      animationFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
    };
  }, []);

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

  const [params] = useSearchParams();
  const navigate = useNavigate();

  const amount = formatAmount(params.get('amount'));
  const order =
    params.get('order') || 'WaveGitaar bestelling';
  const tracking = params.get('tracking') || '';

  const [introLoading, setIntroLoading] = useState(true);
  const [startScreen, setStartScreen] = useState(true);

  const [selectedBank, setSelectedBank] =
    useState<string | null>(null);

  const [bankLoading, setBankLoading] =
    useState(false);

  const [manualPayment, setManualPayment] =
    useState(false);

  const [confirmation, setConfirmation] =
    useState(false);

  const [success, setSuccess] = useState(false);

  const [copied, setCopied] =
    useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIntroLoading(false);
    }, 700);

    return () => window.clearTimeout(timer);
  }, []);

  const copyValue = async (
    value: string,
    key: string
  ) => {
    try {
      await navigator.clipboard?.writeText(
        value.replace(/\s/g, '')
      );

      setCopied(key);

      window.setTimeout(() => {
        setCopied(null);
      }, 1500);
    } catch {
      // Clipboard is optional.
    }
  };

  const finishPayment = () => {
    navigate(
      `/checkout/success?order=${encodeURIComponent(
        order
      )}&tracking=${encodeURIComponent(tracking)}`
    );
  };

  const chooseBank = (bank: string) => {
    setSelectedBank(bank);
    setBankLoading(true);

    window.setTimeout(() => {
      setBankLoading(false);
    }, 850);
  };

  if (introLoading) {
    return (
      <div className="ideal-root loading-screen">
        <div className="loading-content">
          <img
            src={idealLogo}
            alt="iDEAL | Wero"
            className="loading-logo"
          />

          <div className="loading-dots">
            <span />
            <span />
            <span />
          </div>
        </div>

        <IdealStyles />
      </div>
    );
  }

  /*
   * SUCCESS
   */
  if (success) {
    return (
      <div className="ideal-root success-screen">
        <Confetti />

        <main className="success-content">
          <img
            src={successDark}
            alt=""
            className="success-image"
          />

          <h1>Betaling geslaagd</h1>

          <p>
            Je betaling is succesvol verwerkt.
          </p>

          <button
            className="main-button"
            onClick={finishPayment}
          >
            Verder
          </button>
        </main>

        <IdealStyles />
      </div>
    );
  }

  const header = (
    <header className="ideal-header">
      <div className="header-inner">
        <img
          src={idealLogo}
          alt="iDEAL | Wero"
          className="header-logo"
        />

        <div className="merchant">
          <div className="merchant-name">
            WaveGitaar
          </div>

          <div className="merchant-amount">
            {amount}
          </div>
        </div>
      </div>
    </header>
  );

  /*
   * CONFIRMATION
   */
  if (confirmation) {
    return (
      <div className="ideal-root">
        {header}

        <main className="simple-page">
          <button
            className="cancel-link"
            onClick={() => setConfirmation(false)}
          >
            Cancel
          </button>

          <section className="simple-card">
            <h1>Betaling bevestigen</h1>

            <p>
              Heb je het bedrag al handmatig
              overgemaakt?
            </p>

            <button
              className="main-button"
              onClick={() => setSuccess(true)}
            >
              Ja, ik heb betaald
            </button>

            <button
              className="outline-button"
              onClick={() => setConfirmation(false)}
            >
              Nee, nog niet betaald
            </button>
          </section>
        </main>

        <IdealStyles />
      </div>
    );
  }

  /*
   * MANUAL TRANSFER
   */
  if (manualPayment) {
    const details = [
      {
        label: 'Bedrag',
        value: amount,
        key: 'amount',
      },
      {
        label: 'Ten name van',
        value: 'WaveGitaar',
        key: 'name',
      },
      {
        label: 'IBAN',
        value: 'NL00 0000 0000 0000 00',
        key: 'iban',
      },
      {
        label: 'Omschrijving',
        value: order,
        key: 'reference',
      },
    ];

    return (
      <div className="ideal-root">
        {header}

        <main className="simple-page">
          <button
            className="cancel-link"
            onClick={() => setManualPayment(false)}
          >
            Cancel
          </button>

          <section className="simple-card transfer-card">
            <h1>Handmatig overmaken</h1>

            <p>
              Maak het bedrag over met onderstaande
              betaalgegevens.
            </p>

            <div className="transfer-box">
              {details.map((detail) => (
                <div
                  className="transfer-row"
                  key={detail.key}
                >
                  <span>{detail.label}</span>

                  <strong>{detail.value}</strong>

                  {(detail.key === 'iban' ||
                    detail.key === 'reference') && (
                    <button
                      className="copy-button"
                      onClick={() =>
                        copyValue(
                          detail.value,
                          detail.key
                        )
                      }
                    >
                      {copied === detail.key
                        ? 'Gekopieerd'
                        : 'Kopieer'}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="test-warning">
              Dit is een testomgeving. Het weergegeven
              IBAN is geen echt betaalrekeningnummer.
            </div>

            <button
              className="main-button"
              onClick={() => setConfirmation(true)}
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
   * BANK LOADING
   */
  if (selectedBank && bankLoading) {
    return (
      <div className="ideal-root">
        {header}

        <main className="simple-page">
          <button
            className="cancel-link"
            onClick={() => {
              setSelectedBank(null);
              setBankLoading(false);
            }}
          >
            Cancel
          </button>

          <section className="simple-card loading-bank-card">
            <div className="bank-spinner" />

            <h1>Bankomgeving openen</h1>

            <p>{selectedBank}</p>
          </section>
        </main>

        <IdealStyles />
      </div>
    );
  }

  /*
   * SELECTED BANK
   */
  if (selectedBank) {
    return (
      <div className="ideal-root">
        {header}

        <main className="simple-page">
          <button
            className="cancel-link"
            onClick={() => setSelectedBank(null)}
          >
            Cancel
          </button>

          <section className="simple-card">
            <div className="selected-bank-logo">
              <BankLogo name={selectedBank} />
            </div>

            <h1>Handmatig betalen</h1>

            <p>
              Deze testomgeving voert geen echte
              banktransactie uit.
            </p>

            <button
              className="main-button"
              onClick={() => setManualPayment(true)}
            >
              Handmatig overmaken
            </button>

            <button
              className="outline-button"
              onClick={() => setSelectedBank(null)}
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
   * BANK SELECTION
   */
  if (!startScreen) {
    return (
      <div className="ideal-root">
        {header}

        <main className="banks-page">
          <button
            className="cancel-link"
            onClick={() => setStartScreen(true)}
          >
            Cancel
          </button>

          <section className="banks-container">
            <div className="banks-heading">
              <h1>Select your bank</h1>

              <p>
                Select your bank to continue.
              </p>
            </div>

            <div className="banks-grid">
              {BANKS.map((bank) => (
                <button
                  key={bank}
                  className="bank-item"
                  onClick={() => chooseBank(bank)}
                >
                  <BankLogo name={bank} />

                  <span>{bank}</span>

                  <span className="bank-arrow">
                    ›
                  </span>
                </button>
              ))}
            </div>
          </section>
        </main>

        <IdealStyles />
      </div>
    );
  }

  /*
   * DESKTOP START SCREEN
   * MOBILE automatically hides QR section.
   */
  return (
    <div className="ideal-root">
      {header}

      <main className="start-page">
        <button
          className="cancel-link start-cancel"
          onClick={() => navigate(-1)}
        >
          Cancel
        </button>

        <section className="payment-choice">
          <div className="qr-column">
            <DecorativeQR />

            <h2>
              Scan with your
              <br />
              banking app to pay
            </h2>
          </div>

          <div className="vertical-divider" />

          <div className="internet-column">
            <h2>
              Or use internet
              <br />
              banking
            </h2>

            <button
              className="select-bank-button"
              onClick={() => setStartScreen(false)}
            >
              Select your bank
            </button>
          </div>
        </section>
      </main>

      <TransparentLogoFilter />
      <IdealStyles />
    </div>
  );
}

function IdealStyles() {
  return (
    <style>{`
      * {
        box-sizing: border-box;
      }

      html,
      body,
      #root {
        margin: 0;
        min-height: 100%;
      }

      body {
        background: ${DARK};
      }

      .ideal-root {
        position: fixed;
        inset: 0;
        z-index: 999999;
        overflow-y: auto;
        overflow-x: hidden;
        background: ${DARK};
        color: ${WHITE};
        font-family: ${BODY_FONT};
        font-weight: 400;
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
      }

      .ideal-root *,
      .ideal-root *::before,
      .ideal-root *::after {
        box-sizing: border-box;
      }

      button {
        font-family: ${BODY_FONT};
      }

      .ideal-header {
        height: 103px;
        width: 100%;
        background: ${PINK};
        color: #fff;
      }

      .header-inner {
        position: relative;
        width: min(1430px, calc(100% - 80px));
        height: 100%;
        margin: 0 auto;
        display: flex;
        align-items: center;
      }

      .header-logo {
        width: 142px;
        height: 54px;
        object-fit: contain;
        display: block;
      }

      .merchant {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        white-space: nowrap;
      }

      .merchant-name {
        font-family: ${BODY_FONT};
        font-size: 28px;
        line-height: 1.1;
        font-weight: 400;
        letter-spacing: -0.02em;
      }

      .merchant-amount {
        margin-top: 7px;
        font-family: ${BODY_FONT};
        font-size: 31px;
        line-height: 1;
        font-weight: 600;
      }

      .cancel-link {
        border: 0;
        background: none;
        color: ${PINK};
        padding: 0;
        font-family: ${BODY_FONT};
        font-size: 22px;
        font-weight: 600;
        cursor: pointer;
        text-align: left;
      }

      .start-page {
        width: min(1430px, calc(100% - 80px));
        margin: 0 auto;
        position: relative;
        min-height: calc(100dvh - 103px);
      }

      .start-cancel {
        position: absolute;
        top: 31px;
        left: 0;
        z-index: 5;
      }

      .payment-choice {
        position: absolute;
        left: 50%;
        top: 132px;
        transform: translateX(-50%);
        width: min(1130px, 100%);
        display: grid;
        grid-template-columns: 1fr 1px 1fr;
        align-items: center;
        column-gap: 96px;
      }

      .qr-column,
      .internet-column {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
      }

      .qr-column {
        min-width: 0;
      }

      .qr-shell {
        width: 312px;
        height: 312px;
        padding: 0;
        border-radius: 22px;
        overflow: hidden;
        background: #fff;
        box-shadow: 0 0 0 1px rgba(255,255,255,.04);
      }

      .qr-svg {
        width: 100%;
        height: 100%;
        display: block;
      }

      .qr-column h2,
      .internet-column h2 {
        margin: 42px 0 0;
        font-family: ${HEAD_FONT};
        color: #fff;
        font-weight: 600;
        font-size: 43px;
        line-height: 1.45;
        letter-spacing: -0.025em;
      }

      .vertical-divider {
        height: 412px;
        width: 1px;
        background: #6D686A;
      }

      .internet-column h2 {
        margin-top: 0;
        margin-bottom: 40px;
      }

      .select-bank-button {
        width: min(480px, 100%);
        height: 62px;
        border: 1px solid #E2DFE0;
        border-radius: 34px;
        background: transparent;
        color: #fff;
        font-size: 22px;
        font-weight: 600;
        cursor: pointer;
        transition:
          background .18s ease,
          color .18s ease,
          border-color .18s ease;
      }

      .select-bank-button:hover {
        background: #fff;
        color: #1B191A;
      }

      /*
       * BANK SELECTION
       */

      .banks-page {
        width: min(1120px, calc(100% - 40px));
        margin: 0 auto;
        padding: 30px 0 70px;
      }

      .banks-container {
        width: 100%;
        margin: 48px auto 0;
      }

      .banks-heading {
        text-align: center;
        margin-bottom: 34px;
      }

      .banks-heading h1 {
        margin: 0;
        color: #fff;
        font-family: ${HEAD_FONT};
        font-size: 43px;
        line-height: 1.2;
        font-weight: 600;
        letter-spacing: -0.025em;
      }

      .banks-heading p {
        margin: 12px 0 0;
        color: ${MUTED};
        font-size: 16px;
      }

      .banks-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .bank-item {
        width: 100%;
        min-height: 76px;
        padding: 10px 18px;
        border: 1px solid ${BORDER};
        border-radius: 12px;
        background: ${CARD};
        color: #fff;
        display: flex;
        align-items: center;
        gap: 16px;
        cursor: pointer;
        text-align: left;
        font-size: 16px;
        font-weight: 500;
        transition:
          border-color .15s ease,
          background .15s ease,
          transform .15s ease;
      }

      .bank-item:hover {
        background: #2C292A;
        border-color: #888285;
        transform: translateY(-1px);
      }

      .bank-item > span:not(.bank-arrow) {
        flex: 1;
      }

      .bank-arrow {
        color: #AAA5A8;
        font-size: 28px;
        line-height: 1;
        font-weight: 300;
      }

      .bank-logo {
        width: 52px;
        height: 52px;
        flex: 0 0 52px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border-radius: 8px;
        background: transparent;
      }

      .bank-logo img {
        width: 50px;
        height: 50px;
        object-fit: contain;
        display: block;
        background: transparent;
        filter: url(#remove-white-background);
      }

      .bank-logo-fallback {
        width: 52px;
        height: 52px;
        flex: 0 0 52px;
        border-radius: 8px;
        display: grid;
        place-items: center;
        background: #333031;
        border: 1px solid #555052;
        color: #fff;
        font-size: 14px;
        font-weight: 600;
      }

      /*
       * SIMPLE / MANUAL / CONFIRMATION PAGES
       */

      .simple-page {
        position: relative;
        width: min(820px, calc(100% - 40px));
        min-height: calc(100dvh - 103px);
        margin: 0 auto;
        padding-top: 31px;
        display: flex;
        justify-content: center;
        align-items: flex-start;
      }

      .simple-page > .cancel-link {
        position: absolute;
        left: 0;
        top: 31px;
      }

      .simple-card {
        width: min(600px, 100%);
        margin-top: 105px;
        padding: 42px 42px 40px;
        background: ${CARD};
        border: 1px solid ${BORDER};
        border-radius: 20px;
        text-align: center;
      }

      .simple-card h1 {
        margin: 0 0 15px;
        color: #fff;
        font-family: ${HEAD_FONT};
        font-size: 38px;
        line-height: 1.2;
        font-weight: 600;
      }

      .simple-card > p {
        margin: 0;
        color: ${MUTED};
        font-size: 16px;
        line-height: 1.65;
      }

      .selected-bank-logo {
        width: 64px;
        height: 64px;
        margin: 0 auto 25px;
      }

      .selected-bank-logo .bank-logo {
        width: 64px;
        height: 64px;
      }

      .selected-bank-logo .bank-logo img {
        width: 62px;
        height: 62px;
      }

      .main-button,
      .outline-button {
        width: 100%;
        min-height: 58px;
        border-radius: 30px;
        padding: 14px 22px;
        margin-top: 24px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
      }

      .main-button {
        border: 1px solid ${PINK};
        background: ${PINK};
        color: #fff;
      }

      .main-button:hover {
        background: #E00077;
      }

      .outline-button {
        border: 1px solid #777174;
        background: transparent;
        color: #fff;
      }

      .outline-button:hover {
        border-color: #fff;
      }

      .transfer-card {
        width: min(700px, 100%);
      }

      .transfer-box {
        width: 100%;
        margin-top: 28px;
        border: 1px solid #514C4E;
        border-radius: 12px;
        overflow: hidden;
        text-align: left;
      }

      .transfer-row {
        min-height: 67px;
        display: grid;
        grid-template-columns: 125px 1fr auto;
        align-items: center;
        gap: 12px;
        padding: 10px 16px;
        border-bottom: 1px solid #3D393A;
      }

      .transfer-row:last-child {
        border-bottom: 0;
      }

      .transfer-row > span {
        color: #AAA5A8;
        font-size: 13px;
      }

      .transfer-row strong {
        color: #fff;
        font-size: 14px;
        font-weight: 400;
        overflow-wrap: anywhere;
      }

      .copy-button {
        border: 0;
        background: transparent;
        color: ${PINK};
        font-size: 12px;
        cursor: pointer;
        white-space: nowrap;
      }

      .test-warning {
        margin-top: 18px;
        padding: 12px 14px;
        border-radius: 9px;
        background: #302C2D;
        color: #AAA5A8;
        font-size: 12px;
        line-height: 1.5;
      }

      /*
       * BANK LOADING
       */

      .loading-bank-card {
        min-height: 330px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .bank-spinner {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        border: 3px solid #4B4749;
        border-top-color: ${PINK};
        animation: spin .75s linear infinite;
        margin-bottom: 28px;
      }

      /*
       * INITIAL LOADING
       */

      .loading-screen {
        display: grid;
        place-items: center;
        background: #fff;
      }

      .loading-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
      }

      .loading-logo {
        width: 125px;
        height: 48px;
        object-fit: contain;
        animation: pulse 1s ease-in-out infinite;
      }

      .loading-dots {
        display: flex;
        gap: 5px;
      }

      .loading-dots span {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #666;
        animation: dotPulse 1s ease-in-out infinite;
      }

      .loading-dots span:nth-child(2) {
        animation-delay: .15s;
      }

      .loading-dots span:nth-child(3) {
        animation-delay: .3s;
      }

      /*
       * SUCCESS
       */

      .success-screen {
        display: grid;
        place-items: center;
        overflow: hidden;
      }

      .success-content {
        position: relative;
        z-index: 2;
        width: min(540px, calc(100% - 40px));
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .success-image {
        width: min(280px, 58vw);
        height: min(280px, 58vw);
        object-fit: contain;
        display: block;
        margin-bottom: 5px;
      }

      .success-content h1 {
        margin: 0 0 10px;
        color: #fff;
        font-family: ${HEAD_FONT};
        font-size: 42px;
        line-height: 1.2;
        font-weight: 600;
      }

      .success-content p {
        margin: 0;
        color: ${MUTED};
        font-size: 16px;
      }

      .success-content .main-button {
        width: 100%;
      }

      .confetti {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes pulse {
        0%, 100% {
          transform: scale(1);
          opacity: .9;
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

      /*
       * TABLET
       */

      @media (max-width: 1050px) {
        .payment-choice {
          column-gap: 50px;
          width: min(950px, 100%);
        }

        .qr-shell {
          width: 275px;
          height: 275px;
        }

        .qr-column h2,
        .internet-column h2 {
          font-size: 36px;
        }

        .select-bank-button {
          width: 400px;
        }
      }

      /*
       * MOBILE
       */

      @media (max-width: 759px) {
        .ideal-header {
          height: 78px;
        }

        .header-inner {
          width: calc(100% - 32px);
        }

        .header-logo {
          width: 100px;
          height: 38px;
        }

        .merchant {
          left: auto;
          right: 0;
          transform: translateY(-50%);
          text-align: right;
        }

        .merchant-name {
          font-size: 13px;
        }

        .merchant-amount {
          margin-top: 4px;
          font-size: 18px;
        }

        .start-page {
          width: calc(100% - 32px);
          min-height: calc(100dvh - 78px);
        }

        .start-cancel {
          top: 25px;
          left: 0;
          font-size: 18px;
        }

        .payment-choice {
          position: static;
          transform: none;
          width: 100%;
          min-height: calc(100dvh - 78px);
          padding: 120px 10px 50px;
          display: block;
        }

        .qr-column,
        .vertical-divider {
          display: none;
        }

        .internet-column {
          width: 100%;
        }

        .internet-column h2 {
          margin: 0 0 34px;
          font-size: 32px;
          line-height: 1.4;
        }

        .select-bank-button {
          width: 100%;
          height: 58px;
          font-size: 17px;
        }

        .banks-page {
          width: calc(100% - 28px);
          padding: 25px 0 50px;
        }

        .banks-page > .cancel-link {
          font-size: 18px;
        }

        .banks-container {
          margin-top: 78px;
        }

        .banks-heading h1 {
          font-size: 31px;
        }

        .banks-heading p {
          font-size: 14px;
        }

        .banks-grid {
          grid-template-columns: 1fr;
          gap: 9px;
        }

        .bank-item {
          min-height: 66px;
          padding: 7px 12px;
          font-size: 14px;
        }

        .bank-logo,
        .bank-logo-fallback {
          width: 45px;
          height: 45px;
          flex-basis: 45px;
        }

        .bank-logo img {
          width: 43px;
          height: 43px;
        }

        .simple-page {
          width: calc(100% - 28px);
          min-height: calc(100dvh - 78px);
          padding-top: 25px;
        }

        .simple-page > .cancel-link {
          top: 25px;
          font-size: 18px;
        }

        .simple-card {
          width: 100%;
          margin-top: 90px;
          padding: 30px 18px 28px;
          border-radius: 16px;
        }

        .simple-card h1 {
          font-size: 29px;
        }

        .simple-card > p {
          font-size: 14px;
        }

        .transfer-row {
          grid-template-columns: 78px 1fr auto;
          gap: 7px;
          padding: 9px 10px;
        }

        .transfer-row > span {
          font-size: 11px;
        }

        .transfer-row strong {
          font-size: 12px;
        }

        .copy-button {
          font-size: 10px;
        }

        .main-button,
        .outline-button {
          min-height: 54px;
          font-size: 14px;
        }

        .success-content h1 {
          font-size: 32px;
        }

        .success-content p {
          font-size: 14px;
        }
      }
    `}</style>
  );
}