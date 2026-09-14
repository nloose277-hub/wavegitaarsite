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
const QR_IMAGE =
  'data:image/png;base64,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';

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
          'NL00 0000 0000 0000 00',
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
        width: 340px;
        height: 340px;

        border-radius: 22px;

        overflow: hidden;

        background: white;

        display: flex;

        align-items: center;
        justify-content: center;

        flex-shrink: 0;

        aspect-ratio: 1 / 1;
      }

      .qr-image {
        width: 100%;
        height: 100%;

        display: block;

        object-fit: contain;
        object-position: center center;

        aspect-ratio: 1 / 1;

        transform: none !important;
        rotate: 0deg !important;
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
          width: 292px;
          height: 292px;
          aspect-ratio: 1 / 1;
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