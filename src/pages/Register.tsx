import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, ShieldCheck } from 'lucide-react';
import { Seo } from '../components/Seo';
import GoogleButton from '../components/GoogleButton';
import { supabase } from '../lib/supabase';


function DutchFlag() {
  return (
    <span className="flex h-5 w-7 items-center justify-center overflow-hidden rounded-sm border border-stone-200">
      <span className="flex h-full w-full flex-col">
        <span className="h-1/3 w-full bg-[#AE1C28]" />
        <span className="h-1/3 w-full bg-white" />
        <span className="h-1/3 w-full bg-[#21468B]" />
      </span>
    </span>
  );
}

function BelgianFlag() {
  return (
    <span className="flex h-5 w-7 items-center justify-center overflow-hidden rounded-sm border border-stone-200">
      <span className="flex h-full w-full">
        <span className="h-full w-1/3 bg-[#000000]" />
        <span className="h-full w-1/3 bg-[#FDDA24]" />
        <span className="h-full w-1/3 bg-[#EF3340]" />
      </span>
    </span>
  );
}

function RobotCheck({ checked, onCheck }: { checked: boolean; onCheck: () => void }) {
  const [hovering, setHovering] = useState(false);
  return (
    <div
      className="flex items-center justify-between rounded-md border border-stone-300 bg-stone-50 px-4 py-3"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={onCheck}
          className="h-6 w-6 cursor-pointer accent-blue-600"
        />
        <span className="text-sm text-stone-700">Ik ben geen robot</span>
      </label>
      <div className="flex flex-col items-center gap-0.5 text-stone-400">
        <ShieldCheck className={`h-7 w-7 transition-colors ${hovering ? 'text-blue-600' : ''}`} />
        <span className="text-[9px] font-medium text-stone-400">reCAPTCHA</span>
      </div>
    </div>
  );
}

type TitleOption = 'mevrouw' | 'de_heer' | 'geen';
type CountryOption = 'Nederland' | 'België' | 'Anders';

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notRobot, setNotRobot] = useState(false);

  const [title, setTitle] = useState<TitleOption>('geen');
  const [firstName, setFirstName] = useState('');
  const [infix, setInfix] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState<CountryOption>('Nederland');
  const [postalCode, setPostalCode] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const redirectRef = useRef('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!notRobot) {
      setError('Vink aan dat je geen robot bent.');
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setError('Vul je voor- en achternaam in.');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('Vul een geldig e-mailadres in.');
      return;
    }
    if (password.length < 6) {
      setError('Wachtwoord moet minstens 6 tekens zijn.');
      return;
    }
    if (!postalCode.trim() || !houseNumber.trim() || !street.trim() || !city.trim()) {
      setError('Vul je volledige adresgegevens in.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
          },
        },
      });
      if (signUpError) throw signUpError;

      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: data.user.id,
          email,
          title,
          first_name: firstName.trim(),
          infix: infix.trim() || null,
          last_name: lastName.trim(),
          country,
          postal_code: postalCode.trim(),
          house_number: houseNumber.trim(),
          street: street.trim(),
          city: city.trim(),
          phone: phone.trim() || null,
          birth_date: birthDate || null,
        });
        if (profileError) throw profileError;
      }

      navigate(redirectRef.current || '/account');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registreren mislukt.';
      if (msg.toLowerCase().includes('already')) {
        setError('Dit e-mailadres is al geregistreerd. Log in plaats daarvan in.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-colors focus:border-accent-600 focus:ring-2 focus:ring-accent-600/20 focus:outline-none';

  return (
    <>
      <Seo title="Account aanmaken" url="/register" />
      <div className="min-h-screen bg-stone-50">
        <div className="container-content py-10 md:py-16">
          <div className="mx-auto max-w-2xl">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-stone-900 md:text-3xl">Account aanmaken</h1>
              <p className="mt-2 text-sm text-stone-500">
                Al een account?{' '}
                <Link to="/login" className="font-medium text-accent-700 hover:text-accent-800">
                  Log hier in
                </Link>
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm md:p-8">
              <GoogleButton label="Account aanmaken met Google" />
              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-stone-200" />
                <span className="text-xs text-stone-400">of vul je gegevens in</span>
                <div className="h-px flex-1 bg-stone-200" />
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Aanhef */}
                <section>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">Hoe mogen we je noemen?</h2>
                  <div className="flex flex-wrap gap-2">
                    {([
                      { value: 'mevrouw', label: 'Mevrouw' },
                      { value: 'de_heer', label: 'De heer' },
                      { value: 'geen', label: 'Liever geen van beiden' },
                    ] as { value: TitleOption; label: string }[]).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setTitle(opt.value)}
                        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                          title === opt.value
                            ? 'border-accent-600 bg-accent-50 text-accent-800'
                            : 'border-stone-300 bg-white text-stone-600 hover:border-stone-400'
                        }`}
                      >
                        {title === opt.value && <Check className="h-3.5 w-3.5" />}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-stone-600">Voornaam *</label>
                      <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-stone-600">Tussenvoegsel</label>
                      <input type="text" value={infix} onChange={(e) => setInfix(e.target.value)} className={inputClass} placeholder="van der" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-stone-600">Achternaam *</label>
                      <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
                    </div>
                  </div>
                </section>

                {/* Adres */}
                <section>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">Waar woon je?</h2>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {([
                      { value: 'Nederland', label: 'Nederland', flag: <DutchFlag /> },
                      { value: 'België', label: 'België', flag: <BelgianFlag /> },
                      { value: 'Anders', label: 'Anders', flag: <span className="text-base">🌍</span> },
                    ] as { value: CountryOption; label: string; flag: React.ReactNode }[]).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setCountry(opt.value)}
                        className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                          country === opt.value
                            ? 'border-accent-600 bg-accent-50 text-accent-800'
                            : 'border-stone-300 bg-white text-stone-600 hover:border-stone-400'
                        }`}
                      >
                        {opt.flag} {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-stone-600">Postcode *</label>
                      <input type="text" required value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className={inputClass} placeholder="1234 AB" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-stone-600">Huisnummer *</label>
                      <input type="text" required value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} className={inputClass} placeholder="42A" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-stone-600">Straatnaam *</label>
                      <input type="text" required value={street} onChange={(e) => setStreet(e.target.value)} className={inputClass} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-stone-600">Plaats *</label>
                      <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
                    </div>
                  </div>
                </section>

                {/* Extra info */}
                <section>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">Nog wat informatie</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-stone-600">Telefoonnummer</label>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="06 12345678" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-stone-600">Geboortedatum (optioneel)</label>
                      <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={inputClass} />
                    </div>
                  </div>
                </section>

                {/* Account credentials */}
                <section className="border-t border-stone-200 pt-6">
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">Inloggegevens</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-stone-600">E-mailadres *</label>
                      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-stone-600">Wachtwoord *</label>
                      <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="Minstens 6 tekens" />
                    </div>
                  </div>
                </section>

                {/* Robot check */}
                <RobotCheck checked={notRobot} onCheck={() => setNotRobot(!notRobot)} />

                {error && (
                  <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent-600 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-accent-700 disabled:opacity-60"
                >
                  {loading ? 'Bezig...' : <>Account aanmaken <ArrowRight className="h-4 w-4" /></>}
                </button>

                <p className="text-center text-xs text-stone-400">
                  Door een account aan te maken ga je akkoord met onze{' '}
                  <Link to="/legal/algemene-voorwaarden" className="underline hover:text-stone-600">voorwaarden</Link>.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
