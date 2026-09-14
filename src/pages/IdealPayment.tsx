import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import idealLogo from '../assets/ideal/ideal-logo.svg';
import adyenLogo from '../assets/ideal/adyen.png';
import finomLogo from '../assets/ideal/finom.png';
import qrReference from '../assets/ideal/qr-reference.png';
import successLight from '../assets/ideal/success-light.png';

const PINK = '#D5006D';
const BLACK = '#191919';
const CARD = '#222222';
const BORDER = '#454545';
const GREY = '#B8B8B8';

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
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return '€0,00';
  }

  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

/* -----------------------------------------
   FONT
----------------------------------------- */

function Fonts() {
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

  return null;
}

/* -----------------------------------------
   QR
----------------------------------------- */

function ReferenceQR() {
  return (
    <div className="qr-wrapper">
      <img
        src={qrReference}
        alt=""
        className="reference-qr"
      />

      {/*
        Very small obstruction.
        The original QR remains visually intact,
        but this breaks the code so it cannot be
        used as an actual payment QR.
      */}
      <span className="qr-break" />
    </div>
  );
}

/* -----------------------------------------
   BANK LOGO
----------------------------------------- */

function BankLogo({ bank }: { bank: string }) {
  const [error, setError] = useState(false);

  let source: string | undefined;

  if (bank === 'Adyen') {
    source = adyenLogo;
  } else if (bank === 'Finom') {
    source = finomLogo;
  }

  if (!source) {
    const key = bank
      .replace('ASN Bank vh RegioBank', 'RegioBank')
      .replace('ASN Bank voorheen SNS', 'SNS')
      .replace('bunq', 'Bunq');

    const logos = import.meta.glob(
      '../assets/banks/*',
      {
        eager: true,
        query: '?url',
        import: 'default',
      }
    ) as Record<string, string>;

    const match = Object.entries(logos).find(
      ([path]) =>
        path.toLowerCase().includes(key.toLowerCase())
    );

    if (match) {
      source = match[1];
    }
  }

  if (!source || error) {
    return (
      <div className="fallback-logo">
        {bank.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <div className="bank-logo">
      <img
        src={source}
        alt=""
        onError={() => setError(true)}
      />
    </div>
  );
}

/* -----------------------------------------
   SPINNER
----------------------------------------- */

function Spinner() {
  return <div className="spinner" />;
}

/* -----------------------------------------
   MAIN
----------------------------------------- */

export default function IdealPayment() {
  Fonts();

  const navigate = useNavigate();
  const [params] = useSearchParams();

  const amount = formatAmount(
    params.get('amount')
  );

  const order =
    params.get('order') ||
    'WaveGitaar bestelling';

  const [loading, setLoading] =
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
      setLoading(false);
    }, 700);

    return () =>
      window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const oldOverflow =
      document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow =
        oldOverflow;
    };
  }, []);

  const cancel = () => {
    navigate('/checkout');
  };

  const selectBank = (bank: string) => {
    setSelectedBank(bank);
    setBankLoading(true);

    window.setTimeout(() => {
      setBankLoading(false);
    }, 900);
  };

  const copy = async (
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
      // Nothing needed.
    }
  };

  /* -----------------------------------------
     LOADING INTRO
  ----------------------------------------- */

  if (loading) {
    return (
      <>
        <div className="ideal loading-screen">
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

  /* -----------------------------------------
     SUCCESS
  ----------------------------------------- */

  if (success) {
    return (
      <>
        <div className="ideal success-screen">
          <div className="success-content">
            <img
              src={successLight}
              alt=""
            />

            <h1>Betaling geslaagd</h1>

            <p>
              Je betaling is succesvol verwerkt.
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

        <Styles />
      </>
    );
  }

  /* -----------------------------------------
     HEADER
  ----------------------------------------- */

  const Header = () => (
    <header className="header">
      <div className="header-left">
        <img
          src={idealLogo}
          alt="iDEAL | Wero"
        />
      </div>

      <div className="header-center">
        <div className="merchant">
          WaveGitaar
        </div>

        <div className="amount">
          {amount}
        </div>
      </div>

      <button
        className="cancel"
        onClick={cancel}
      >
        Cancel
      </button>
    </header>
  );

  /* -----------------------------------------
     START PAGE
  ----------------------------------------- */

  if (startScreen) {
    return (
      <>
        <div className="ideal">
          <Header />

          <main className="start-page">
            <button
              className="mobile-cancel"
              onClick={cancel}
            >
              Cancel
            </button>

            <div className="start-layout">

              {/* LEFT */}
              <section className="qr-side">

                <ReferenceQR />

                <h1>
                  Scan with your
                  <br />
                  banking app to pay
                </h1>
              </section>

              {/* LINE */}
              <div className="divider" />

              {/* RIGHT */}
              <section className="bank-side">

                <div className="bank-side-inner">

                  <h1>
                    Or use internet
                    <br />
                    banking
                  </h1>

                  <button
                    className="select-bank"
                    onClick={() =>
                      setStartScreen(false)
                    }
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

  /* -----------------------------------------
     CONFIRMATION
  ----------------------------------------- */

  if (confirmation) {
    return (
      <>
        <div className="ideal">
          <Header />

          <main className="center-page">
            <section className="payment-card">

              <button
                className="back"
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
                onClick={() =>
                  setSuccess(true)
                }
              >
                Ja, ik heb betaald
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

  /* -----------------------------------------
     MANUAL PAYMENT
  ----------------------------------------- */

  if (manualPayment) {
    return (
      <>
        <div className="ideal">
          <Header />

          <main className="center-page">
            <section className="payment-card transfer-card">

              <button
                className="back"
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

              <div className="transfer">

                <div className="transfer-row">
                  <span>Bedrag</span>
                  <strong>{amount}</strong>
                </div>

                <div className="transfer-row">
                  <span>Naam</span>
                  <strong>
                    WaveGitaar
                  </strong>
                </div>

                <div className="transfer-row">
                  <span>IBAN</span>

                  <strong>
                    NL00 0000 0000 0000 00
                  </strong>

                  <button
                    onClick={() =>
                      copy(
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
                  <span>Omschrijving</span>

                  <strong>
                    {order}
                  </strong>

                  <button
                    onClick={() =>
                      copy(
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
                onClick={() =>
                  setConfirmation(true)
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

  /* -----------------------------------------
     BANK LOADING
  ----------------------------------------- */

  if (
    selectedBank &&
    bankLoading
  ) {
    return (
      <>
        <div className="ideal">
          <Header />

          <main className="center-page">

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

  /* -----------------------------------------
     SELECTED BANK
  ----------------------------------------- */

  if (selectedBank) {
    return (
      <>
        <div className="ideal">
          <Header />

          <main className="center-page">

            <section className="payment-card">

              <button
                className="back"
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
                Kies hieronder hoe je
                de betaling wilt afronden.
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

  /* -----------------------------------------
     BANK CHOICE
  ----------------------------------------- */

  return (
    <>
      <div className="ideal">
        <Header />

        <main className="banks-page">

          <section className="banks-container">

            <button
              className="back"
              onClick={() =>
                setStartScreen(true)
              }
            >
              ← Back
            </button>

            <div className="banks-title">
              <h1>
                Select your bank
              </h1>

              <p>
                Choose your bank to continue.
              </p>
            </div>

            <div className="banks-grid">

              {BANKS.map((bank) => (
                <button
                  key={bank}
                  className="bank-item"
                  onClick={() =>
                    selectBank(bank)
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

/* =========================================
   STYLES
========================================= */

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

      button {
        font-family: ${FONT};
      }

      .ideal {
        position: fixed;
        inset: 0;
        z-index: 999999;
        overflow-y: auto;
        background: ${BLACK};
        color: white;
        font-family: ${FONT};
        -webkit-font-smoothing: antialiased;
      }

      /* =========================
         HEADER
      ========================= */

      .header {
        width: 100%;
        height: 103px;
        background: ${PINK};

        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;

        padding: 0 28px;
      }

      .header-left {
        display: flex;
        align-items: center;
        justify-content: flex-start;
      }

      .header-left img {
        width: 143px;
        height: 53px;
        object-fit: contain;
      }

      .header-center {
        text-align: center;
        line-height: 1;
      }

      .merchant {
        font-size: 27px;
        font-weight: 400;
      }

      .amount {
        margin-top: 8px;
        font-size: 31px;
        font-weight: 700;
      }

      .cancel {
        justify-self: end;
        border: 0;
        background: transparent;
        color: white;
        font-size: 18px;
        font-weight: 600;
        cursor: pointer;
        padding: 12px;
      }

      .cancel:hover {
        opacity: .7;
      }

      .mobile-cancel {
        display: none;
      }

      /* =========================
         START
      ========================= */

      .start-page {
        min-height: calc(100dvh - 103px);
        padding: 65px 70px 70px;
      }

      .start-layout {
        width: min(1120px, 100%);
        min-height: 560px;
        margin: 0 auto;

        display: grid;
        grid-template-columns: 1fr 1px 1fr;
        column-gap: 80px;
        align-items: center;
      }

      .qr-side,
      .bank-side {
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
      }

      .qr-side {
        flex-direction: column;
      }

      .bank-side {
        height: 100%;
      }

      /*
       * This is what fixes the previous issue:
       * everything in the RIGHT half is centered.
       */

      .bank-side-inner {
        width: 100%;
        max-width: 540px;

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        text-align: center;
      }

      .qr-side h1,
      .bank-side h1 {
        margin: 0;
        color: #fff;
        font-family: ${HEAD};
        font-weight: 600;
        font-size: clamp(35px, 3vw, 47px);
        line-height: 1.35;
        letter-spacing: -.02em;
      }

      .qr-side h1 {
        margin-top: 42px;
      }

      .bank-side h1 {
        margin-bottom: 42px;
      }

      .divider {
        width: 1px;
        height: 410px;
        background: #737373;
        opacity: .7;
      }

      /* =========================
         QR
      ========================= */

      .qr-wrapper {
        position: relative;

        width: 315px;
        height: 315px;

        border-radius: 22px;
        overflow: hidden;

        background: white;

        flex-shrink: 0;
      }

      .reference-qr {
        width: 100%;
        height: 100%;

        display: block;

        object-fit: cover;
      }

      /*
       * Only a tiny part of the QR is altered.
       * It is deliberately positioned over a module
       * near the upper-right area.
       *
       * The QR therefore looks essentially identical
       * to the supplied reference but is not usable.
       */

      .qr-break {
        position: absolute;

        width: 9px;
        height: 9px;

        left: 73%;
        top: 18%;

        background: white;

        border-radius: 1px;

        pointer-events: none;
      }

      /* =========================
         SELECT BANK
      ========================= */

      .select-bank {
        width: min(480px, 100%);
        height: 64px;

        border: 1px solid #f2f2f2;
        border-radius: 34px;

        background: transparent;
        color: white;

        font-size: 21px;
        font-weight: 600;

        cursor: pointer;

        transition:
          background .15s ease,
          color .15s ease,
          transform .15s ease;
      }

      .select-bank:hover {
        background: white;
        color: ${BLACK};
        transform: translateY(-1px);
      }

      /* =========================
         BANK PAGE
      ========================= */

      .banks-page {
        min-height: calc(100dvh - 103px);
        padding: 50px 25px 70px;
      }

      .banks-container {
        width: min(790px, 100%);
        margin: 0 auto;
      }

      .banks-title {
        text-align: center;
        margin-bottom: 32px;
      }

      .banks-title h1 {
        margin: 0 0 9px;
        color: white;
        font-family: ${HEAD};
        font-size: 42px;
        line-height: 1.15;
      }

      .banks-title p {
        margin: 0;
        color: ${GREY};
        font-size: 15px;
      }

      .back {
        display: block;

        border: 0;
        background: transparent;

        padding: 0;
        margin: 0 0 30px;

        color: ${PINK};

        font-size: 15px;
        font-weight: 500;

        cursor: pointer;
      }

      .banks-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .bank-item {
        min-height: 76px;

        display: grid;
        grid-template-columns: 54px 1fr 25px;
        align-items: center;

        gap: 14px;

        padding: 10px 16px;

        border: 1px solid ${BORDER};
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

      .bank-item:hover {
        background: #292929;
        border-color: #777;
        transform: translateY(-1px);
      }

      .bank-item > span {
        font-size: 15px;
        font-weight: 400;
      }

      .bank-item b {
        color: #999;
        font-size: 19px;
        font-weight: 400;
        text-align: right;
      }

      /* =========================
         LOGOS
      ========================= */

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

      .fallback-logo {
        width: 54px;
        height: 54px;

        display: grid;
        place-items: center;

        border-radius: 9px;

        background: #303030;
        color: white;

        font-size: 14px;
        font-weight: 600;
      }

      /* =========================
         CENTER
      ========================= */

      .center-page {
        min-height: calc(100dvh - 103px);

        display: grid;
        place-items: center;

        padding: 40px 20px 70px;
      }

      .payment-card {
        width: min(570px, 100%);

        padding: 38px 42px 42px;

        border: 1px solid #3e3e3e;
        border-radius: 18px;

        background: ${CARD};

        text-align: center;

        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .payment-card h1 {
        margin: 0 0 13px;

        font-family: ${HEAD};
        font-size: 37px;
        line-height: 1.2;

        color: white;
      }

      .payment-card p {
        margin: 0;

        max-width: 460px;

        color: ${GREY};

        font-size: 15px;
        line-height: 1.65;
      }

      .payment-card > .bank-logo,
      .payment-card > .fallback-logo {
        width: 78px;
        height: 78px;
        margin-bottom: 20px;
      }

      .payment-card > .bank-logo img {
        width: 100%;
        height: 100%;
      }

      /* =========================
         BUTTONS
      ========================= */

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

      /* =========================
         TRANSFER
      ========================= */

      .transfer-card {
        width: min(690px, 100%);
      }

      .transfer {
        width: 100%;

        margin-top: 28px;

        border: 1px solid #404040;
        border-radius: 12px;

        overflow: hidden;
      }

      .transfer-row {
        min-height: 64px;

        display: grid;
        grid-template-columns: 120px 1fr auto;

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

      /* =========================
         LOADING
      ========================= */

      .loading-card {
        min-height: 300px;
        justify-content: center;
      }

      .spinner {
        width: 50px;
        height: 50px;

        margin-bottom: 25px;

        border: 3px solid #444;
        border-top-color: ${PINK};

        border-radius: 50%;

        animation: spin .75s linear infinite;
      }

      /* =========================
         INTRO
      ========================= */

      .loading-screen {
        position: fixed;
        inset: 0;

        display: grid;
        place-items: center;

        background: white;
      }

      .loading-screen img {
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

        animation: dots 1s infinite ease-in-out;
      }

      .loading-dots span:nth-child(2) {
        animation-delay: .15s;
      }

      .loading-dots span:nth-child(3) {
        animation-delay: .3s;
      }

      /* =========================
         SUCCESS
      ========================= */

      .success-screen {
        display: grid;
        place-items: center;
      }

      .success-content {
        width: min(520px, calc(100% - 40px));
        text-align: center;
      }

      .success-content img {
        width: min(280px, 60vw);
        height: min(280px, 60vw);

        object-fit: contain;

        display: block;

        margin: 0 auto 10px;
      }

      .success-content h1 {
        margin: 0 0 12px;

        font-family: ${HEAD};

        font-size: 42px;
      }

      .success-content p {
        margin: 0 0 25px;

        color: ${GREY};
        font-size: 15px;
      }

      .success-content .pink-button {
        width: min(450px, 100%);
        margin: 0 auto;
      }

      /* =========================
         ANIMATIONS
      ========================= */

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

      /* =========================
         TABLET
      ========================= */

      @media (max-width: 900px) {

        .start-page {
          padding-left: 35px;
          padding-right: 35px;
        }

        .start-layout {
          column-gap: 45px;
        }

        .qr-wrapper {
          width: 270px;
          height: 270px;
        }

        .qr-side h1,
        .bank-side h1 {
          font-size: 34px;
        }

      }

      /* =========================
         MOBILE
      ========================= */

      @media (max-width: 700px) {

        .header {
          height: 82px;

          grid-template-columns: auto 1fr;

          padding: 0 16px;
        }

        .header-left img {
          width: 95px;
          height: 39px;
        }

        .header-center {
          justify-self: end;
          text-align: right;
        }

        .merchant {
          font-size: 14px;
        }

        .amount {
          margin-top: 5px;
          font-size: 20px;
        }

        .cancel {
          display: none;
        }

        .mobile-cancel {
          display: block;

          position: absolute;

          top: 17px;
          left: 17px;

          z-index: 5;

          border: 0;
          background: transparent;

          color: ${PINK};

          font-size: 16px;
          font-weight: 600;

          cursor: pointer;
        }

        .start-page {
          min-height: calc(100dvh - 82px);

          padding: 65px 20px 35px;
        }

        .start-layout {
          min-height: 0;

          display: flex;
          flex-direction: column;

          width: 100%;
        }

        .qr-side {
          display: none;
        }

        .divider {
          display: none;
        }

        .bank-side {
          min-height: calc(100dvh - 150px);
          width: 100%;
        }

        .bank-side-inner {
          width: 100%;
          max-width: 500px;
        }

        .bank-side h1 {
          font-size: 31px;
          margin-bottom: 35px;
        }

        .select-bank {
          height: 60px;
          font-size: 18px;
        }

        .banks-page {
          min-height: calc(100dvh - 82px);
          padding: 30px 14px 45px;
        }

        .banks-title h1 {
          font-size: 32px;
        }

        .banks-grid {
          grid-template-columns: 1fr;
        }

        .center-page {
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
          grid-template-columns: 76px 1fr;
        }

        .transfer-row button {
          grid-column: 2;
          justify-self: start;
        }

      }

      @media (max-width: 420px) {

        .header-left img {
          width: 86px;
        }

        .merchant {
          font-size: 12px;
        }

        .amount {
          font-size: 18px;
        }

        .bank-item {
          grid-template-columns: 48px 1fr 20px;
        }

        .bank-logo,
        .fallback-logo {
          width: 48px;
          height: 48px;
        }

      }

    `}</style>
  );
}