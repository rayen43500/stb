import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Building2,
  Car,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Headphones,
  Home,
  Landmark,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  Users,
} from 'lucide-react'

const steps = ['Créer votre compte', 'Simuler votre crédit', 'Déposer votre dossier', 'Étude du dossier', 'Décision']

const products = [
  {
    title: 'Crédit immobilier',
    description: "Une solution adaptée pour financer l'achat, la construction ou l'aménagement de votre logement.",
    Icon: Home,
  },
  {
    title: 'Crédit automobile',
    description: "Financez votre véhicule neuf ou d'occasion avec une mensualité adaptée à votre budget.",
    Icon: Car,
  },
  {
    title: 'Crédit consommation',
    description: 'Donnez vie à vos projets personnels avec un financement clair et maîtrisé.',
    Icon: Banknote,
  },
]

const assurances = [
  { title: 'Données protégées', description: 'Vos informations et documents sont traités dans un espace sécurisé.', Icon: ShieldCheck },
  { title: 'Suivi transparent', description: "Consultez l'avancement de votre demande à chaque étape.", Icon: FileCheck2 },
  { title: 'Accompagnement humain', description: 'Un agent STB étudie votre dossier et reste disponible pour vous orienter.', Icon: Headphones },
]

export function PublicLandingPage() {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
      <section className="relative overflow-hidden bg-[#071D49] px-6 py-12 text-white sm:px-10 lg:px-14 lg:py-16">
        <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-100">
              <BadgeCheck className="h-4 w-4 text-cyan-300" />
              Portail officiel de gestion des crédits STB
            </div>
            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.12] tracking-tight sm:text-5xl">
              Votre projet mérite un financement à sa mesure.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-blue-100/90">
              Simulez votre crédit, déposez votre dossier et suivez son traitement depuis un espace unique, clair et sécurisé.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/simulation"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-[#071D49] transition hover:bg-blue-50"
              >
                Simuler mon crédit <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/register"
                className="inline-flex h-11 items-center rounded-xl border border-white/30 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Ouvrir un espace client
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-blue-100">
              <span className="inline-flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-cyan-300" /> Accès sécurisé</span>
              <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-cyan-300" /> Disponible 24h/24</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-cyan-300" /> Suivi en temps réel</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur">
              <div className="rounded-2xl bg-white p-7">
                <img src="/image.png" alt="STB Bank" className="mx-auto h-auto w-full max-w-[310px]" />
                <div className="mt-7 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-2xl font-semibold text-[#0A4E9B]">130+</p>
                    <p className="mt-1 text-xs text-slate-500">agences en Tunisie</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-2xl font-semibold text-[#0A4E9B]">Depuis 1958</p>
                    <p className="mt-1 text-xs text-slate-500">au service de vos projets</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-5 hidden rounded-2xl border border-white/40 bg-white px-4 py-3 text-slate-900 shadow-xl sm:flex sm:items-center sm:gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold">Démarche sécurisée</p>
                <p className="text-[11px] text-slate-500">Documents confidentiels</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50 px-6 py-6 sm:px-10 lg:px-14">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { value: '+2 400', label: 'dossiers accompagnés', Icon: FileCheck2 },
            { value: '48 h', label: 'délai moyen de première réponse', Icon: Clock3 },
            { value: '78 %', label: "taux d'accord constaté", Icon: CheckCircle2 },
          ].map(({ value, label, Icon }) => (
            <div key={label} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xl font-semibold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-14 sm:px-10 lg:px-14">
        <div className="max-w-2xl">
          <p className="stb-section-title text-blue-700">Une démarche claire</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Votre demande, étape par étape</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Un parcours simple avec un suivi continu depuis la simulation jusqu'à la décision.</p>
        </div>
        <ol className="mt-8 grid gap-3 md:grid-cols-5">
          {steps.map((step, index) => (
            <li key={step} className="relative rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <span className="text-xs font-semibold text-blue-700">0{index + 1}</span>
              <p className="mt-5 text-sm font-semibold text-slate-900">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-slate-50 px-6 py-14 sm:px-10 lg:px-14">
        <div className="text-center">
          <p className="stb-section-title text-blue-700">Nos solutions</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Un crédit adapté à chaque projet</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">Découvrez nos principales solutions et estimez votre mensualité en quelques instants.</p>
        </div>
        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {products.map(({ title, description, Icon }) => (
            <article key={title} className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 min-h-16 text-sm leading-6 text-slate-600">{description}</p>
              <Link to="/simulation" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-600">
                Faire une simulation <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-10 px-6 py-14 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-14">
        <div className="rounded-3xl bg-[#0A4E9B] p-8 text-white">
          <Landmark className="h-9 w-9 text-cyan-200" />
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">La STB à vos côtés</p>
          <h2 className="mt-3 text-2xl font-semibold leading-tight">Une banque tunisienne proche de vos ambitions.</h2>
          <p className="mt-4 text-sm leading-7 text-blue-100">
            Particuliers, professionnels et entreprises bénéficient d'un réseau national et d'un accompagnement adapté à chaque projet.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 p-4"><Building2 className="h-5 w-5 text-cyan-200" /><p className="mt-3 text-lg font-semibold">130+</p><p className="text-xs text-blue-100">agences</p></div>
            <div className="rounded-2xl bg-white/10 p-4"><Users className="h-5 w-5 text-cyan-200" /><p className="mt-3 text-lg font-semibold">1M+</p><p className="text-xs text-blue-100">clients servis</p></div>
          </div>
        </div>
        <div>
          <p className="stb-section-title text-blue-700">Pourquoi choisir ce portail</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Une expérience utile, sans complexité inutile</h2>
          <div className="mt-7 space-y-4">
            {assurances.map(({ title, description, Icon }) => (
              <div key={title} className="flex gap-4 rounded-2xl border border-slate-200 p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Icon className="h-5 w-5" /></span>
                <div><h3 className="text-sm font-semibold text-slate-900">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{description}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-6 mb-14 rounded-3xl bg-slate-900 px-7 py-9 text-white sm:mx-10 sm:px-10 lg:mx-14">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">Commencer maintenant</p>
            <h2 className="mt-2 text-2xl font-semibold">Préparez votre projet en quelques minutes.</h2>
            <p className="mt-2 text-sm text-slate-300">Créez votre espace ou connectez-vous pour suivre une demande existante.</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link to="/register" className="inline-flex h-11 items-center rounded-xl bg-white px-5 text-sm font-semibold text-slate-900 hover:bg-slate-100">Créer un compte</Link>
            <Link to="/login" className="inline-flex h-11 items-center rounded-xl border border-white/20 px-5 text-sm font-semibold text-white hover:bg-white/10">Se connecter</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-50 px-6 py-8 sm:px-10 lg:px-14">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <img src="/image.png" alt="STB Bank" className="h-10 w-auto" />
            <div className="border-l border-slate-300 pl-4 text-xs leading-5 text-slate-500">
              <p className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Rue Hedi Nouira, 1001 Tunis</p>
              <p>Centre de relation client : +216 70 140 000</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">© 2026 STB Bank. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}
