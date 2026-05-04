import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

type ChatLink = { label: string; path: string }
type Suggestion = { label: string; query: string }

type ChatResponse = {
  reply: string
  suggestions?: Suggestion[]
  links?: ChatLink[]
  meta?: {
    scoring?: { score?: number; decision?: string; category?: string }
    simulation?: { monthlyPayment?: number; debtRatioPercent?: number | null }
  }
}

function fallbackReply(text: string): ChatResponse {
  const t = text.toLowerCase()
  if (t.includes('simul')) {
    return {
      reply: 'Ouvrez la page Simulation : montant, durée, taux, revenus et charges.',
      links: [{ label: 'Simulateur', path: '/simulation' }],
    }
  }
  if (t.includes('dossier') || t.includes('suivi')) {
    return {
      reply: 'Connectez-vous puis ouvrez Mes dossiers pour suivre les statuts.',
      links: [{ label: 'Dossiers', path: '/dossiers' }],
    }
  }
  if (t.includes('score') || t.includes('risque')) {
    return {
      reply: 'Le scoring combine endettement, contrat et historique. Donnez un exemple chiffré dans le chat pour un calcul.',
      links: [{ label: 'Aide', path: '/assistant' }],
    }
  }
  return {
    reply: 'Indiquez un sujet (simulation, dossier) ou une phrase avec montant et revenus.',
    suggestions: [
      { label: 'Test scoring', query: 'crédit de 20000 sur 5 ans revenus 3200 charges 900' },
      { label: 'FAQ cycle', query: 'cycle du dossier' },
    ],
    links: [{ label: 'Simulation', path: '/simulation' }],
  }
}

export function Chatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<{ from: 'user' | 'bot'; text: string }[]>([
    {
      from: 'bot',
      text:
        'Bonjour. Je suis branché sur l’API STB. Essayez :\n« crédit de 20000 sur 5 ans revenus 3200 charges 900 »\npour enchaîner simulation + scoring (connectez-vous pour réutiliser votre profil).',
    },
  ])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [lastSuggestions, setLastSuggestions] = useState<Suggestion[] | undefined>()
  const [lastLinks, setLastLinks] = useState<ChatLink[] | undefined>()

  async function reply(text: string) {
    const userLine = text.trim()
    if (!userLine) return
    setMessages((m) => [...m, { from: 'user', text: userLine }])
    setPending(true)
    setLastSuggestions(undefined)
    setLastLinks(undefined)

    try {
      const { data } = await api.post<ChatResponse>('/chat/message', { text: userLine })
      let botText = data.reply
      if (data.meta?.scoring?.decision) {
        botText += `\n\n───\nDécision indicative : ${data.meta.scoring.decision} · score ${data.meta.scoring.score ?? '—'}`
      }
      setMessages((m) => [...m, { from: 'bot', text: botText }])
      setLastSuggestions(data.suggestions)
      setLastLinks(data.links)
    } catch {
      const fb = fallbackReply(userLine)
      setMessages((m) => [...m, { from: 'bot', text: fb.reply }])
      setLastSuggestions(fb.suggestions)
      setLastLinks(fb.links)
    } finally {
      setPending(false)
    }
  }

  function send() {
    const t = input.trim()
    if (!t) return
    setInput('')
    void reply(t)
  }

  return (
    <>
      <button
        type="button"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl text-white shadow-[0_12px_40px_-8px_rgba(59,130,246,0.7)] ring-2 ring-white/10 transition hover:scale-[1.03] hover:shadow-blue-500/40"
        aria-label="Ouvrir l’assistant"
        onClick={() => setOpen((o) => !o)}
      >
        🤖
      </button>
      {open && (
        <div
          className="fixed bottom-24 right-6 z-40 flex w-[min(100vw-1.5rem,24rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.65)] backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
        >
          <div className="border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-indigo-600/10 px-4 py-3">
            <div className="font-semibold text-white">Assistant STB</div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Simulation · scoring · FAQ
            </div>
          </div>
          <div className="max-h-80 space-y-2.5 overflow-y-auto px-3 py-3 text-sm">
            {messages.map((msg, i) => (
              <div
                key={`${i}-${msg.text.slice(0, 12)}`}
                className={`max-w-[95%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                  msg.from === 'bot'
                    ? 'bg-slate-800/90 text-slate-100 shadow-inner shadow-black/20'
                    : 'ml-auto bg-blue-600/25 text-blue-50 ring-1 ring-blue-500/25'
                } ${msg.from === 'bot' ? 'whitespace-pre-wrap' : ''}`}
              >
                {msg.text}
              </div>
            ))}
            {pending && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-blue-400" />
                Réponse en cours…
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 border-t border-white/5 px-3 py-2.5">
            <button
              type="button"
              className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 ring-1 ring-white/10 hover:bg-white/10"
              onClick={() => void reply('simulation')}
              disabled={pending}
            >
              Simulation
            </button>
            <button
              type="button"
              className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 ring-1 ring-white/10 hover:bg-white/10"
              onClick={() => void reply('suivi dossier')}
              disabled={pending}
            >
              Dossiers
            </button>
            <button
              type="button"
              className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 ring-1 ring-white/10 hover:bg-white/10"
              onClick={() => void reply('crédit de 20000 sur 5 ans revenus 3200 charges 900')}
              disabled={pending}
            >
              Exemple scoring
            </button>
            <Link
              to="/simulation"
              className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
            >
              Simulateur
            </Link>
          </div>
          {(lastSuggestions && lastSuggestions.length > 0) || (lastLinks && lastLinks.length > 0) ? (
            <div className="flex flex-wrap gap-2 border-t border-white/5 px-3 py-2">
              {lastSuggestions?.map((s) => (
                <button
                  key={s.query}
                  type="button"
                  className="rounded-lg border border-slate-600/80 px-2 py-1 text-xs text-slate-300 hover:border-slate-500"
                  onClick={() => void reply(s.query)}
                  disabled={pending}
                >
                  {s.label}
                </button>
              ))}
              {lastLinks?.map((l) => (
                <Link
                  key={l.path}
                  to={l.path}
                  className="rounded-lg border border-blue-500/40 px-2 py-1 text-xs font-medium text-blue-300 hover:border-blue-400"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          ) : null}
          <div className="flex gap-2 border-t border-white/10 p-3">
            <input
              className="stb-input flex-1 py-2 text-sm"
              placeholder="Votre message…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              disabled={pending}
            />
            <button type="button" className="stb-btn-primary shrink-0 px-4 py-2 text-sm" onClick={send} disabled={pending}>
              Envoyer
            </button>
          </div>
        </div>
      )}
    </>
  )
}
