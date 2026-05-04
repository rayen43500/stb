import { Link } from 'react-router-dom'

export function AssistantPage() {
  return (
    <div className="stb-page">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="stb-h1">Assistant & chatbot</h1>
          <p className="stb-lead">
            Le bouton <strong className="text-slate-300">🤖</strong> en bas à droite envoie vos messages à{' '}
            <code className="rounded-lg bg-slate-950 px-2 py-0.5 text-sm text-blue-300">POST /api/chat/message</code>.
            Le backend enchaîne <strong className="text-slate-300">simulation</strong> et{' '}
            <strong className="text-slate-300">scoring</strong> lorsque vous donnez montant, durée et revenus dans une
            phrase.
          </p>
        </div>
        <div className="stb-card space-y-4">
          <h2 className="text-base font-semibold text-white">Exemples de phrase</h2>
          <ul className="space-y-2 text-sm leading-relaxed text-slate-400">
            <li>
              <code className="rounded bg-slate-950 px-2 py-1 text-emerald-300">
                crédit de 20000 sur 5 ans revenus 3200 charges 900
              </code>
            </li>
            <li>
              <code className="rounded bg-slate-950 px-2 py-1 text-emerald-300">
                est-ce que mon crédit de 15000 sur 48 mois est risqué si je gagne 2800
              </code>
            </li>
          </ul>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/simulation" className="stb-btn-primary px-5">
            Simulation complète
          </Link>
          <Link to="/dossiers" className="stb-btn-secondary px-5">
            Mes dossiers
          </Link>
        </div>
        <p className="text-xs leading-relaxed text-slate-600">
          Évolution possible : moteur Rasa ou NLP Python branché sur la même API, sans changer la logique métier du
          scoring.
        </p>
      </div>
    </div>
  )
}
