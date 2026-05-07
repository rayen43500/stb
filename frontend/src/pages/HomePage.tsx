import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { roleLabelFr, roleMission } from '../lib/roleLabels'
import type { SafeUser } from '../types'

function CheckIcon() {
  return (
    <svg className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

/** Visiteurs non connectés — page marketing claire et rassurante. */
function PublicHome() {
  return (
    <>
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-[#1e3a8a] via-[#1d4ed8] to-[#2563eb] px-6 py-12 text-white shadow-[0_28px_80px_-28px_rgba(30,58,138,0.75)] sm:px-10 sm:py-16">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm ring-1 ring-white/40">
              <img src="/image.png" alt="STB" className="h-6 w-auto" />
              STB — crédit en ligne
            </div>
            <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
              Votre projet crédit,{' '}
              <span className="text-cyan-200">simple et transparent</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-blue-100 sm:text-base">
              Simulez en dinars tunisiens (TND), déposez votre dossier, suivez chaque étape du workflow et consultez un
              scoring explicite — sans surprise.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex rounded-2xl bg-white px-6 py-3 text-sm font-bold text-blue-900 shadow-lg transition hover:bg-blue-50"
              >
                Ouvrir un compte client
              </Link>
              <Link
                to="/simulation"
                className="inline-flex rounded-2xl bg-white/10 px-6 py-3 text-sm font-semibold text-white ring-2 ring-white/35 transition hover:bg-white/15"
              >
                Essayer la simulation
              </Link>
            </div>
            <p className="mt-6 text-xs text-blue-200/90">
              Déjà inscrit ?{' '}
              <Link to="/login" className="font-semibold text-white underline-offset-2 hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm ring-1 ring-white/20">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-200">En 3 étapes</p>
            <ol className="mt-4 space-y-4 text-sm">
              <li className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/20 text-sm font-bold">
                  1
                </span>
                <div>
                  <div className="font-semibold">Simulez votre mensualité</div>
                  <div className="text-blue-100/90">Montant, durée, taux — résultats en TND.</div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/20 text-sm font-bold">
                  2
                </span>
                <div>
                  <div className="font-semibold">Créez et soumettez votre dossier</div>
                  <div className="text-blue-100/90">Pièces jointes, commentaires, suivi des statuts.</div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/20 text-sm font-bold">
                  3
                </span>
                <div>
                  <div className="font-semibold">Suivez la décision</div>
                  <div className="text-blue-100/90">Score, motifs et historique par rôle métier.</div>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="stb-card group transition hover:border-blue-300/60 hover:shadow-lg">
          <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">Simulation</div>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">Mensualité & endettement</h2>
          <p className="mt-2 text-sm text-slate-600">
            Calculez la mensualité, le coût des intérêts et votre taux d&apos;endettement après crédit.
          </p>
          <Link
            to="/simulation"
            className="mt-4 inline-flex text-sm font-semibold text-blue-700 group-hover:underline"
          >
            Lancer une simulation →
          </Link>
        </div>
        <div className="stb-card group transition hover:border-emerald-300/50 hover:shadow-lg">
          <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Scoring</div>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">Décision lisible</h2>
          <p className="mt-2 text-sm text-slate-600">
            Score sur 100, facteurs clés et recommandations — idéal pour anticiper une demande.
          </p>
          <Link to="/assistant" className="mt-4 inline-flex text-sm font-semibold text-emerald-700 group-hover:underline">
            Parler à l&apos;assistant →
          </Link>
        </div>
        <div className="stb-card group transition hover:border-amber-300/50 hover:shadow-lg">
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-800">Confiance</div>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">Workflow tracé</h2>
          <p className="mt-2 text-sm text-slate-600">
            Chaque changement de statut est commenté : vous gardez la maîtrise du parcours.
          </p>
          <Link to="/login" className="mt-4 inline-flex text-sm font-semibold text-amber-800 group-hover:underline">
            Accéder à mon espace →
          </Link>
        </div>
      </section>

      <section className="stb-card border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 to-white">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Pourquoi passer par la plateforme ?</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              <li className="flex gap-3">
                <CheckIcon />
                <span>
                  <strong className="text-slate-900">Gain de temps</strong> — moins d&apos;allers-retours grâce au dépôt
                  en ligne.
                </span>
              </li>
              <li className="flex gap-3">
                <CheckIcon />
                <span>
                  <strong className="text-slate-900">Transparence</strong> — scoring et étapes visibles sur votre dossier.
                </span>
              </li>
              <li className="flex gap-3">
                <CheckIcon />
                <span>
                  <strong className="text-slate-900">Devise locale</strong> — montants affichés en TND partout.
                </span>
              </li>
            </ul>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row md:flex-col">
            <Link to="/register" className="stb-btn-primary px-8 py-3 text-center">
              Créer mon compte gratuitement
            </Link>
            <Link to="/assistant" className="stb-btn-secondary px-8 py-3 text-center">
              Poser une question à l&apos;assistant
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

/** Accueil optimisé pour encourager l’usage (simulation → demande → suivi). */
function ClientHome({ user }: { user: SafeUser }) {
  return (
    <>
      <section className="relative overflow-hidden rounded-3xl border border-blue-200/60 bg-gradient-to-br from-white via-blue-50/80 to-cyan-50/50 px-6 py-10 shadow-lg ring-1 ring-blue-100/80 sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-bl-full bg-blue-600/10" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">Votre espace client</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Bonjour{user.firstName ? ` ${user.firstName}` : ''} —{' '}
            <span className="text-blue-700">prêt à avancer sur votre crédit ?</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Commencez par une simulation pour estimer votre mensualité, puis créez un dossier en quelques clics. Vous
            pouvez joindre vos justificatifs et suivre chaque statut jusqu&apos;à la décision.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link to="/simulation" className="stb-btn-primary px-8 py-3.5 text-center text-base shadow-md shadow-blue-200/60">
              1 — Simuler mon crédit
            </Link>
            <Link
              to="/demande"
              className="inline-flex items-center justify-center rounded-2xl border-2 border-blue-600 bg-white px-8 py-3.5 text-center text-base font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              2 — Nouvelle demande
            </Link>
            <Link
              to="/dossiers"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-8 py-3.5 text-center text-base font-semibold text-white transition hover:bg-slate-800"
            >
              3 — Mes dossiers
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-4 text-sm">
            <Link to="/assistant" className="font-semibold text-blue-700 underline-offset-2 hover:underline">
              Assistant & questions fréquentes
            </Link>
            <span className="text-slate-300">|</span>
            <Link to="/compte" className="font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline">
              Compléter mon profil et mon adresse
            </Link>
            <span className="text-slate-300">|</span>
            <Link to="/dashboard" className="font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline">
              Vue d&apos;ensemble
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: 'Simulation',
            desc: 'Testez plusieurs montants et durées en TND.',
            to: '/simulation',
            accent: 'from-blue-600 to-blue-500',
          },
          {
            title: 'Dossier',
            desc: 'Brouillon, pièces, soumission et historique.',
            to: '/demande',
            accent: 'from-emerald-600 to-emerald-500',
          },
          {
            title: 'Suivi',
            desc: 'Filtrez par statut et ouvrez le détail.',
            to: '/dossiers',
            accent: 'from-violet-600 to-violet-500',
          },
          {
            title: 'Profil',
            desc: 'Téléphone, adresse, photo — pour un meilleur scoring.',
            to: '/compte',
            accent: 'from-cyan-600 to-cyan-500',
          },
        ].map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
          >
            <div
              className={`absolute left-0 top-0 h-1 w-full bg-gradient-to-r ${c.accent} opacity-90 transition group-hover:opacity-100`}
            />
            <h3 className="mt-2 font-semibold text-slate-900">{c.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{c.desc}</p>
            <span className="mt-3 inline-flex text-sm font-semibold text-blue-700 group-hover:underline">Ouvrir →</span>
          </Link>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900">Comment votre dossier avance</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Brouillon / soumis', 'Vous préparez et envoyez la demande.'],
            ['Analyse', 'L’agence étudie le dossier et le scoring.'],
            ['Validations', 'Chef d’agence puis comité si nécessaire.'],
            ['Décision', 'Approuvé, refusé ou demande de modification.'],
          ].map(([t, d], i) => (
            <div key={t} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-800">
                {i + 1}
              </div>
              <div className="mt-3 text-sm font-semibold text-slate-900">{t}</div>
              <p className="mt-1 text-xs text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

/** Accueil sobre pour agents, chef, comité, admin. */
function StaffHome({ user }: { user: SafeUser }) {
  return (
    <>
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-10 text-white shadow-xl sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-cyan-300">{roleLabelFr[user.role]}</p>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Espace professionnel STB</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">{roleMission[user.role]}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/dashboard" className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-900 hover:bg-slate-100">
            Mon espace métier
          </Link>
          <Link
            to="/dossiers"
            className="rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold hover:bg-white/15"
          >
            Dossiers
          </Link>
          <Link to="/compte" className="rounded-xl border border-white/30 px-5 py-2.5 text-sm font-semibold hover:bg-white/10">
            Compte & profil
          </Link>
          {user.role === 'ADMIN' && (
            <Link
              to="/admin"
              className="rounded-xl border border-amber-400/50 bg-amber-500/20 px-5 py-2.5 text-sm font-semibold text-amber-100 hover:bg-amber-500/30"
            >
              Administration
            </Link>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Link to="/dossiers" className="stb-card-muted transition hover:border-blue-300 hover:shadow-md">
          <div className="text-xs font-semibold text-blue-700">Traitement</div>
          <h2 className="mt-2 font-semibold text-slate-900">File des dossiers</h2>
          <p className="mt-2 text-sm text-slate-600">Filtres par statut, recherche et actions selon vos transitions.</p>
        </Link>
        <Link to="/simulation" className="stb-card-muted transition hover:border-cyan-300 hover:shadow-md">
          <div className="text-xs font-semibold text-cyan-800">Outils</div>
          <h2 className="mt-2 font-semibold text-slate-900">Simulation</h2>
          <p className="mt-2 text-sm text-slate-600">Réponses chiffrées aux clients en TND.</p>
        </Link>
        <Link to="/assistant" className="stb-card-muted transition hover:border-violet-300 hover:shadow-md">
          <div className="text-xs font-semibold text-violet-800">Aide</div>
          <h2 className="mt-2 font-semibold text-slate-900">Assistant</h2>
          <p className="mt-2 text-sm text-slate-600">FAQ métier et rappels de workflow.</p>
        </Link>
      </section>
    </>
  )
}

export function HomePage() {
  const { user, token } = useAuth()

  if (token && user?.role === 'CLIENT') {
    return (
      <div className="stb-page space-y-12">
        <ClientHome user={user} />
      </div>
    )
  }

  if (token && user) {
    return (
      <div className="stb-page space-y-12">
        <StaffHome user={user} />
      </div>
    )
  }

  return (
    <div className="stb-page space-y-12">
      <PublicHome />
    </div>
  )
}
