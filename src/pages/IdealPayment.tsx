import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BANK_LOGOS } from '../data/bankLogos';

import idealLogo from '../assets/ideal/ideal-logo.svg';
import adyenLogo from '../assets/ideal/adyen.png';
import finomLogo from '../assets/ideal/finom.png';
import successDark from '../assets/ideal/success-dark.png';

const PINK = '#D5006D';
const BG = '#1B191A';
const PANEL = '#222021';
const BORDER = '#555052';
const TEXT = '#FFFFFF';
const MUTED = '#B8B3B5';

const BODY_FONT = '"Lexend Deca", sans-serif';
const HEAD_FONT = '"Roboto Slab", serif';

/*
 * QR uit de aangeleverde screenshot.
 *
 * Dit is bewust GEEN echte betaal-QR:
 * er is een minimale structurele wijziging aangebracht
 * in één finder pattern zodat hij niet als betaalcode
 * gebruikt kan worden.
 */
const QR_DATA =
  'data:image/png;base64,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';

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
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return '€0,00';
  }

  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(number);
}

function useFonts() {
  useEffect(() => {
    if (document.getElementById('ideal-fonts')) return;

    const link = document.createElement('link');

    link.id = 'ideal-fonts';
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Lexend+Deca:wght@300;400;500;600&family=Roboto+Slab:wght@600&display=swap';

    document.head.appendChild(link);
  }, []);
}

function BankLogo({ name }: { name: string }) {
  const [failed, setFailed] = useState(false);

  const aliases: Record<string, string> = {
    'ASN Bank vh RegioBank': 'RegioBank',
    'ASN Bank voorheen SNS': 'SNS',
    bunq: 'Bunq',
  };

  const source =
    name === 'Adyen'
      ? adyenLogo
      : name === 'Finom'
        ? finomLogo
        : BANK_LOGOS[name] || BANK_LOGOS[aliases[name]];

  if (!source || failed) {
    return (
      <div className="bank-fallback">
        {name
          .split(' ')
          .map((word) => word[0])
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

function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;

      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    const colors = [
      PINK,
      '#FFD500',
      '#00A7E1',
      '#65C466',
      '#FF7A00',
    ];

    const pieces = Array.from({ length: 75 }, () => ({
      x: Math.random() * window.innerWidth,
      y: -Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: 0.4 + Math.random() * 0.55,
      rotation: Math.random() * Math.PI,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      width: 5 + Math.random() * 5,
      height: 3 + Math.random() * 4,
      color:
        colors[Math.floor(Math.random() * colors.length)],
    }));

    let frame = 0;

    const animate = () => {
      ctx.clearRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
      );

      pieces.forEach((piece) => {
        ctx.save();

        ctx.translate(piece.x, piece.y);
        ctx.rotate(piece.rotation);
        ctx.fillStyle = piece.color;

        ctx.fillRect(
          -piece.width / 2,
          -piece.height / 2,
          piece.width,
          piece.height
        );

        ctx.restore();

        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.rotation += piece.rotationSpeed;

        if (piece.y > window.innerHeight + 20) {
          piece.y = -20;
          piece.x = Math.random() * window.innerWidth;
        }
      });

      frame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(frame);
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

function Header({
  amount,
}: {
  amount: string;
}) {
  return (
    <header className="header">
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
}

export default function IdealPayment() {
  useFonts();

  useEffect(() => {
    const oldOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = oldOverflow;
    };
  }, []);

  const [params] = useSearchParams();
  const navigate = useNavigate();

  const amount = formatAmount(params.get('amount'));
  const order =
    params.get('order') || 'WaveGitaar bestelling';
  const tracking = params.get('tracking') || '';

  const [introLoading, setIntroLoading] = useState(true);

  const [screen, setScreen] = useState<
    'start' | 'banks' | 'loading' | 'bank' | 'transfer' | 'confirm' | 'success'
  >('start');

  const [selectedBank, setSelectedBank] =
    useState<string | null>(null);

  const [copied, setCopied] =
    useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIntroLoading(false);
    }, 700);

    return () => window.clearTimeout(timer);
  }, []);

  const selectBank = (bank: string) => {
    setSelectedBank(bank);
    setScreen('loading');

    window.setTimeout(() => {
      setScreen('bank');
    }, 850);
  };

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
      }, 1400);
    } catch {
      // Clipboard unavailable.
    }
  };

  const finish = () => {
    navigate(
      `/checkout/success?order=${encodeURIComponent(
        order
      )}&tracking=${encodeURIComponent(tracking)}`
    );
  };

  if (introLoading) {
    return (
      <div className="page loading-page">
        <img
          src={idealLogo}
          alt="iDEAL | Wero"
          className="loading-logo"
        />

        <div className="loading-dots">
          <i />
          <i />
          <i />
        </div>

        <Styles />
      </div>
    );
  }

  if (screen === 'success') {
    return (
      <div className="page success-page">
        <Confetti />

        <div className="success-content">
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
            className="primary-button"
            onClick={finish}
          >
            Verder
          </button>
        </div>

        <Styles />
      </div>
    );
  }

  if (screen === 'start') {
    return (
      <div className="page">
        <Header amount={amount} />

        <main className="start-main">
          <button
            className="cancel"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>

          <section className="payment-choice">
            <div className="qr-side">
              <div className="qr-box">
                <img
                  src={QR_DATA}
                  alt=""
                  draggable={false}
                />
              </div>

              <h2>
                Scan with your
                <br />
                banking app to pay
              </h2>
            </div>

            <div className="divider" />

            <div className="bank-side">
              <h2>
                Or use internet
                <br />
                banking
              </h2>

              <button
                className="select-bank"
                onClick={() => setScreen('banks')}
              >
                Select your bank
              </button>
            </div>
          </section>
        </main>

        <Styles />
      </div>
    );
  }

  if (screen === 'banks') {
    return (
      <div className="page">
        <Header amount={amount} />

        <main className="banks-main">
          <button
            className="cancel"
            onClick={() => setScreen('start')}
          >
            Cancel
          </button>

          <section className="banks-section">
            <div className="banks-title">
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
                  onClick={() => selectBank(bank)}
                >
                  <BankLogo name={bank} />

                  <span>{bank}</span>

                  <b>›</b>
                </button>
              ))}
            </div>
          </section>
        </main>

        <Styles />
      </div>
    );
  }

  if (screen === 'loading') {
    return (
      <div className="page">
        <Header amount={amount} />

        <main className="center-main">
          <button
            className="cancel absolute-cancel"
            onClick={() => {
              setSelectedBank(null);
              setScreen('banks');
            }}
          >
            Cancel
          </button>

          <section className="card loading-card">
            <div className="spinner" />

            <h1>Bankomgeving openen</h1>

            <p>{selectedBank}</p>
          </section>
        </main>

        <Styles />
      </div>
    );
  }

  if (screen === 'bank') {
    return (
      <div className="page">
        <Header amount={amount} />

        <main className="center-main">
          <button
            className="cancel absolute-cancel"
            onClick={() => {
              setSelectedBank(null);
              setScreen('banks');
            }}
          >
            Cancel
          </button>

          <section className="card">
            <div className="chosen-logo">
              {selectedBank && (
                <BankLogo name={selectedBank} />
              )}
            </div>

            <h1>Handmatig betalen</h1>

            <p>
              Je kunt het bedrag handmatig
              overmaken.
            </p>

            <button
              className="primary-button"
              onClick={() => setScreen('transfer')}
            >
              Handmatig overmaken
            </button>

            <button
              className="secondary-button"
              onClick={() => {
                setSelectedBank(null);
                setScreen('banks');
              }}
            >
              Andere bank kiezen
            </button>
          </section>
        </main>

        <Styles />
      </div>
    );
  }

  if (screen === 'transfer') {
    const rows = [
      ['Bedrag', amount, 'amount'],
      ['Ten name van', 'WaveGitaar', 'name'],
      ['IBAN', 'NL00 0000 0000 0000 00', 'iban'],
      [
        'Omschrijving',
        order,
        'reference',
      ],
    ];

    return (
      <div className="page">
        <Header amount={amount} />

        <main className="center-main">
          <button
            className="cancel absolute-cancel"
            onClick={() => setScreen('bank')}
          >
            Cancel
          </button>

          <section className="card transfer-card">
            <h1>Handmatig overmaken</h1>

            <p>
              Maak het bedrag over met onderstaande
              betaalgegevens.
            </p>

            <div className="transfer-list">
              {rows.map(([label, value, key]) => (
                <div
                  className="transfer-row"
                  key={key}
                >
                  <span>{label}</span>

                  <strong>{value}</strong>

                  {(key === 'iban' ||
                    key === 'reference') && (
                    <button
                      onClick={() =>
                        copyValue(value, key)
                      }
                    >
                      {copied === key
                        ? 'Gekopieerd'
                        : 'Kopieer'}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              className="primary-button"
              onClick={() => setScreen('confirm')}
            >
              Ik heb betaald
            </button>
          </section>
        </main>

        <Styles />
      </div>
    );
  }

  if (screen === 'confirm') {
    return (
      <div className="page">
        <Header amount={amount} />

        <main className="center-main">
          <button
            className="cancel absolute-cancel"
            onClick={() => setScreen('transfer')}
          >
            Cancel
          </button>

          <section className="card">
            <h1>Betaling bevestigen</h1>

            <p>
              Heb je het bedrag al handmatig
              overgemaakt?
            </p>

            <button
              className="primary-button"
              onClick={() => setScreen('success')}
            >
              Ja, ik heb betaald
            </button>

            <button
              className="secondary-button"
              onClick={() => setScreen('transfer')}
            >
              Nee, nog niet betaald
            </button>
          </section>
        </main>

        <Styles />
      </div>
    );
  }

  return null;
}

function Styles() {
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
        background: ${BG};
      }

      .page {
        position: fixed;
        inset: 0;
        z-index: 999999;
        overflow-y: auto;
        overflow-x: hidden;
        background: ${BG};
        color: ${TEXT};
        font-family: ${BODY_FONT};
        -webkit-font-smoothing: antialiased;
      }

      button {
        font-family: ${BODY_FONT};
      }

      .header {
        width: 100%;
        height: 103px;
        background: ${PINK};
      }

      .header-inner {
        width: min(1430px, calc(100% - 80px));
        height: 100%;
        margin: auto;
        position: relative;
        display: flex;
        align-items: center;
      }

      .header-logo {
        width: 143px;
        height: 55px;
        object-fit: contain;
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
        font-size: 28px;
        line-height: 1.1;
        font-weight: 400;
      }

      .merchant-amount {
        margin-top: 7px;
        font-size: 31px;
        line-height: 1;
        font-weight: 600;
      }

      .cancel {
        border: 0;
        background: transparent;
        padding: 0;
        color: ${PINK};
        font-size: 22px;
        font-weight: 600;
        cursor: pointer;
      }

      .start-main {
        width: min(1430px, calc(100% - 80px));
        min-height: calc(100dvh - 103px);
        margin: auto;
        position: relative;
      }

      .start-main > .cancel {
        position: absolute;
        left: 0;
        top: 31px;
      }

      .payment-choice {
        width: min(1140px, 100%);
        position: absolute;
        left: 50%;
        top: 132px;
        transform: translateX(-50%);
        display: grid;
        grid-template-columns: 1fr 1px 1fr;
        column-gap: 96px;
        align-items: center;
      }

      .qr-side,
      .bank-side {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .qr-box {
        width: 312px;
        height: 312px;
        border-radius: 22px;
        overflow: hidden;
        background: #fff;
        flex-shrink: 0;
      }

      .qr-box img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
        user-select: none;
      }

      .qr-side h2,
      .bank-side h2 {
        color: #fff;
        font-family: ${HEAD_FONT};
        font-size: 43px;
        line-height: 1.45;
        font-weight: 600;
        letter-spacing: -.025em;
      }

      .qr-side h2 {
        margin: 42px 0 0;
      }

      .bank-side h2 {
        margin: 0 0 40px;
      }

      .divider {
        width: 1px;
        height: 412px;
        background: #686365;
      }

      .select-bank {
        width: 480px;
        max-width: 100%;
        height: 62px;
        border: 1px solid #e3e0e1;
        border-radius: 35px;
        background: transparent;
        color: #fff;
        font-size: 22px;
        font-weight: 600;
        cursor: pointer;
        transition: .18s ease;
      }

      .select-bank:hover {
        background: #fff;
        color: ${BG};
      }

      /*
       * BANKS
       */

      .banks-main {
        width: min(1120px, calc(100% - 40px));
        margin: auto;
        padding: 31px 0 70px;
      }

      .banks-section {
        margin-top: 47px;
      }

      .banks-title {
        text-align: center;
        margin-bottom: 34px;
      }

      .banks-title h1 {
        margin: 0;
        color: #fff;
        font-family: ${HEAD_FONT};
        font-size: 43px;
        line-height: 1.2;
        font-weight: 600;
      }

      .banks-title p {
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
        min-height: 76px;
        border: 1px solid ${BORDER};
        border-radius: 12px;
        background: ${PANEL};
        color: #fff;
        padding: 10px 17px;
        display: flex;
        align-items: center;
        gap: 15px;
        text-align: left;
        cursor: pointer;
        transition: .15s ease;
      }

      .bank-item:hover {
        background: #292627;
        border-color: #817B7E;
      }

      .bank-item > span {
        flex: 1;
        font-size: 15px;
        font-weight: 500;
      }

      .bank-item > b {
        color: #AAA5A8;
        font-size: 28px;
        font-weight: 300;
        line-height: 1;
      }

      /*
       * LOGOS
       */

      .bank-logo {
        width: 52px;
        height: 52px;
        flex: 0 0 52px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        background: transparent;
        border-radius: 8px;
      }

      .bank-logo img {
        width: 50px;
        height: 50px;
        object-fit: contain;
        display: block;
        background: transparent;
      }

      .bank-fallback {
        width: 52px;
        height: 52px;
        flex: 0 0 52px;
        display: grid;
        place-items: center;
        border-radius: 8px;
        background: #302D2E;
        border: 1px solid #555052;
        color: #fff;
        font-size: 14px;
        font-weight: 600;
      }

      /*
       * OTHER SCREENS
       */

      .center-main {
        min-height: calc(100dvh - 103px);
        display: grid;
        place-items: center;
        padding: 40px 20px;
        position: relative;
      }

      .absolute-cancel {
        position: absolute;
        left: max(20px, calc((100% - 820px) / 2));
        top: 31px;
      }

      .card {
        width: min(600px, calc(100% - 20px));
        background: ${PANEL};
        border: 1px solid ${BORDER};
        border-radius: 20px;
        padding: 42px;
        text-align: center;
      }

      .card h1 {
        margin: 0 0 14px;
        color: #fff;
        font-family: ${HEAD_FONT};
        font-size: 38px;
        line-height: 1.2;
      }

      .card > p {
        margin: 0;
        color: ${MUTED};
        font-size: 16px;
        line-height: 1.6;
      }

      .chosen-logo {
        width: 64px;
        height: 64px;
        margin: 0 auto 24px;
        display: grid;
        place-items: center;
      }

      .chosen-logo .bank-logo {
        width: 64px;
        height: 64px;
      }

      .chosen-logo .bank-logo img {
        width: 62px;
        height: 62px;
      }

      .primary-button,
      .secondary-button {
        width: 100%;
        min-height: 58px;
        border-radius: 30px;
        padding: 14px 20px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        margin-top: 22px;
      }

      .primary-button {
        border: 1px solid ${PINK};
        background: ${PINK};
        color: #fff;
      }

      .primary-button:hover {
        background: #E00077;
      }

      .secondary-button {
        border: 1px solid #696466;
        background: transparent;
        color: #fff;
      }

      .secondary-button:hover {
        border-color: #fff;
      }

      .transfer-card {
        width: min(700px, calc(100% - 20px));
      }

      .transfer-list {
        width: 100%;
        margin-top: 28px;
        border: 1px solid #4F4A4C;
        border-radius: 12px;
        overflow: hidden;
        text-align: left;
      }

      .transfer-row {
        min-height: 65px;
        display: grid;
        grid-template-columns: 120px 1fr auto;
        align-items: center;
        gap: 12px;
        padding: 9px 14px;
        border-bottom: 1px solid #3C393A;
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

      .transfer-row button {
        border: 0;
        background: transparent;
        color: ${PINK};
        font-size: 12px;
        cursor: pointer;
      }

      /*
       * LOADING
       */

      .loading-card {
        min-height: 320px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }

      .spinner {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        border: 3px solid #484446;
        border-top-color: ${PINK};
        animation: spin .75s linear infinite;
        margin-bottom: 26px;
      }

      /*
       * INTRO
       */

      .loading-page {
        display: grid;
        place-items: center;
        background: #fff;
      }

      .loading-logo {
        width: 125px;
        height: 48px;
        object-fit: contain;
        animation: pulse 1s ease-in-out infinite;
      }

      .loading-dots {
        position: absolute;
        top: calc(50% + 43px);
        display: flex;
        gap: 5px;
      }

      .loading-dots i {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #777;
        animation: dot 1s ease-in-out infinite;
      }

      .loading-dots i:nth-child(2) {
        animation-delay: .15s;
      }

      .loading-dots i:nth-child(3) {
        animation-delay: .3s;
      }

      /*
       * SUCCESS
       */

      .success-page {
        display: grid;
        place-items: center;
        overflow: hidden;
      }

      .success-content {
        position: relative;
        z-index: 2;
        width: min(540px, calc(100% - 40px));
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .success-image {
        width: min(280px, 58vw);
        height: min(280px, 58vw);
        object-fit: contain;
      }

      .success-content h1 {
        margin: 5px 0 10px;
        color: #fff;
        font-family: ${HEAD_FONT};
        font-size: 42px;
        line-height: 1.2;
      }

      .success-content p {
        margin: 0;
        color: ${MUTED};
        font-size: 16px;
      }

      .success-content .primary-button {
        margin-top: 25px;
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
          opacity: .9;
          transform: scale(1);
        }

        50% {
          opacity: 1;
          transform: scale(1.03);
        }
      }

      @keyframes dot {
        0%, 80%, 100% {
          opacity: .3;
          transform: scale(.65);
        }

        40% {
          opacity: 1;
          transform: scale(1);
        }
      }

      /*
       * MOBILE
       */

      @media (max-width: 759px) {
        .header {
          height: 78px;
        }

        .header-inner {
          width: calc(100% - 30px);
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

        .start-main {
          width: calc(100% - 30px);
          min-height: calc(100dvh - 78px);
        }

        .start-main > .cancel {
          top: 24px;
          font-size: 18px;
        }

        .payment-choice {
          position: static;
          transform: none;
          width: 100%;
          min-height: calc(100dvh - 78px);
          display: flex;
          justify-content: center;
          padding: 125px 8px 40px;
        }

        .qr-side,
        .divider {
          display: none;
        }

        .bank-side {
          width: 100%;
        }

        .bank-side h2 {
          margin: 0 0 32px;
          font-size: 32px;
          line-height: 1.4;
        }

        .select-bank {
          width: 100%;
          height: 58px;
          font-size: 17px;
        }

        .banks-main {
          width: calc(100% - 28px);
          padding-top: 24px;
        }

        .banks-main > .cancel {
          font-size: 18px;
        }

        .banks-section {
          margin-top: 72px;
        }

        .banks-title h1 {
          font-size: 31px;
        }

        .banks-title p {
          font-size: 14px;
        }

        .banks-grid {
          grid-template-columns: 1fr;
          gap: 9px;
        }

        .bank-item {
          min-height: 66px;
          padding: 7px 11px;
        }

        .bank-logo,
        .bank-fallback {
          width: 45px;
          height: 45px;
          flex-basis: 45px;
        }

        .bank-logo img {
          width: 43px;
          height: 43px;
        }

        .center-main {
          min-height: calc(100dvh - 78px);
          padding: 20px 14px;
        }

        .absolute-cancel {
          left: 14px;
          top: 24px;
          font-size: 18px;
        }

        .card {
          width: 100%;
          padding: 30px 18px;
          border-radius: 16px;
        }

        .card h1 {
          font-size: 29px;
        }

        .card > p {
          font-size: 14px;
        }

        .transfer-row {
          grid-template-columns: 78px 1fr auto;
          gap: 7px;
          padding: 9px;
        }

        .transfer-row > span {
          font-size: 11px;
        }

        .transfer-row strong {
          font-size: 12px;
        }

        .transfer-row button {
          font-size: 10px;
        }

        .success-content h1 {
          font-size: 32px;
        }

        .success-content p {
          font-size: 14px;
        }
      }

      @media (min-width: 760px) and (max-width: 1100px) {
        .payment-choice {
          column-gap: 45px;
        }

        .qr-box {
          width: 270px;
          height: 270px;
        }

        .qr-side h2,
        .bank-side h2 {
          font-size: 36px;
        }

        .select-bank {
          width: 400px;
        }
      }
    `}</style>
  );
}