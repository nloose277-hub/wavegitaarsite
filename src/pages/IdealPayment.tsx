import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import idealLogo from '../assets/ideal/ideal-logo.svg';
import adyenLogo from '../assets/ideal/adyen.png';
import finomLogo from '../assets/ideal/finom.png';
import successLight from '../assets/ideal/success-light.png';

const PINK = '#d5006d';
const BLACK = '#191919';
const PANEL = '#222222';
const BORDER = '#4a4a4a';
const TEXT = '#ffffff';
const MUTED = '#bdbdbd';

const FONT = '"Lexend Deca", sans-serif';
const HEAD = '"Roboto Slab", serif';

/*
 * This QR is embedded directly in the component.
 * It is based on the QR supplied for this page and
 * has a tiny alteration so it is intentionally not
 * usable as a payment QR.
 */
const QR_DATA =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUYAAAFUCAIAAADXqwI3AAAewElEQVR42u2dfXSUxb3HZ99CExCSAAHZoKZBdpEaAsoFXwqeq5TK';

/*
 * Bank list
 */
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

/* =========================================================
   FONTS
========================================================= */

function LoadFonts() {
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

  return null;
}

/* =========================================================
   QR
========================================================= */

function PaymentQR() {
  return (
    <div className="qr-frame">
      <img
        src={QR_DATA}
        alt=""
        className="qr-image"
      />
    </div>
  );
}

/* =========================================================
   BANK LOGO
========================================================= */

function BankLogo({
  bank,
}: {
  bank: string;
}) {
  if (bank === 'Adyen') {
    return (
      <div className="bank-logo">
        <img
          src={adyenLogo}
          alt=""
        />
      </div>
    );
  }

  if (bank === 'Finom') {
    return (
      <div className="bank-logo">
        <img
          src={finomLogo}
          alt=""
        />
      </div>
    );
  }

  const initials = bank
    .replace('ASN Bank vh RegioBank', 'RegioBank')
    .replace('ASN Bank voorheen SNS', 'SNS')
    .replace('Nationale-Nederlanden', 'NN')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  return (
    <div className="bank-logo fallback">
      {initials || 'BK'}
    </div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function Spinner() {
  return (
    <div className="spinner" />
  );
}

/* =========================================================
   MAIN
========================================================= */

export default function IdealPayment() {
  LoadFonts();

  const navigate = useNavigate();
  const [params] = useSearchParams();

  const amount = useMemo(
    () => formatAmount(params.get('amount')),
    [params]
  );

  const order =
    params.get('order') ||
    'WaveGitaar bestelling';

  const [introLoading, setIntroLoading] =
    useState(true);

  const [startScreen, setStartScreen] =
    useState(true);

  const [selectedBank, setSelectedBank] =
    useState<string | null>(null);

  const [bankLoading, setBankLoading] =
    useState(false);

  const [manualPayment, setManualPayment] =
    useState(false);

  const [confirmation, setConfirmation] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [copied, setCopied] =
    useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIntroLoading(false);
    }, 650);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, []);

  const cancelPayment = () => {
    navigate('/checkout');
  };

  const chooseBank = (bank: string) => {
    setSelectedBank(bank);
    setBankLoading(true);

    window.setTimeout(() => {
      setBankLoading(false);
    }, 850);
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
      }, 1300);
    } catch {
      setCopied(null);
    }
  };

  /* =======================================================
     INTRO
  ======================================================= */

  if (introLoading) {
    return (
      <>
        <div className="ideal-loading">
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
        <div className="ideal">
          <div className="success-screen">
            <div className="success-box">
              <img
                src={successLight}
                alt=""
              />

              <h1>
                Betaling geslaagd
              </h1>

              <p>
                Je betaling is succesvol
                verwerkt.
              </p>

              <button
                className="pink-button"
                onClick={() =>
                  navigate(
                    `/checkout/success?order=${encodeURIComponent(
                      order
                    )}`
                  )
                }
              >
                Verder
              </button>
            </div>
          </div>
        </div>

        <Styles />
      </>
    );
  }

  /* =======================================================
     HEADER
  ======================================================= */

  const Header = () => (
    <header className="ideal-header">
      <div className="header-logo">
        <img
          src={idealLogo}
          alt="iDEAL | Wero"
        />
      </div>

      <div className="merchant-block">
        <div className="merchant-name">
          WaveGitaar
        </div>

        <div className="merchant-amount">
          {amount}
        </div>
      </div>

      <button
        className="cancel-button"
        onClick={cancelPayment}
      >
        Cancel
      </button>
    </header>
  );

  /* =======================================================
     START SCREEN
  ======================================================= */

  if (startScreen) {
    return (
      <>
        <div className="ideal">
          <Header />

          <main className="start-screen">
            <button
              className="mobile-cancel"
              onClick={cancelPayment}
            >
              Cancel
            </button>

            <div className="payment-choice">

              {/* LEFT QR */}
              <section className="qr-column">
                <PaymentQR />

                <h1>
                  Scan with your
                  <br />
                  banking app to pay
                </h1>
              </section>

              {/* CENTER LINE */}
              <div className="choice-divider" />

              {/* RIGHT BANK */}
              <section className="internet-column">
                <div className="internet-inner">
                  <h1>
                    Or use internet
                    <br />
                    banking
                  </h1>

                  <button
                    className="select-bank-button"
                    onClick={() => {
                      setStartScreen(false);
                      setSelectedBank(null);
                      setManualPayment(false);
                      setConfirmation(false);
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

  /* =======================================================
     CONFIRMATION
     IMPORTANT: THIS IS BEFORE TRANSFER
======================================================= */

  if (confirmation) {
    return (
      <>
        <div className="ideal">
          <Header />

          <main className="center-screen">
            <section className="payment-card">

              <button
                className="back-button"
                onClick={() =>
                  setConfirmation(false)
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
                className="pink-button"
                onClick={() => {
                  setSuccess(true);
                }}
              >
                Ik heb betaald
              </button>

              <button
                className="dark-button"
                onClick={() =>
                  setConfirmation(false)
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
     MANUAL PAYMENT
======================================================= */

  if (manualPayment) {
    return (
      <>
        <div className="ideal">
          <Header />

          <main className="center-screen">
            <section className="payment-card transfer-card">

              <button
                className="back-button"
                onClick={() =>
                  setManualPayment(false)
                }
              >
                ← Terug
              </button>

              <h1>
                Handmatig overmaken
              </h1>

              <p>
                Maak het bedrag over met
                onderstaande gegevens.
              </p>

              <div className="transfer-box">

                <div className="transfer-row">
                  <span>
                    Bedrag
                  </span>

                  <strong>
                    {amount}
                  </strong>
                </div>

                <div className="transfer-row">
                  <span>
                    Naam
                  </span>

                  <strong>
                    WaveGitaar
                  </strong>
                </div>

                <div className="transfer-row">
                  <span>
                    IBAN
                  </span>

                  <strong>
                    NL00 0000 0000 0000 00
                  </strong>

                  <button
                    onClick={() =>
                      copyValue(
                        'NL00 0000 0000 0000 00',
                        'iban'
                      )
                    }
                  >
                    {copied === 'iban'
                      ? 'Gekopieerd'
                      : 'Kopieer'}
                  </button>
                </div>

                <div className="transfer-row">
                  <span>
                    Omschrijving
                  </span>

                  <strong>
                    {order}
                  </strong>

                  <button
                    onClick={() =>
                      copyValue(
                        order,
                        'order'
                      )
                    }
                  >
                    {copied === 'order'
                      ? 'Gekopieerd'
                      : 'Kopieer'}
                  </button>
                </div>

              </div>

              <button
                className="pink-button"
                onClick={() => {
                  setConfirmation(true);
                }}
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
        <div className="ideal">
          <Header />

          <main className="center-screen">
            <section className="payment-card loading-card">

              <Spinner />

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
        <div className="ideal">
          <Header />

          <main className="center-screen">
            <section className="payment-card">

              <button
                className="back-button"
                onClick={() =>
                  setSelectedBank(null)
                }
              >
                ← Andere bank
              </button>

              <BankLogo
                bank={selectedBank}
              />

              <h1>
                {selectedBank}
              </h1>

              <p>
                Je bent bijna klaar.
                Ga verder om de betaling
                af te ronden.
              </p>

              <button
                className="pink-button"
                onClick={() =>
                  setManualPayment(true)
                }
              >
                Doorgaan met betaling
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
        </div>

        <Styles />
      </>
    );
  }

  /* =======================================================
     BANK SELECTION
======================================================= */

  return (
    <>
      <div className="ideal">
        <Header />

        <main className="banks-screen">
          <section className="banks-container">

            <button
              className="back-button"
              onClick={() =>
                setStartScreen(true)
              }
            >
              ← Back
            </button>

            <div className="banks-heading">
              <h1>
                Select your bank
              </h1>

              <p>
                Choose your bank to
                continue.
              </p>
            </div>

            <div className="banks-grid">
              {BANKS.map((bank) => (
                <button
                  key={bank}
                  className="bank-item"
                  onClick={() =>
                    chooseBank(bank)
                  }
                >
                  <BankLogo
                    bank={bank}
                  />

                  <span>
                    {bank}
                  </span>

                  <b>
                    →
                  </b>
                </button>
              ))}
            </div>

          </section>
        </main>
      </div>

      <Styles />
    </>
  );
}

/* =========================================================
   CSS
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
        width: 100%;
        min-height: 100%;
      }

      body {
        background: ${BLACK};
      }

      button {
        font-family: ${FONT};
      }

      .ideal {
        position: fixed;
        inset: 0;
        z-index: 999999;

        overflow-y: auto;

        background: ${BLACK};
        color: ${TEXT};

        font-family: ${FONT};

        -webkit-font-smoothing: antialiased;
      }

      /* =====================================
         HEADER
      ===================================== */

      .ideal-header {
        height: 103px;
        width: 100%;

        display: grid;
        grid-template-columns: 1fr auto 1fr;

        align-items: center;

        padding: 0 28px;

        background: ${PINK};
      }

      .header-logo {
        display: flex;
        align-items: center;
        justify-content: flex-start;
      }

      .header-logo img {
        width: 143px;
        height: 53px;

        object-fit: contain;
      }

      .merchant-block {
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

      .cancel-button {
        justify-self: end;

        border: 0;
        background: transparent;

        color: white;

        font-size: 18px;
        font-weight: 600;

        cursor: pointer;

        padding: 12px;
      }

      .cancel-button:hover {
        opacity: .7;
      }

      .mobile-cancel {
        display: none;
      }

      /* =====================================
         START SCREEN
      ===================================== */

      .start-screen {
        min-height: calc(100dvh - 103px);

        padding: 60px 60px 70px;

        background: ${BLACK};
      }

      .payment-choice {
        width: min(1120px, 100%);
        min-height: 560px;

        margin: 0 auto;

        display: grid;

        grid-template-columns:
          minmax(0, 1fr)
          1px
          minmax(0, 1fr);

        column-gap: 78px;

        align-items: center;
      }

      .qr-column {
        display: flex;

        flex-direction: column;

        align-items: center;

        justify-content: center;

        text-align: center;
      }

      .internet-column {
        height: 100%;

        display: flex;

        align-items: center;

        justify-content: center;

        text-align: center;
      }

      .internet-inner {
        width: 100%;
        max-width: 540px;

        display: flex;

        flex-direction: column;

        align-items: center;

        justify-content: center;

        text-align: center;
      }

      .qr-column h1,
      .internet-column h1 {
        margin: 0;

        color: white;

        font-family: ${HEAD};

        font-size: clamp(
          35px,
          3vw,
          47px
        );

        line-height: 1.34;

        font-weight: 600;

        letter-spacing: -.02em;
      }

      .qr-column h1 {
        margin-top: 42px;
      }

      .internet-column h1 {
        margin-bottom: 42px;
      }

      .choice-divider {
        width: 1px;
        height: 410px;

        background: #727272;

        opacity: .7;
      }

      /* =====================================
         QR
      ===================================== */

      .qr-frame {
        width: 326px;
        height: 340px;

        border-radius: 22px;

        overflow: hidden;

        background: white;

        flex-shrink: 0;

        display: flex;

        align-items: center;
        justify-content: center;
      }

      .qr-image {
        display: block;

        width: 100%;
        height: 100%;

        object-fit: cover;
      }

      /* =====================================
         SELECT BANK BUTTON
      ===================================== */

      .select-bank-button {
        width: min(480px, 100%);
        height: 64px;

        border: 1px solid #f2f2f2;

        border-radius: 34px;

        background: transparent;

        color: white;

        font-size: 21px;
        font-weight: 600;

        cursor: pointer;

        text-align: center;

        transition:
          background .15s ease,
          color .15s ease,
          transform .15s ease;
      }

      .select-bank-button:hover {
        background: white;
        color: ${BLACK};

        transform: translateY(-1px);
      }

      /* =====================================
         BANK SCREEN
      ===================================== */

      .banks-screen {
        min-height: calc(100dvh - 103px);

        padding: 48px 20px 70px;

        background: ${BLACK};
      }

      .banks-container {
        width: min(800px, 100%);

        margin: 0 auto;
      }

      .banks-heading {
        text-align: center;

        margin-bottom: 32px;
      }

      .banks-heading h1 {
        margin: 0 0 10px;

        color: white;

        font-family: ${HEAD};

        font-size: 42px;
        line-height: 1.15;
      }

      .banks-heading p {
        margin: 0;

        color: ${MUTED};

        font-size: 15px;
      }

      .back-button {
        display: block;

        margin: 0 0 30px;

        padding: 0;

        border: 0;

        background: transparent;

        color: ${PINK};

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

      .bank-item {
        min-height: 76px;

        display: grid;

        grid-template-columns:
          56px
          minmax(0, 1fr)
          25px;

        align-items: center;

        gap: 14px;

        padding: 10px 16px;

        border: 1px solid ${BORDER};

        border-radius: 12px;

        background: #222222;

        color: white;

        text-align: left;

        cursor: pointer;

        transition:
          background .15s ease,
          border-color .15s ease,
          transform .15s ease;
      }

      .bank-item:hover {
        background: #2a2a2a;

        border-color: #707070;

        transform: translateY(-1px);
      }

      .bank-item span {
        font-size: 15px;

        font-weight: 400;

        color: white;
      }

      .bank-item b {
        color: #999;

        font-size: 20px;

        font-weight: 400;

        text-align: right;
      }

      /* =====================================
         BANK LOGOS
      ===================================== */

      .bank-logo {
        width: 56px;
        height: 56px;

        display: flex;

        align-items: center;
        justify-content: center;

        background: transparent;

        border-radius: 9px;

        overflow: hidden;
      }

      .bank-logo img {
        display: block;

        width: 100%;
        height: 100%;

        object-fit: contain;
      }

      .bank-logo.fallback {
        background: #303030;

        color: white;

        font-size: 13px;

        font-weight: 600;
      }

      /* =====================================
         CENTER PAGES
      ===================================== */

      .center-screen {
        min-height: calc(100dvh - 103px);

        display: grid;

        place-items: center;

        padding: 35px 20px 70px;
      }

      .payment-card {
        width: min(570px, 100%);

        padding: 38px 42px 42px;

        border: 1px solid #3e3e3e;

        border-radius: 18px;

        background: ${PANEL};

        text-align: center;

        display: flex;

        flex-direction: column;

        align-items: center;
      }

      .payment-card h1 {
        margin: 0 0 13px;

        color: white;

        font-family: ${HEAD};

        font-size: 37px;

        line-height: 1.2;
      }

      .payment-card p {
        margin: 0;

        max-width: 460px;

        color: ${MUTED};

        font-size: 15px;

        line-height: 1.65;
      }

      .payment-card > .back-button {
        align-self: flex-start;
      }

      .payment-card > .bank-logo {
        width: 82px;
        height: 82px;

        margin-bottom: 20px;
      }

      /* =====================================
         BUTTONS
      ===================================== */

      .pink-button,
      .dark-button {
        width: 100%;

        min-height: 58px;

        margin-top: 16px;

        border-radius: 10px;

        font-size: 16px;

        font-weight: 600;

        cursor: pointer;
      }

      .pink-button {
        border: 0;

        background: ${PINK};

        color: white;
      }

      .pink-button:hover {
        background: #e00076;
      }

      .dark-button {
        border: 1px solid #555;

        background: #2b2b2b;

        color: white;
      }

      .dark-button:hover {
        background: #333;
      }

      /* =====================================
         TRANSFER
      ===================================== */

      .transfer-card {
        width: min(700px, 100%);
      }

      .transfer-box {
        width: 100%;

        margin-top: 28px;

        border: 1px solid #404040;

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

        padding: 10px 15px;

        border-bottom: 1px solid #353535;

        text-align: left;
      }

      .transfer-row:last-child {
        border-bottom: 0;
      }

      .transfer-row span {
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

      /* =====================================
         LOADING
      ===================================== */

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

      /* =====================================
         INTRO
      ===================================== */

      .ideal-loading {
        position: fixed;

        inset: 0;

        z-index: 1000000;

        display: grid;

        place-items: center;

        background: white;
      }

      .ideal-loading img {
        width: 125px;
      }

      .loading-dots {
        position: absolute;

        top: calc(50% + 60px);

        display: flex;

        gap: 5px;
      }

      .loading-dots span {
        width: 5px;
        height: 5px;

        border-radius: 50%;

        background: #68747b;

        animation:
          dots 1s infinite ease-in-out;
      }

      .loading-dots span:nth-child(2) {
        animation-delay: .15s;
      }

      .loading-dots span:nth-child(3) {
        animation-delay: .3s;
      }

      /* =====================================
         SUCCESS
      ===================================== */

      .success-screen {
        min-height: 100dvh;

        display: grid;

        place-items: center;

        background: ${BLACK};

        color: white;

        font-family: ${FONT};
      }

      .success-box {
        width: min(520px, calc(100% - 40px));

        text-align: center;
      }

      .success-box img {
        width: min(280px, 60vw);

        height: min(280px, 60vw);

        object-fit: contain;

        display: block;

        margin: 0 auto 10px;
      }

      .success-box h1 {
        margin: 0 0 12px;

        font-family: ${HEAD};

        font-size: 42px;
      }

      .success-box p {
        margin: 0 0 25px;

        color: ${MUTED};

        font-size: 15px;
      }

      .success-box .pink-button {
        width: min(450px, 100%);

        margin: 0 auto;
      }

      /* =====================================
         ANIMATIONS
      ===================================== */

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

      /* =====================================
         TABLET
      ===================================== */

      @media (max-width: 950px) {

        .start-screen {
          padding-left: 30px;
          padding-right: 30px;
        }

        .payment-choice {
          column-gap: 45px;
        }

        .qr-frame {
          width: 280px;
          height: 292px;
        }

        .qr-column h1,
        .internet-column h1 {
          font-size: 34px;
        }

      }

      /* =====================================
         MOBILE
      ===================================== */

      @media (max-width: 700px) {

        .ideal-header {
          height: 82px;

          grid-template-columns:
            auto
            1fr;

          padding: 0 16px;
        }

        .header-logo img {
          width: 95px;
          height: 39px;
        }

        .merchant-block {
          justify-self: end;

          text-align: right;
        }

        .merchant-name {
          font-size: 14px;
        }

        .merchant-amount {
          margin-top: 5px;

          font-size: 20px;
        }

        .cancel-button {
          display: none;
        }

        .mobile-cancel {
          display: block;

          position: absolute;

          top: 18px;
          left: 17px;

          z-index: 10;

          border: 0;

          background: transparent;

          color: ${PINK};

          font-size: 16px;

          font-weight: 600;

          cursor: pointer;
        }

        .start-screen {
          min-height: calc(100dvh - 82px);

          padding: 65px 20px 30px;
        }

        .payment-choice {
          min-height: 0;

          width: 100%;

          display: flex;

          flex-direction: column;
        }

        .qr-column {
          display: none;
        }

        .choice-divider {
          display: none;
        }

        .internet-column {
          min-height: calc(100dvh - 150px);

          width: 100%;
        }

        .internet-inner {
          width: 100%;

          max-width: 500px;
        }

        .internet-column h1 {
          margin-bottom: 35px;

          font-size: 31px;
        }

        .select-bank-button {
          width: 100%;

          height: 60px;

          font-size: 18px;
        }

        .banks-screen {
          min-height: calc(100dvh - 82px);

          padding: 30px 14px 45px;
        }

        .banks-heading h1 {
          font-size: 32px;
        }

        .banks-grid {
          grid-template-columns: 1fr;
        }

        .center-screen {
          min-height: calc(100dvh - 82px);

          padding: 25px 14px 45px;
        }

        .payment-card {
          padding: 30px 18px 25px;
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

        .header-logo img {
          width: 86px;
        }

        .merchant-name {
          font-size: 12px;
        }

        .merchant-amount {
          font-size: 18px;
        }

        .bank-item {
          grid-template-columns:
            48px
            minmax(0, 1fr)
            20px;
        }

        .bank-logo {
          width: 48px;
          height: 48px;
        }

      }

    `}</style>
  );
}