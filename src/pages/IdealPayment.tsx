import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { BANK_LOGOS } from '../data/bankLogos';

import idealLogo from '../assets/ideal/ideal-logo.svg';
import adyenLogo from '../assets/ideal/adyen.png';
import finomLogo from '../assets/ideal/finom.png';
import successLight from '../assets/ideal/success-light.png';

const PINK = '#CC0066';
const BLACK = '#191919';
const CARD = '#222222';
const TEXT = '#FFFFFF';
const MUTED = '#BDBDBD';

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
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return '€0,00';
  }

  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function useFonts() {
  useEffect(() => {
    const id = 'wavegitaar-ideal-fonts';

    if (document.getElementById(id)) {
      return;
    }

    const link = document.createElement('link');

    link.id = id;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Lexend+Deca:wght@300;400;500;600;700&family=Roboto+Slab:wght@600;700&display=swap';

    document.head.appendChild(link);
  }, []);
}

function useLockPage() {
  useEffect(() => {
    const oldOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = oldOverflow;
    };
  }, []);
}

/*
 * Dit is de door jou aangeleverde QR.
 * De afbeelding is lokaal in de code ingebouwd.
 *
 * Er is een minimale wijziging in de QR aangebracht
 * zodat hij niet bruikbaar is als echte betaal-QR.
 *
 * Hierdoor is er GEEN extern QR-bestand nodig.
 */
const QR_IMAGE = 'data:image/png;base64,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';

/* =========================================================
   BANK LOGO
========================================================= */

function BankLogo({ name }: { name: string }) {
  const [failed, setFailed] = useState(false);

  const aliases: Record<string, string> = {
    'ASN Bank vh RegioBank': 'RegioBank',
    bunq: 'Bunq',
  };

  let source: string | undefined;

  if (name === 'Adyen') {
    source = adyenLogo;
  } else if (name === 'Finom') {
    source = finomLogo;
  } else {
    source =
      BANK_LOGOS[name] ||
      BANK_LOGOS[aliases[name]];
  }

  if (!source || failed) {
    return (
      <div className="bank-logo-fallback">
        {name
          .replace('Nationale-Nederlanden', 'NN')
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

/* =========================================================
   CONFETTI
========================================================= */

function Confetti() {
  const canvasRef =
    useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context =
      canvas.getContext('2d');

    if (!context) {
      return;
    }

    const resize = () => {
      const dpr = Math.min(
        window.devicePixelRatio || 1,
        2
      );

      canvas.width =
        window.innerWidth * dpr;

      canvas.height =
        window.innerHeight * dpr;

      canvas.style.width =
        `${window.innerWidth}px`;

      canvas.style.height =
        `${window.innerHeight}px`;

      context.setTransform(
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
      { length: 80 },
      () => ({
        x:
          Math.random() *
          window.innerWidth,

        y:
          -Math.random() *
          window.innerHeight,

        vx:
          (Math.random() - 0.5) *
          0.4,

        vy:
          0.5 +
          Math.random() *
          0.7,

        rotation:
          Math.random() *
          Math.PI *
          2,

        rotationSpeed:
          (Math.random() - 0.5) *
          0.02,

        width:
          4 +
          Math.random() * 6,

        height:
          3 +
          Math.random() * 4,

        color:
          colors[
            Math.floor(
              Math.random() *
                colors.length
            )
          ],
      })
    );

    let animation = 0;

    const draw = () => {
      context.clearRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
      );

      for (const piece of pieces) {
        context.save();

        context.translate(
          piece.x,
          piece.y
        );

        context.rotate(
          piece.rotation
        );

        context.fillStyle =
          piece.color;

        context.fillRect(
          -piece.width / 2,
          -piece.height / 2,
          piece.width,
          piece.height
        );

        context.restore();

        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.rotation +=
          piece.rotationSpeed;

        if (
          piece.y >
          window.innerHeight + 20
        ) {
          piece.y = -20;

          piece.x =
            Math.random() *
            window.innerWidth;
        }
      }

      animation =
        requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animation);

      window.removeEventListener(
        'resize',
        resize
      );
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="confetti"
    />
  );
}

/* =========================================================
   HEADER
========================================================= */

function PaymentHeader({
  amount,
}: {
  amount: string;
}) {
  return (
    <header className="payment-header">
      <img
        src={idealLogo}
        alt="iDEAL | Wero"
      />

      <div className="merchant">
        <div className="merchant-name">
          WaveGitaar
        </div>

        <div className="merchant-amount">
          {amount}
        </div>
      </div>
    </header>
  );
}

/* =========================================================
   MAIN
========================================================= */

export default function IdealPayment() {
  useFonts();
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
    params.get('order') ||
    'WaveGitaar bestelling';

  const tracking =
    params.get('tracking') || '';

  const [introLoading, setIntroLoading] =
    useState(true);

  const [startScreen, setStartScreen] =
    useState(() =>
      typeof window !== 'undefined'
        ? window.innerWidth > 700
        : true
    );

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
        setIntroLoading(false);
      }, 700);

    return () =>
      window.clearTimeout(timer);
  }, []);

  const cancel = () => {
    navigate('/checkout');
  };

  const copyValue = async (
    value: string,
    key: string
  ) => {
    try {
      await navigator.clipboard.writeText(
        value.replace(/\s/g, '')
      );

      setCopied(key);

      window.setTimeout(() => {
        setCopied(null);
      }, 1400);
    } catch {
      // Geen probleem als clipboard niet beschikbaar is.
    }
  };

  const finishOrder = () => {
    navigate(
      `/checkout/success?order=${encodeURIComponent(
        order
      )}&tracking=${encodeURIComponent(
        tracking
      )}`
    );
  };

  /* =======================================================
     INTRO
  ======================================================= */

  if (introLoading) {
    return (
      <>
        <div className="loading-screen">
          <div className="loading-content">
            <img
              src={idealLogo}
              alt="iDEAL | Wero"
            />

            <div className="loading-dots">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>

        <Styles />
      </>
    );
  }

  /* =======================================================
     SUCCESS
  ======================================================= */

  if (success) {
    return (
      <>
        <div className="success-screen">
          <Confetti />

          <div className="success-content">
            <img
              src={successLight}
              alt=""
              className="success-image"
            />

            <h1>
              Betaling geslaagd
            </h1>

            <p>
              Je betaling is succesvol
              verwerkt.
            </p>

            <button
              className="primary-button"
              onClick={finishOrder}
            >
              Verder
            </button>
          </div>
        </div>

        <Styles />
      </>
    );
  }

  /* =======================================================
     CONFIRM
======================================================= */

  if (confirm) {
    return (
      <>
        <div className="payment-root">
          <PaymentHeader
            amount={amount}
          />

          <main className="center-main">
            <section className="payment-card">

              <button
                className="back-button"
                onClick={() =>
                  setConfirm(false)
                }
              >
                ← Terug
              </button>

              <h1>
                Betaling bevestigen
              </h1>

              <p>
                Heb je het bedrag al
                overgemaakt?
              </p>

              <button
                className="primary-button"
                onClick={() => {
                  setSuccess(true);
                }}
              >
                Ik heb betaald
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
        </div>

        <Styles />
      </>
    );
  }

  /* =======================================================
     TRANSFER
======================================================= */

  if (transfer) {
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
        value:
          'NL19 QNTO 6026 6339 88',
        key: 'iban',
      },
      {
        label: 'Omschrijving',
        value: order,
        key: 'reference',
      },
    ];

    return (
      <>
        <div className="payment-root">
          <PaymentHeader
            amount={amount}
          />

          <main className="center-main">
            <section className="payment-card transfer-card">

              <button
                className="back-button"
                onClick={() =>
                  setTransfer(false)
                }
              >
                ← Terug
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
                  ({
                    label,
                    value,
                    key,
                  }) => (
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

                      {(key === 'iban' ||
                        key ===
                          'reference') && (
                        <button
                          onClick={() =>
                            copyValue(
                              value,
                              key
                            )
                          }
                        >
                          {copied === key
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
        </div>

        <Styles />
      </>
    );
  }

  /* =======================================================
     BANK LOADING
======================================================= */

  if (
    selectedBank &&
    bankLoading
  ) {
    return (
      <>
        <div className="payment-root">
          <PaymentHeader
            amount={amount}
          />

          <main className="center-main">
            <section className="payment-card loading-card">

              <div className="spinner" />

              <h1>
                Bankomgeving openen
              </h1>

              <p>
                {selectedBank}
              </p>

            </section>
          </main>
        </div>

        <Styles />
      </>
    );
  }

  /* =======================================================
     SELECTED BANK
======================================================= */

  if (selectedBank) {
    return (
      <>
        <div className="payment-root">
          <PaymentHeader
            amount={amount}
          />

          <main className="center-main">
            <section className="payment-card">

              <button
                className="back-button"
                onClick={() =>
                  setSelectedBank(null)
                }
              >
                ← Terug naar banken
              </button>

              <div className="selected-bank-logo">
                <BankLogo
                  name={selectedBank}
                />
              </div>

              <h1>
                {selectedBank}
              </h1>

              <p>
                Ga verder om je betaling
                af te ronden.
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
        </div>

        <Styles />
      </>
    );
  }

  /* =======================================================
     BANK SELECT
======================================================= */

  if (!startScreen) {
    return (
      <>
        <div className="payment-root">
          <PaymentHeader
            amount={amount}
          />

          <main className="banks-main">
            <section className="banks-section">

              <button
                className="back-button"
                onClick={() =>
                  setStartScreen(true)
                }
              >
                ← Terug
              </button>

              <div className="banks-heading">
                <h1>
                  Select your bank
                </h1>

                <p>
                  Selecteer je bank om
                  verder te gaan.
                </p>
              </div>

              <div className="banks-grid">
                {BANKS.map(
                  (bank) => (
                    <button
                      key={bank}
                      className="bank-row"
                      onClick={() => {
                        setSelectedBank(
                          bank
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
                          850
                        );
                      }}
                    >
                      <BankLogo
                        name={bank}
                      />

                      <span>
                        {bank}
                      </span>

                      <b>
                        →
                      </b>
                    </button>
                  )
                )}
              </div>

            </section>
          </main>
        </div>

        <Styles />
      </>
    );
  }

  /* =======================================================
     START PAYMENT SCREEN
======================================================= */

  return (
    <>
      <div className="payment-root">
        <PaymentHeader
          amount={amount}
        />

        <main className="start-main">

          <button
            className="cancel-link"
            onClick={cancel}
          >
            Cancel
          </button>

          <div className="payment-options">

            {/* QR LEFT */}
            <section className="qr-section">

              <div className="qr-frame">
                <img
                  src={QR_IMAGE}
                  alt=""
                  className="qr-image"
                />
              </div>

              <h1>
                Scan with your
                <br />
                banking app to pay
              </h1>

            </section>

            {/* DIVIDER */}
            <div className="vertical-divider" />

            {/* INTERNET BANKING RIGHT */}
            <section className="internet-section">

              <div className="internet-content">

                <h1>
                  Or use internet
                  <br />
                  banking
                </h1>

                <button
                  className="select-bank-button"
                  onClick={() => {
                    setStartScreen(false);
                  }}
                >
                  Select your bank
                </button>

              </div>

            </section>

          </div>

        </main>
      </div>

      <Styles />
    </>
  );
}

/* =========================================================
   STYLES
========================================================= */

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
        width: 100%;
      }

      body {
        background: ${BLACK};
      }

      button {
        font-family: ${BODY_FONT};
      }

      .payment-root {
        position: fixed;
        inset: 0;

        z-index: 999999;

        overflow-y: auto;

        background: ${BLACK};
        color: ${TEXT};

        font-family: ${BODY_FONT};

        -webkit-font-smoothing: antialiased;
      }

      .payment-root * {
        box-sizing: border-box;
      }

      /* ==========================================
         HEADER
      ========================================== */

      .payment-header {
        height: 103px;

        width: 100%;

        display: grid;

        grid-template-columns:
          1fr
          auto
          1fr;

        align-items: center;

        padding: 0 28px;

        background: ${PINK};

        color: white;
      }

      .payment-header > img {
        width: 143px;
        height: 53px;

        object-fit: contain;

        display: block;
      }

      .merchant {
        text-align: center;

        line-height: 1;
      }

      .merchant-name {
        font-size: 27px;

        font-weight: 400;
      }

      .merchant-amount {
        margin-top: 8px;

        font-size: 31px;

        font-weight: 700;
      }

      /* ==========================================
         START
      ========================================== */

      .start-main {
        min-height:
          calc(100dvh - 103px);

        position: relative;

        padding:
          45px
          55px
          70px;

        background: ${BLACK};
      }

      .cancel-link {
        position: relative;

        display: block;

        margin-left: auto;
        margin-right: auto;

        width: min(1260px, 100%);

        border: 0;

        background: transparent;

        color: ${PINK};

        font-size: 18px;

        font-weight: 600;

        text-align: left;

        cursor: pointer;

        padding: 0;

        margin-bottom: 25px;
      }

      .payment-options {
        width: min(
          1120px,
          100%
        );

        min-height: 540px;

        margin: 0 auto;

        display: grid;

        grid-template-columns:
          minmax(0, 1fr)
          1px
          minmax(0, 1fr);

        column-gap: 78px;

        align-items: center;
      }

      .qr-section {
        display: flex;

        flex-direction: column;

        align-items: center;

        justify-content: center;

        text-align: center;
      }

      .qr-frame {
        width: 326px;
        height: 326px;

        border-radius: 22px;

        overflow: hidden;

        background: white;

        display: flex;

        align-items: center;
        justify-content: center;

        flex-shrink: 0;

        position: relative;
      }

      .qr-image {
        width: 100%;
        height: 100%;

        display: block;

        object-fit: contain;
        object-position: 50% 50%;

        transform: none !important;
        rotate: 0deg !important;

        flex: 0 0 auto;
      }

      /* Desktop: move the QR block slightly to the right.
         Mobile/tablet positioning remains unchanged. */
      @media (min-width: 951px) {
        .qr-section {
          transform: translateX(24px);
        }
      }

      .qr-section h1,
      .internet-section h1 {
        margin: 0;

        color: white;

        font-family: ${HEAD_FONT};

        font-size:
          clamp(
            35px,
            3vw,
            47px
          );

        line-height: 1.35;

        font-weight: 600;

        letter-spacing: -.02em;
      }

      .qr-section h1 {
        margin-top: 40px;
      }

      .internet-section {
        height: 100%;

        display: flex;

        align-items: center;

        justify-content: center;

        text-align: center;
      }

      .internet-content {
        width: 100%;

        max-width: 540px;

        display: flex;

        flex-direction: column;

        align-items: center;

        justify-content: center;

        text-align: center;
      }

      .internet-section h1 {
        margin-bottom: 42px;
      }

      .vertical-divider {
        width: 1px;

        height: 410px;

        background: #707070;

        opacity: .75;
      }

      .select-bank-button {
        width: min(
          480px,
          100%
        );

        height: 64px;

        border: 1px solid #f1f1f1;

        border-radius: 34px;

        background: transparent;

        color: white;

        font-size: 21px;

        font-weight: 600;

        text-align: center;

        cursor: pointer;

        transition:
          background .15s ease,
          color .15s ease;
      }

      .select-bank-button:hover {
        background: white;

        color: ${BLACK};
      }

      /* ==========================================
         BANKS
      ========================================== */

      .banks-main {
        min-height:
          calc(100dvh - 103px);

        background: ${BLACK};

        padding:
          48px
          20px
          70px;
      }

      .banks-section {
        width:
          min(820px, 100%);

        margin: 0 auto;
      }

      .banks-heading {
        text-align: center;

        margin-bottom: 30px;
      }

      .banks-heading h1 {
        margin: 0 0 10px;

        color: white;

        font-family: ${HEAD_FONT};

        font-size: 42px;

        line-height: 1.15;

        font-weight: 600;
      }

      .banks-heading p {
        margin: 0;

        color: ${MUTED};

        font-size: 15px;
      }

      .back-button {
        border: 0;

        background: transparent;

        color: ${PINK};

        padding: 0;

        margin: 0 0 28px;

        font-size: 15px;

        font-weight: 500;

        cursor: pointer;
      }

      .banks-grid {
        display: grid;

        grid-template-columns:
          1fr
          1fr;

        gap: 12px;
      }

      .bank-row {
        width: 100%;

        min-height: 76px;

        display: grid;

        grid-template-columns:
          58px
          minmax(0, 1fr)
          25px;

        align-items: center;

        gap: 14px;

        padding: 9px 15px;

        border: 1px solid #444;

        border-radius: 12px;

        background: #222;

        color: white;

        text-align: left;

        cursor: pointer;

        transition:
          background .15s ease,
          border-color .15s ease,
          transform .15s ease;
      }

      .bank-row:hover {
        background: #292929;

        border-color: #707070;

        transform:
          translateY(-1px);
      }

      .bank-row span {
        color: white;

        font-size: 15px;

        font-weight: 400;
      }

      .bank-row b {
        color: #9a9a9a;

        font-size: 20px;

        font-weight: 400;

        text-align: right;
      }

      /* ==========================================
         BANK LOGOS
      ========================================== */

      .bank-logo {
        width: 54px;
        height: 54px;

        display: flex;

        align-items: center;
        justify-content: center;

        background: transparent;

        border-radius: 8px;

        overflow: hidden;
      }

      .bank-logo img {
        display: block;

        width: 100%;
        height: 100%;

        object-fit: contain;
      }

      .bank-logo-fallback {
        width: 54px;
        height: 54px;

        display: flex;

        align-items: center;
        justify-content: center;

        border-radius: 8px;

        background: #333;

        color: white;

        font-size: 13px;

        font-weight: 600;
      }

      /* ==========================================
         CENTER
      ========================================== */

      .center-main {
        min-height:
          calc(100dvh - 103px);

        display: grid;

        place-items: center;

        padding:
          35px
          20px
          70px;
      }

      .payment-card {
        width:
          min(570px, 100%);

        padding:
          38px
          42px
          42px;

        border:
          1px solid #3d3d3d;

        border-radius: 18px;

        background: ${CARD};

        color: white;

        text-align: center;

        display: flex;

        flex-direction: column;

        align-items: center;
      }

      .payment-card h1 {
        margin:
          0 0 13px;

        color: white;

        font-family: ${HEAD_FONT};

        font-size: 37px;

        line-height: 1.2;

        font-weight: 600;
      }

      .payment-card > p {
        margin: 0;

        color: ${MUTED};

        font-size: 15px;

        line-height: 1.65;
      }

      .payment-card > .back-button {
        align-self: flex-start;
      }

      /* ==========================================
         SELECTED BANK
      ========================================== */

      .selected-bank-logo {
        width: 82px;
        height: 82px;

        margin-bottom: 20px;

        display: flex;

        align-items: center;
        justify-content: center;
      }

      .selected-bank-logo .bank-logo {
        width: 82px;
        height: 82px;
      }

      .selected-bank-logo .bank-logo-fallback {
        width: 82px;
        height: 82px;
      }

      /* ==========================================
         BUTTONS
      ========================================== */

      .primary-button,
      .secondary-button {
        width: 100%;

        min-height: 58px;

        margin-top: 16px;

        border-radius: 10px;

        font-size: 16px;

        font-weight: 600;

        cursor: pointer;
      }

      .primary-button {
        border: 0;

        background: ${PINK};

        color: white;
      }

      .primary-button:hover {
        background: #e00076;
      }

      .secondary-button {
        border:
          1px solid #555;

        background: #2b2b2b;

        color: white;
      }

      .secondary-button:hover {
        background: #333;
      }

      /* ==========================================
         TRANSFER
      ========================================== */

      .transfer-card {
        width:
          min(700px, 100%);
      }

      .transfer-list {
        width: 100%;

        margin-top: 28px;

        border:
          1px solid #404040;

        border-radius: 12px;

        overflow: hidden;
      }

      .transfer-row {
        min-height: 64px;

        display: grid;

        grid-template-columns:
          120px
          minmax(0, 1fr)
          auto;

        align-items: center;

        gap: 12px;

        padding:
          10px 15px;

        border-bottom:
          1px solid #353535;

        text-align: left;
      }

      .transfer-row:last-child {
        border-bottom: 0;
      }

      .transfer-row > span {
        color: #999;

        font-size: 12px;
      }

      .transfer-row strong {
        color: white;

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

        white-space: nowrap;
      }

      /* ==========================================
         LOADING
      ========================================== */

      .loading-card {
        min-height: 300px;

        justify-content: center;
      }

      .spinner {
        width: 50px;
        height: 50px;

        margin-bottom: 25px;

        border:
          3px solid #444;

        border-top-color:
          ${PINK};

        border-radius: 50%;

        animation:
          spin .75s linear infinite;
      }

      /* ==========================================
         INTRO
      ========================================== */

      .loading-screen {
        position: fixed;

        inset: 0;

        z-index: 1000000;

        display: grid;

        place-items: center;

        background: white;
      }

      .loading-content {
        display: flex;

        flex-direction: column;

        align-items: center;

        gap: 22px;
      }

      .loading-content img {
        width: 125px;

        height: auto;

        display: block;
      }

      .loading-dots {
        display: flex;

        gap: 5px;
      }

      .loading-dots span {
        width: 5px;
        height: 5px;

        border-radius: 50%;

        background: #68727a;

        animation:
          dots 1s ease-in-out infinite;
      }

      .loading-dots span:nth-child(2) {
        animation-delay: .15s;
      }

      .loading-dots span:nth-child(3) {
        animation-delay: .3s;
      }

      /* ==========================================
         SUCCESS
      ========================================== */

      .success-screen {
        position: fixed;

        inset: 0;

        z-index: 1000000;

        display: grid;

        place-items: center;

        overflow: hidden;

        background: ${BLACK};

        color: white;

        font-family: ${BODY_FONT};
      }

      .success-content {
        position: relative;

        z-index: 2;

        width:
          min(560px, calc(100% - 40px));

        display: flex;

        flex-direction: column;

        align-items: center;

        text-align: center;
      }

      .success-image {
        width:
          min(290px, 55vw);

        height:
          min(290px, 55vw);

        object-fit: contain;

        display: block;

        margin-bottom: 10px;
      }

      .success-content h1 {
        margin:
          0 0 12px;

        font-family: ${HEAD_FONT};

        font-size:
          clamp(32px, 5vw, 44px);

        line-height: 1.15;

        font-weight: 600;
      }

      .success-content p {
        margin:
          0 0 25px;

        color: ${MUTED};

        font-size: 15px;
      }

      .success-content .primary-button {
        width:
          min(480px, 100%);

        margin-top: 0;
      }

      .confetti {
        position: absolute;

        inset: 0;

        width: 100%;
        height: 100%;

        pointer-events: none;
      }

      /* ==========================================
         ANIMATIONS
      ========================================== */

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes dots {
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

      /* ==========================================
         TABLET
      ========================================== */

      @media (max-width: 950px) {

        .start-main {
          padding-left: 30px;
          padding-right: 30px;
        }

        .payment-options {
          column-gap: 45px;
        }

        .qr-frame {
          width: 280px;
          height: 292px;
        }

        .qr-section h1,
        .internet-section h1 {
          font-size: 34px;
        }

      }

      /* ==========================================
         MOBILE
      ========================================== */

      @media (max-width: 700px) {

        .payment-header {
          height: 82px;

          grid-template-columns:
            1fr
            auto;

          padding:
            0 16px;
        }

        .payment-header > img {
          width: 95px;
          height: 39px;
        }

        .merchant {
          text-align: right;
        }

        .merchant-name {
          font-size: 14px;
        }

        .merchant-amount {
          margin-top: 5px;

          font-size: 20px;
        }

        .start-main {
          min-height:
            calc(100dvh - 82px);

          padding:
            20px
            20px
            35px;
        }

        .cancel-link {
          width: 100%;

          margin-bottom: 10px;

          font-size: 16px;
        }

        .payment-options {
          min-height:
            calc(100dvh - 135px);

          width: 100%;

          display: flex;

          flex-direction: column;
        }

        .qr-section {
          display: none;
        }

        .vertical-divider {
          display: none;
        }

        .internet-section {
          width: 100%;

          min-height:
            calc(100dvh - 145px);

          display: flex;

          align-items: center;

          justify-content: center;
        }

        .internet-content {
          width: 100%;

          max-width: 500px;
        }

        .internet-section h1 {
          margin-bottom: 34px;

          font-size: 31px;
        }

        .select-bank-button {
          width: 100%;

          height: 60px;

          font-size: 18px;
        }

        .banks-main {
          min-height:
            calc(100dvh - 82px);

          padding:
            30px
            14px
            45px;
        }

        .banks-heading h1 {
          font-size: 32px;
        }

        .banks-grid {
          grid-template-columns: 1fr;
        }

        .center-main {
          min-height:
            calc(100dvh - 82px);

          padding:
            25px
            14px
            45px;
        }

        .payment-card {
          padding:
            30px
            18px
            25px;
        }

        .payment-card h1 {
          font-size: 30px;
        }

        .transfer-row {
          grid-template-columns:
            76px
            minmax(0, 1fr);
        }

        .transfer-row button {
          grid-column: 2;

          justify-self: start;
        }

      }

      @media (max-width: 420px) {

        .payment-header > img {
          width: 86px;
        }

        .merchant-name {
          font-size: 12px;
        }

        .merchant-amount {
          font-size: 18px;
        }

        .bank-row {
          grid-template-columns:
            48px
            minmax(0, 1fr)
            20px;
        }

        .bank-logo,
        .bank-logo-fallback {
          width: 48px;
          height: 48px;
        }

      }

    `}</style>
  );
}