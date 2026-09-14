import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BANK_LOGOS } from '../data/bankLogos';

import idealLogo from '../assets/ideal/ideal-logo.svg';
import adyenLogo from '../assets/ideal/adyen.png';
import finomLogo from '../assets/ideal/finom.png';
import successLight from '../assets/ideal/success-light.png';

const PINK = '#D5006D';
const BLACK = '#191919';
const WHITE = '#FFFFFF';
const GREY = '#B9B9B9';
const FONT = '"Lexend Deca", sans-serif';
const HEAD = '"Roboto Slab", serif';

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
    const id = 'wavegitaar-ideal-fonts';

    if (document.getElementById(id)) return;

    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Lexend+Deca:wght@300;400;500;600;700&family=Roboto+Slab:wght@600;700&display=swap';

    document.head.appendChild(link);
  }, []);
}

function LockPage() {
  useEffect(() => {
    const oldOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = oldOverflow;
    };
  }, []);
}

/*
 * Decorative QR
 *
 * This intentionally looks like a real QR code, including:
 * - dense modules
 * - three finder patterns
 * - timing patterns
 * - a real iDEAL logo in the centre
 *
 * It is deliberately not encoded with a valid payment payload.
 * Therefore it is visual only and cannot initiate a payment.
 */
function DecorativeQR() {
  const size = 33;

  const modules = useMemo(() => {
    const result: boolean[][] = Array.from(
      { length: size },
      () => Array(size).fill(false)
    );

    let seed = 874231;

    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    const finder = (row: number, col: number) => {
      for (let y = -1; y <= 7; y++) {
        for (let x = -1; x <= 7; x++) {
          const yy = row + y;
          const xx = col + x;

          if (
            yy < 0 ||
            yy >= size ||
            xx < 0 ||
            xx >= size
          ) {
            continue;
          }

          const inside =
            y >= 0 &&
            y <= 6 &&
            x >= 0 &&
            x <= 6;

          const border =
            y === 0 ||
            y === 6 ||
            x === 0 ||
            x === 6;

          const centre =
            y >= 2 &&
            y <= 4 &&
            x >= 2 &&
            x <= 4;

          result[yy][xx] = inside && (border || centre);
        }
      }
    };

    finder(0, 0);
    finder(0, size - 7);
    finder(size - 7, 0);

    // Timing-style lines
    for (let i = 8; i < size - 8; i++) {
      result[6][i] = i % 2 === 0;
      result[i][6] = i % 2 === 0;
    }

    // Dense deterministic module pattern.
    // A large centre area is intentionally left empty for the logo.
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nearFinder =
          (x <= 8 && y <= 8) ||
          (x >= size - 9 && y <= 8) ||
          (x <= 8 && y >= size - 9);

        const centre =
          x >= 12 &&
          x <= 20 &&
          y >= 12 &&
          y <= 20;

        if (nearFinder || centre) continue;

        if (random() > 0.48) {
          result[y][x] = true;
        }
      }
    }

    // Break a few modules around the centre.
    for (let y = 11; y <= 21; y++) {
      for (let x = 11; x <= 21; x++) {
        if (x === 11 || x === 21 || y === 11 || y === 21) {
          result[y][x] = false;
        }
      }
    }

    return result;
  }, []);

  const cell = 7;
  const qrSize = size * cell;

  return (
    <div className="qr-frame" aria-hidden="true">
      <svg
        className="qr-svg"
        viewBox={`0 0 ${qrSize} ${qrSize}`}
        role="img"
      >
        <rect
          x="0"
          y="0"
          width={qrSize}
          height={qrSize}
          fill="#fff"
        />

        {modules.map((row, y) =>
          row.map((active, x) =>
            active ? (
              <rect
                key={`${x}-${y}`}
                x={x * cell}
                y={y * cell}
                width={cell}
                height={cell}
                fill="#050505"
              />
            ) : null
          )
        )}

        <rect
          x={12 * cell - 7}
          y={12 * cell - 7}
          width={9 * cell + 14}
          height={9 * cell + 14}
          rx="2"
          fill="#fff"
        />

        <image
          href={idealLogo}
          x={13 * cell}
          y={13 * cell}
          width={7 * cell}
          height={7 * cell}
          preserveAspectRatio="xMidYMid meet"
        />
      </svg>
    </div>
  );
}

function BankLogo({ name }: { name: string }) {
  const [failed, setFailed] = useState(false);

  const aliases: Record<string, string> = {
    'ASN Bank vh RegioBank': 'RegioBank',
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
        {name.slice(0, 2).toUpperCase()}
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

function Spinner() {
  return <div className="spinner" />;
}

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 80 }, (_, index) => ({
        id: index,
        left: `${(index * 37) % 100}%`,
        delay: `${(index % 15) * 0.12}s`,
        duration: `${2.8 + (index % 8) * 0.25}s`,
        rotate: `${(index * 31) % 360}deg`,
      })),
    []
  );

  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          style={{
            left: piece.left,
            animationDelay: piece.delay,
            animationDuration: piece.duration,
            transform: `rotate(${piece.rotate})`,
          }}
        />
      ))}
    </div>
  );
}

export default function IdealPayment() {
  useFonts();
  LockPage();

  const [params] = useSearchParams();
  const navigate = useNavigate();

  const amount = formatAmount(params.get('amount'));
  const order = params.get('order') || '';
  const tracking = params.get('tracking') || '';

  const [introLoading, setIntroLoading] = useState(true);
  const [startScreen, setStartScreen] = useState(true);

  const [selectedBank, setSelectedBank] =
    useState<string | null>(null);

  const [bankLoading, setBankLoading] = useState(false);

  const [manualPayment, setManualPayment] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  const [success, setSuccess] = useState(false);

  const [copied, setCopied] = useState<string | null>(null);

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
      // Nothing required.
    }
  };

  const goToSuccessPage = () => {
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
    }, 900);
  };

  if (introLoading) {
    return (
      <div className="ideal-root intro-screen">
        <img
          src={idealLogo}
          alt="iDEAL | Wero"
          className="intro-logo"
        />

        <div className="intro-dots">
          <span />
          <span />
          <span />
        </div>

        <Styles />
      </div>
    );
  }

  if (success) {
    return (
      <div className="ideal-root success-screen">
        <Confetti />

        <div className="success-box">
          <img
            src={successLight}
            alt=""
            className="success-image"
          />

          <h1>Betaling geslaagd</h1>

          <p>
            Je betaling is succesvol verwerkt.
          </p>

          <button
            className="pink-button"
            onClick={goToSuccessPage}
          >
            Verder
          </button>
        </div>

        <Styles />
      </div>
    );
  }

  const header = (
    <header className="payment-header">
      <div className="header-logo">
        <img
          src={idealLogo}
          alt="iDEAL | Wero"
        />
      </div>

      <div className="merchant">
        <div className="merchant-name">
          WaveGitaar
        </div>

        <div className="merchant-amount">
          {amount}
        </div>
      </div>

      <button
        className="cancel-button"
        onClick={() => navigate('/checkout')}
      >
        Cancel
      </button>
    </header>
  );

  /*
   * START SCREEN
   */
  if (startScreen) {
    return (
      <div className="ideal-root">
        {header}

        <main className="start-main">
          <button
            className="mobile-cancel"
            onClick={() => navigate('/checkout')}
          >
            Cancel
          </button>

          <div className="start-layout">
            <section className="qr-column">
              <DecorativeQR />

              <h1>
                Scan with your
                <br />
                banking app to pay
              </h1>
            </section>

            <div className="vertical-divider" />

            <section className="internet-column">
              <h1>
                Or use internet
                <br />
                banking
              </h1>

              <button
                className="select-bank-button"
                onClick={() => setStartScreen(false)}
              >
                Select your bank
              </button>
            </section>
          </div>
        </main>

        <Styles />
      </div>
    );
  }

  /*
   * CONFIRMATION
   *
   * This must come BEFORE manualPayment.
   * Otherwise the manual-payment screen would always render first.
   */
  if (confirmation) {
    return (
      <div className="ideal-root">
        {header}

        <main className="center-main">
          <section className="payment-card">
            <button
              className="back-link"
              onClick={() => setConfirmation(false)}
            >
              ← Terug
            </button>

            <h1>Betaling bevestigen</h1>

            <p>
              Heb je het bedrag al handmatig
              overgemaakt?
            </p>

            <button
              className="pink-button"
              onClick={() => setSuccess(true)}
            >
              Ja, ik heb betaald
            </button>

            <button
              className="dark-button"
              onClick={() => setConfirmation(false)}
            >
              Nee, nog niet betaald
            </button>
          </section>
        </main>

        <Styles />
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
        value:
          order || 'WaveGitaar bestelling',
        key: 'reference',
      },
    ];

    return (
      <div className="ideal-root">
        {header}

        <main className="center-main">
          <section className="payment-card transfer-card">
            <button
              className="back-link"
              onClick={() => setManualPayment(false)}
            >
              ← Terug
            </button>

            <h1>Handmatig overmaken</h1>

            <p>
              Maak het bedrag over met de
              onderstaande betaalgegevens.
            </p>

            <div className="transfer-list">
              {details.map((item) => (
                <div
                  className="transfer-row"
                  key={item.key}
                >
                  <span>{item.label}</span>

                  <strong>
                    {item.value}
                  </strong>

                  {(item.key === 'iban' ||
                    item.key === 'reference') && (
                    <button
                      onClick={() =>
                        copyValue(
                          item.value,
                          item.key
                        )
                      }
                    >
                      {copied === item.key
                        ? 'Gekopieerd'
                        : 'Kopieer'}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              className="pink-button"
              onClick={() => setConfirmation(true)}
            >
              Ik heb betaald
            </button>
          </section>
        </main>

        <Styles />
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

        <main className="center-main">
          <section className="payment-card loading-card">
            <Spinner />

            <h1>
              Bankomgeving openen
            </h1>

            <p>{selectedBank}</p>
          </section>
        </main>

        <Styles />
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

        <main className="center-main">
          <section className="payment-card">
            <button
              className="back-link"
              onClick={() => {
                setSelectedBank(null);
                setStartScreen(false);
              }}
            >
              ← Terug naar banken
            </button>

            <BankLogo name={selectedBank} />

            <h1>
              {selectedBank}
            </h1>

            <p>
              Ga verder om je betaling af
              te ronden.
            </p>

            <button
              className="pink-button"
              onClick={() =>
                setManualPayment(true)
              }
            >
              Handmatig overmaken
            </button>

            <button
              className="dark-button"
              onClick={() =>
                setSelectedBank(null)
              }
            >
              Andere bank kiezen
            </button>
          </section>
        </main>

        <Styles />
      </div>
    );
  }

  /*
   * BANK SELECTION
   */
  return (
    <div className="ideal-root">
      {header}

      <main className="bank-main">
        <section className="bank-section">
          <button
            className="bank-back"
            onClick={() => setStartScreen(true)}
          >
            ← Back
          </button>

          <div className="bank-heading">
            <h1>Select your bank</h1>

            <p>
              Choose your bank to continue
              with the payment.
            </p>
          </div>

          <div className="bank-grid">
            {BANKS.map((bank) => (
              <button
                className="bank-row"
                key={bank}
                onClick={() => chooseBank(bank)}
              >
                <BankLogo name={bank} />

                <span>{bank}</span>

                <span className="bank-arrow">
                  →
                </span>
              </button>
            ))}
          </div>
        </section>
      </main>

      <Styles />
    </div>
  );
}

function Styles() {
  return (
    <style>{`
      * {
        box-sizing: border-box;
      }

      .ideal-root {
        position: fixed;
        inset: 0;
        z-index: 999999;
        overflow-y: auto;
        overflow-x: hidden;
        background: ${BLACK};
        color: #fff;
        font-family: ${FONT};
        font-weight: 400;
        -webkit-font-smoothing: antialiased;
        text-rendering: geometricPrecision;
      }

      .ideal-root button {
        font-family: ${FONT};
      }

      /* ----------------------------------------
         HEADER
      ---------------------------------------- */

      .payment-header {
        position: relative;
        min-height: 102px;
        width: 100%;
        background: ${PINK};
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        padding: 0 28px;
        color: #fff;
      }

      .header-logo {
        justify-self: start;
      }

      .header-logo img {
        display: block;
        width: 142px;
        height: 52px;
        object-fit: contain;
      }

      .merchant {
        text-align: center;
        line-height: 1.05;
      }

      .merchant-name {
        font-size: 26px;
        font-weight: 400;
        letter-spacing: -.02em;
      }

      .merchant-amount {
        margin-top: 8px;
        font-size: 31px;
        font-weight: 700;
        letter-spacing: -.03em;
      }

      .cancel-button {
        justify-self: end;
        border: 0;
        background: transparent;
        color: #fff;
        font-size: 18px;
        font-weight: 600;
        cursor: pointer;
        padding: 10px 8px;
      }

      .cancel-button:hover {
        opacity: .78;
      }

      .mobile-cancel {
        display: none;
      }

      /* ----------------------------------------
         INTRO
      ---------------------------------------- */

      .intro-screen {
        display: grid;
        place-items: center;
        background: #fff;
      }

      .intro-logo {
        width: 125px;
        height: auto;
        animation: introPulse 1s ease-in-out infinite;
      }

      .intro-dots {
        position: absolute;
        top: calc(50% + 60px);
        display: flex;
        gap: 5px;
      }

      .intro-dots span {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #69747b;
        animation: dotPulse 1s ease-in-out infinite;
      }

      .intro-dots span:nth-child(2) {
        animation-delay: .15s;
      }

      .intro-dots span:nth-child(3) {
        animation-delay: .3s;
      }

      /* ----------------------------------------
         START SCREEN
      ---------------------------------------- */

      .start-main {
        min-height: calc(100dvh - 102px);
        padding: 64px 70px 72px;
        position: relative;
      }

      .start-layout {
        width: min(1120px, 100%);
        min-height: 560px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: 1fr 1px 1fr;
        align-items: center;
        column-gap: 82px;
      }

      .qr-column,
      .internet-column {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
      }

      .qr-column h1,
      .internet-column h1 {
        font-family: ${HEAD};
        font-size: clamp(34px, 3.1vw, 48px);
        line-height: 1.35;
        font-weight: 600;
        letter-spacing: -.025em;
        margin: 42px 0 0;
        color: #fff;
      }

      .internet-column h1 {
        margin: 0 0 42px;
      }

      .vertical-divider {
        width: 1px;
        height: 410px;
        background: #707070;
        opacity: .72;
      }

      /* ----------------------------------------
         QR
      ---------------------------------------- */

      .qr-frame {
        width: 315px;
        height: 315px;
        background: #fff;
        border-radius: 21px;
        padding: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 0 1px rgba(255,255,255,.08);
      }

      .qr-svg {
        width: 100%;
        height: 100%;
        display: block;
        shape-rendering: crispEdges;
      }

      /* ----------------------------------------
         SELECT BANK BUTTON
      ---------------------------------------- */

      .select-bank-button {
        width: min(480px, 100%);
        height: 64px;
        border-radius: 34px;
        border: 1px solid #f0f0f0;
        background: transparent;
        color: #fff;
        font-size: 21px;
        font-weight: 600;
        cursor: pointer;
        transition:
          background .18s ease,
          color .18s ease,
          transform .18s ease;
      }

      .select-bank-button:hover {
        background: #fff;
        color: ${BLACK};
        transform: translateY(-1px);
      }

      /* ----------------------------------------
         BANK SELECTION
      ---------------------------------------- */

      .bank-main {
        min-height: calc(100dvh - 102px);
        padding: 52px 24px 70px;
      }

      .bank-section {
        width: min(780px, 100%);
        margin: 0 auto;
      }

      .bank-back {
        border: 0;
        background: transparent;
        color: ${PINK};
        padding: 0;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        margin-bottom: 30px;
      }

      .bank-heading {
        margin-bottom: 30px;
      }

      .bank-heading h1 {
        font-family: ${HEAD};
        font-size: 42px;
        line-height: 1.15;
        margin: 0 0 10px;
        color: #fff;
      }

      .bank-heading p {
        margin: 0;
        color: ${GREY};
        font-size: 15px;
      }

      .bank-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .bank-row {
        width: 100%;
        min-height: 76px;
        display: grid;
        grid-template-columns: 54px 1fr 24px;
        align-items: center;
        gap: 14px;
        padding: 10px 17px;
        border: 1px solid #454545;
        border-radius: 12px;
        background: #222;
        color: #fff;
        text-align: left;
        cursor: pointer;
        transition:
          border-color .15s ease,
          background .15s ease,
          transform .15s ease;
      }

      .bank-row:hover {
        background: #292929;
        border-color: #777;
        transform: translateY(-1px);
      }

      .bank-row > span {
        font-size: 15px;
        font-weight: 400;
      }

      .bank-arrow {
        text-align: right;
        color: #999;
        font-size: 19px !important;
      }

      /* ----------------------------------------
         BANK LOGOS
      ---------------------------------------- */

      .bank-logo {
        width: 54px;
        height: 54px;
        border-radius: 9px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        flex: 0 0 54px;
      }

      .bank-logo img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
      }

      .bank-logo-fallback {
        width: 54px;
        height: 54px;
        border-radius: 9px;
        display: grid;
        place-items: center;
        background: #303030;
        color: #fff;
        font-size: 14px;
        font-weight: 600;
      }

      /* ----------------------------------------
         CENTER / PAYMENT CARDS
      ---------------------------------------- */

      .center-main {
        min-height: calc(100dvh - 102px);
        display: grid;
        place-items: center;
        padding: 40px 20px 70px;
      }

      .payment-card {
        width: min(570px, 100%);
        background: #222;
        border: 1px solid #3d3d3d;
        border-radius: 18px;
        padding: 38px 42px 42px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .payment-card > .bank-logo {
        width: 78px;
        height: 78px;
        margin-bottom: 20px;
      }

      .payment-card > .bank-logo-fallback {
        width: 78px;
        height: 78px;
        margin-bottom: 20px;
      }

      .payment-card h1 {
        font-family: ${HEAD};
        color: #fff;
        font-size: 38px;
        line-height: 1.2;
        margin: 0 0 12px;
      }

      .payment-card > p {
        color: ${GREY};
        font-size: 15px;
        line-height: 1.65;
        margin: 0;
        max-width: 450px;
      }

      .back-link {
        align-self: flex-start;
        border: 0;
        background: transparent;
        color: ${PINK};
        padding: 0;
        margin: 0 0 28px;
        font-size: 14px;
        cursor: pointer;
      }

      /* ----------------------------------------
         BUTTONS
      ---------------------------------------- */

      .pink-button,
      .dark-button {
        width: 100%;
        min-height: 58px;
        border-radius: 10px;
        padding: 14px 20px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        margin-top: 16px;
      }

      .pink-button {
        border: 0;
        background: ${PINK};
        color: #fff;
      }

      .pink-button:hover {
        background: #e00076;
      }

      .dark-button {
        border: 1px solid #555;
        background: #2b2b2b;
        color: #fff;
      }

      .dark-button:hover {
        background: #333;
      }

      /* ----------------------------------------
         TRANSFER
      ---------------------------------------- */

      .transfer-card {
        width: min(690px, 100%);
      }

      .transfer-list {
        width: 100%;
        margin-top: 28px;
        border: 1px solid #404040;
        border-radius: 12px;
        overflow: hidden;
      }

      .transfer-row {
        min-height: 65px;
        display: grid;
        grid-template-columns: 125px 1fr auto;
        gap: 12px;
        align-items: center;
        text-align: left;
        padding: 10px 15px;
        border-bottom: 1px solid #353535;
      }

      .transfer-row:last-child {
        border-bottom: 0;
      }

      .transfer-row > span {
        color: #9e9e9e;
        font-size: 12px;
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
        cursor: pointer;
        font-size: 12px;
        white-space: nowrap;
      }

      /* ----------------------------------------
         LOADING
      ---------------------------------------- */

      .loading-card {
        min-height: 320px;
        justify-content: center;
      }

      .spinner {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        border: 3px solid #444;
        border-top-color: ${PINK};
        animation: spin .75s linear infinite;
        margin-bottom: 25px;
      }

      /* ----------------------------------------
         SUCCESS
      ---------------------------------------- */

      .success-screen {
        display: grid;
        place-items: center;
        overflow: hidden;
      }

      .success-box {
        width: min(520px, calc(100% - 40px));
        text-align: center;
        position: relative;
        z-index: 2;
      }

      .success-image {
        display: block;
        width: min(280px, 60vw);
        height: min(280px, 60vw);
        object-fit: contain;
        margin: 0 auto 10px;
      }

      .success-box h1 {
        font-family: ${HEAD};
        font-size: 42px;
        margin: 0 0 12px;
      }

      .success-box p {
        margin: 0 0 25px;
        color: ${GREY};
        font-size: 15px;
      }

      .success-box .pink-button {
        width: min(450px, 100%);
        margin: 0 auto;
      }

      .confetti {
        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
      }

      .confetti span {
        position: absolute;
        top: -20px;
        width: 7px;
        height: 13px;
        background: ${PINK};
        animation-name: fall;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
      }

      .confetti span:nth-child(3n) {
        background: #fff;
      }

      .confetti span:nth-child(4n) {
        background: #ffd500;
      }

      .confetti span:nth-child(5n) {
        background: #00a7e1;
      }

      /* ----------------------------------------
         ANIMATIONS
      ---------------------------------------- */

      @keyframes introPulse {
        0%,
        100% {
          opacity: .78;
          transform: scale(.98);
        }

        50% {
          opacity: 1;
          transform: scale(1.03);
        }
      }

      @keyframes dotPulse {
        0%,
        80%,
        100% {
          opacity: .25;
          transform: scale(.65);
        }

        40% {
          opacity: 1;
          transform: scale(1);
        }
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes fall {
        from {
          transform:
            translate3d(0, -20px, 0)
            rotate(0deg);
        }

        to {
          transform:
            translate3d(20px, 110vh, 0)
            rotate(540deg);
        }
      }

      /* ----------------------------------------
         TABLET
      ---------------------------------------- */

      @media (max-width: 900px) {
        .start-main {
          padding-left: 35px;
          padding-right: 35px;
        }

        .start-layout {
          column-gap: 45px;
        }

        .qr-frame {
          width: 270px;
          height: 270px;
          padding: 18px;
        }

        .qr-column h1,
        .internet-column h1 {
          font-size: 34px;
        }
      }

      /* ----------------------------------------
         MOBILE
      ---------------------------------------- */

      @media (max-width: 700px) {
        .payment-header {
          min-height: 82px;
          padding: 0 16px;
          grid-template-columns: auto 1fr;
          gap: 15px;
        }

        .header-logo img {
          width: 94px;
          height: 38px;
        }

        .merchant {
          justify-self: end;
          text-align: right;
        }

        .merchant-name {
          font-size: 14px;
        }

        .merchant-amount {
          font-size: 20px;
          margin-top: 5px;
        }

        .cancel-button {
          display: none;
        }

        .mobile-cancel {
          display: block;
          position: absolute;
          top: 18px;
          left: 18px;
          border: 0;
          background: transparent;
          color: ${PINK};
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          z-index: 5;
        }

        .start-main {
          min-height: calc(100dvh - 82px);
          padding: 70px 20px 40px;
        }

        .start-layout {
          min-height: 0;
          display: flex;
          flex-direction: column;
          width: 100%;
          gap: 0;
        }

        .qr-column {
          display: none;
        }

        .vertical-divider {
          display: none;
        }

        .internet-column {
          width: 100%;
          min-height: calc(100dvh - 160px);
          justify-content: center;
        }

        .internet-column h1 {
          font-size: 34px;
          line-height: 1.35;
          margin: 0 0 35px;
        }

        .select-bank-button {
          width: min(430px, 100%);
          height: 60px;
          font-size: 18px;
        }

        .bank-main {
          min-height: calc(100dvh - 82px);
          padding: 30px 14px 45px;
        }

        .bank-section {
          width: 100%;
        }

        .bank-heading h1 {
          font-size: 32px;
        }

        .bank-grid {
          grid-template-columns: 1fr;
          gap: 9px;
        }

        .bank-row {
          min-height: 68px;
        }

        .center-main {
          min-height: calc(100dvh - 82px);
          padding: 25px 14px 45px;
        }

        .payment-card {
          border-radius: 15px;
          padding: 30px 18px 25px;
        }

        .payment-card h1 {
          font-size: 30px;
        }

        .transfer-row {
          grid-template-columns: 76px 1fr auto;
          gap: 8px;
          padding-left: 11px;
          padding-right: 11px;
        }

        .success-box h1 {
          font-size: 32px;
        }
      }

      @media (max-width: 420px) {
        .header-logo img {
          width: 86px;
        }

        .merchant-name {
          font-size: 12px;
        }

        .merchant-amount {
          font-size: 18px;
        }

        .internet-column h1 {
          font-size: 29px;
        }

        .bank-row {
          grid-template-columns: 48px 1fr 20px;
          gap: 11px;
        }

        .bank-logo,
        .bank-logo-fallback {
          width: 48px;
          height: 48px;
          flex-basis: 48px;
        }

        .bank-row > span {
          font-size: 14px;
        }

        .transfer-row {
          grid-template-columns: 68px 1fr;
        }

        .transfer-row button {
          grid-column: 2;
          justify-self: start;
        }
      }
    `}</style>
  );
}