import { Link } from 'react-router-dom';
import { Shield, Headphones, ArrowRight, Check, Truck, Lock, RotateCcw, Music } from 'lucide-react';
import { Seo } from '../components/Seo';
import { Reveal } from '../components/Reveal';

export default function About() {
  return (
    <>
      <Seo title="Over ons" description="WaveGitaar is de Nederlandse specialist in elektrische gitaren. Ontdek ons verhaal en waarom we dé gitaarspecialist van Nederland zijn." url="/over-ons" />

      {/* Breadcrumb */}
      <div className="border-b border-stone-200 bg-white">
        <div className="container-content py-3">
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <Link to="/" className="hover:text-stone-900">Home</Link>
            <span>/</span>
            <span className="text-stone-900 font-medium">Over ons</span>
          </div>
        </div>
      </div>

      {/* Header — white */}
      <section className="border-b border-stone-200 bg-white">
        <div className="container-content py-10 md:py-14">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent-600">Ons verhaal</p>
          <h1 className="mt-2 text-2xl font-bold text-stone-900 md:text-3xl">De gitaarzaak van Nederland.</h1>
          <p className="mt-3 max-w-lg text-sm text-stone-500 md:text-base">
            WaveGitaar is ontstaan uit liefde voor het instrument. We verkopen uitsluitend kwalitatieve gitaren — geen verrassingen, alleen de echte deal.
          </p>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-stone-200 bg-stone-50">
        <div className="container-content grid grid-cols-2 gap-6 py-6 md:grid-cols-4">
          {[
            { icon: Shield, title: '3 jaar garantie', desc: 'Op alle gitaren en versterkers' },
            { icon: Truck, title: 'Morgen in huis', desc: 'Vóór 21:59 besteld op werkdagen' },
            { icon: Lock, title: 'Veilig betalen', desc: 'iDEAL, Bancontact en meer' },
            { icon: Headphones, title: 'Persoonlijk advies', desc: 'Via WhatsApp, e-mail of telefoon' },
          ].map((f, i) => (
            <div key={i} className="flex flex-col items-start gap-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white border border-stone-200 shadow-sm">
                <f.icon className="h-5 w-5 text-accent-600" />
              </div>
              <h3 className="text-sm font-bold text-stone-900">{f.title}</h3>
              <p className="text-xs text-stone-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Content */}
      <section className="py-10 md:py-14">
        <div className="container-content">
          <div className="grid gap-10 md:grid-cols-2 md:items-start">
            <Reveal>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent-600">Wie we zijn</p>
                <h2 className="mt-2 text-xl font-bold text-stone-900 md:text-2xl">Passie voor het vak</h2>
                <p className="mt-4 text-sm leading-relaxed text-stone-600">
                  Al jaren zijn we de aangewezen plek voor gitaarliefhebbers in Nederland. Liefde voor het instrument en passie voor het merk staan centraal.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-stone-600">
                  We verkopen uitsluitend kwalitatieve gitaren en versterkers — Stratocaster, Telecaster, Jazzmaster, basgitaren en versterkers. Geen onduidelijke merken, alleen de echte deal.
                </p>
              </div>
            </Reveal>
            <Reveal delay={150}>
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-6">
                <h3 className="text-base font-bold text-stone-900">Waarom kiezen voor WaveGitaar?</h3>
                <ul className="mt-4 space-y-2.5">
                  {['KvK 32137384', '3 jaar garantie op alle gitaren', 'Persoonlijk contact via WhatsApp', '30 dagen retourrecht', 'Gratis verzending op alle bestellingen'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-stone-700">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-600">
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* CTA — light */}
      <section className="border-t border-stone-200 bg-stone-50 py-12 md:py-16">
        <div className="container-content text-center">
          <Music className="mx-auto h-8 w-8 text-accent-600" />
          <h2 className="mt-3 text-xl font-bold text-stone-900 md:text-2xl">Klaar voor je nieuwe gitaar?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">Bekijk ons assortiment Stratocasters, Telecasters, basgitaren en versterkers.</p>
          <Link to="/products" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-700">
            Bekijk alle gitaren <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
