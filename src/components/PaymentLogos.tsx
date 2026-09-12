export function PaymentLogos() {
  const logos = [
    { src: '/ideal-wero-logo.svg', alt: 'iDEAL | Wero', className: 'h-7', card: false },
    { src: '/bancontact.svg', alt: 'Bancontact', className: 'h-5', card: true },
    { src: '/visa.svg', alt: 'Visa', className: 'h-5', card: true },
    { src: '/mastercard.svg', alt: 'Mastercard', className: 'h-5', card: true },
    { src: '/maestro.svg', alt: 'Maestro', className: 'h-5', card: true },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {logos.map((logo) => (
        <div
          key={logo.src}
          className={
            logo.card
              ? `flex h-8 items-center rounded-md border border-stone-200 px-2.5 py-1 ${logo.bg ?? 'bg-white'}`
              : 'flex h-8 items-center'
          }
        >
          <img src={logo.src} alt={logo.alt} className={`${logo.className} w-auto`} />
        </div>
      ))}
    </div>
  );
}
