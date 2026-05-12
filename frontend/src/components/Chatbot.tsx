import { useState } from 'react'
import { Link } from 'react-router-dom'
import { fallbackChatReply, postChatMessage, type ChatLink, type Suggestion } from '../lib/chatClient'

export function Chatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<{ from: 'user' | 'bot'; text: string }[]>([
    {
      from: 'bot',
      text:
        'Bonjour. Assistant branché sur l’API STB. Essayez :\n« crédit de 20000 sur 5 ans revenus 3200 charges 900 »\npour enchaîner simulation et grille d’analyse (connectez-vous pour réutiliser votre profil).',
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
      const data = await postChatMessage(userLine)
      let botText = data.reply
      if (data.meta?.scoring?.decision) {
        botText += `\n\n───\nOrientation indicative : ${data.meta.scoring.decision} · indicateur ${data.meta.scoring.score ?? '—'}/100`
      }
      setMessages((m) => [...m, { from: 'bot', text: botText }])
      setLastSuggestions(data.suggestions)
      setLastLinks(data.links)
    } catch {
      const fb = fallbackChatReply(userLine)
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
        className="fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#1D4ED8] text-xs font-bold tracking-tight text-white shadow-md ring-1 ring-[#1D4ED8]/20 transition hover:bg-[#1E40AF]"
        aria-label="Ouvrir l’assistant STB"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-xs font-bold tracking-tight">STB</span>
      </button>
      {open && (
        <div
          className="fixed bottom-20 right-6 z-50 flex w-[min(100vw-1.5rem,24rem)] flex-col overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-lg shadow-slate-900/10"
          role="dialog"
          aria-modal="true"
        >
          <div className="border-b border-slate-200 bg-gradient-to-r from-blue-50 to-cyan-50 px-4 py-3">
            <div className="font-semibold text-slate-900">Assistant STB</div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Simulation · analyse · FAQ
            </div>
          </div>
          <div className="max-h-80 space-y-2.5 overflow-y-auto px-3 py-3 text-sm">
            {messages.map((msg, i) => (
              <div
                key={`${i}-${msg.text.slice(0, 12)}`}
                className={`max-w-[95%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                  msg.from === 'bot'
                    ? 'bg-slate-100 text-slate-800 shadow-sm'
                    : 'ml-auto bg-blue-600/15 text-blue-900 ring-1 ring-blue-200'
                } ${msg.from === 'bot' ? 'whitespace-pre-wrap' : ''}`}
              >
                {msg.text}
              </div>
            ))}
            {pending && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                Réponse en cours…
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 border-t border-slate-200 px-3 py-2.5">
            <button
              type="button"
              className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-200"
              onClick={() => void reply('simulation')}
              disabled={pending}
            >
              Simulation
            </button>
            <button
              type="button"
              className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-200"
              onClick={() => void reply('suivi dossier')}
              disabled={pending}
            >
              Dossiers
            </button>
            <button
              type="button"
              className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-200"
              onClick={() => void reply('crédit de 20000 sur 5 ans revenus 3200 charges 900')}
              disabled={pending}
            >
              Exemple analyse
            </button>
            <Link
              to="/simulation"
              className="rounded-lg bg-blue-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-600"
            >
              Simulateur
            </Link>
          </div>
          {(lastSuggestions && lastSuggestions.length > 0) || (lastLinks && lastLinks.length > 0) ? (
            <div className="flex flex-wrap gap-2 border-t border-slate-200 px-3 py-2">
              {lastSuggestions?.map((s) => (
                <button
                  key={s.query}
                  type="button"
                  className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:border-slate-400"
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
                  className="rounded-lg border border-blue-300 px-2 py-1 text-xs font-medium text-blue-700 hover:border-blue-400"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          ) : null}
          <div className="flex gap-2 border-t border-slate-200 p-3">
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
