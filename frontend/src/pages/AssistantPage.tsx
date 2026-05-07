import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fallbackChatReply,
  postChatMessage,
  type ChatLink,
  type ChatResponse,
  type Suggestion,
} from '../lib/chatClient'

const EXAMPLE_QUERIES = [
  {
    label: 'Crédit 20 000 TND / 5 ans',
    text: 'crédit de 20000 sur 5 ans revenus 3200 charges 900',
  },
  {
    label: 'Risque 15 000 TND / 48 mois',
    text: 'est-ce que mon crédit de 15000 sur 48 mois est risqué si je gagne 2800',
  },
  {
    label: 'Cycle dossier',
    text: 'quel est le cycle du dossier',
  },
]

function decisionBadge(decision?: string) {
  if (!decision) return null
  const map: Record<string, string> = {
    ACCEPTE: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
    A_ANALYSER: 'bg-amber-100 text-amber-900 ring-amber-200',
    REFUS: 'bg-red-100 text-red-800 ring-red-200',
  }
  const cls = map[decision] ?? 'bg-slate-100 text-slate-800 ring-slate-200'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${cls}`}>{decision}</span>
  )
}

export function AssistantPage() {
  const [messages, setMessages] = useState<{ from: 'user' | 'bot'; text: string; meta?: ChatResponse['meta'] }[]>([
    {
      from: 'bot',
      text:
        'Bienvenue sur l’assistant STB.\n\nVos messages sont envoyés à POST /api/chat/message. Avec un montant, une durée et vos revenus dans une même phrase, le serveur enchaîne simulation + scoring.\n\nConnectez-vous pour réutiliser automatiquement votre profil client.',
    },
  ])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [chips, setChips] = useState<Suggestion[] | undefined>()
  const [linkRow, setLinkRow] = useState<ChatLink[] | undefined>()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, pending])

  async function send(raw: string) {
    const text = raw.trim()
    if (!text || pending) return
    setMessages((m) => [...m, { from: 'user', text }])
    setPending(true)
    setChips(undefined)
    setLinkRow(undefined)
    try {
      const data = await postChatMessage(text)
      setMessages((m) => [...m, { from: 'bot', text: data.reply, meta: data.meta }])
      setChips(data.suggestions)
      setLinkRow(data.links)
    } catch {
      const fb = fallbackChatReply(text)
      setMessages((m) => [...m, { from: 'bot', text: fb.reply }])
      setChips(fb.suggestions)
      setLinkRow(fb.links)
    } finally {
      setPending(false)
    }
  }

  function clearChat() {
    setMessages([
      {
        from: 'bot',
        text: 'Conversation effacée. Posez une nouvelle question ou utilisez un exemple à gauche.',
      },
    ])
    setChips(undefined)
    setLinkRow(undefined)
    setInput('')
  }

  return (
    <div className="stb-page flex min-h-0 flex-1 flex-col pb-4">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 lg:min-h-[calc(100dvh-10rem)] lg:flex-row lg:gap-6">
        {/* Panneau latéral — style dashboard bancaire */}
        <aside className="flex w-full shrink-0 flex-col rounded-2xl border border-slate-200 bg-[#F3F4F6] p-5 shadow-sm lg:w-[300px]">
          <div className="rounded-xl bg-[#1E3A8A] px-4 py-3 text-white shadow-md">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-200/90">Assistant</p>
            <h1 className="text-lg font-bold leading-tight">Chatbot STB</h1>
            <p className="mt-1 text-xs text-blue-100/90">
              API <span className="font-mono text-[11px]">/api/chat/message</span>
            </p>
          </div>

          <div className="mt-5 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Comment ça marche</p>
            <p className="text-sm leading-relaxed text-slate-700">
              Saisissez une phrase avec <strong className="text-slate-900">montant</strong>,{' '}
              <strong className="text-slate-900">durée</strong> et <strong className="text-slate-900">revenus</strong> pour
              déclencher simulation + scoring côté serveur.
            </p>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Exemples (un clic)</p>
            <div className="mt-2 flex flex-col gap-2">
              {EXAMPLE_QUERIES.map((ex) => (
                <button
                  key={ex.text}
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    setInput(ex.text)
                    void send(ex.text)
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm font-medium text-[#1E3A8A] shadow-sm transition hover:border-[#1D4ED8]/40 hover:bg-blue-50/80 disabled:opacity-50"
                >
                  {ex.label}
                  <span className="mt-1 block text-xs font-normal text-[#6B7280] line-clamp-2">{ex.text}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2 border-t border-slate-200/80 pt-5">
            <Link
              to="/simulation"
              className="stb-btn-primary w-full justify-center py-2.5 text-center text-sm shadow-blue-200/50"
            >
              Simulation complète
            </Link>
            <Link
              to="/dossiers"
              className="stb-btn-secondary w-full justify-center py-2.5 text-center text-sm"
            >
              Mes dossiers
            </Link>
          </div>

          <p className="mt-auto pt-6 text-[11px] leading-relaxed text-[#6B7280]">
            Évolution : moteur <strong className="text-slate-600">Rasa</strong> ou NLP Python sur la même route, sans
            modifier la logique métier du scoring.
          </p>
        </aside>

        {/* Zone de chat */}
        <section className="flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_-24px_rgba(15,23,42,0.18)]">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-3 sm:px-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1E3A8A] to-[#1D4ED8] text-xl text-white shadow-md">
                🤖
              </span>
              <div>
                <h2 className="text-base font-semibold text-[#111827]">Conversation</h2>
                <p className="text-xs text-[#6B7280]">Simulation · scoring · FAQ</p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearChat}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Nouvelle conversation
            </button>
          </header>

          <div className="flex flex-1 flex-col bg-[#F9FAFB]">
            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
              {messages.map((msg, i) => (
                <div
                  key={`${i}-${msg.text.slice(0, 24)}`}
                  className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[min(100%,32rem)] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      msg.from === 'user'
                        ? 'bg-[#1D4ED8] text-white'
                        : 'border border-slate-200 bg-white text-slate-800'
                    }`}
                  >
                    {msg.from === 'bot' && msg.meta?.scoring?.decision && (
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {decisionBadge(msg.meta.scoring.decision)}
                        {msg.meta.scoring.score != null && (
                          <span className="text-xs text-[#6B7280]">Score {msg.meta.scoring.score}/100</span>
                        )}
                      </div>
                    )}
                    <div className={msg.from === 'bot' ? 'whitespace-pre-wrap' : ''}>{msg.text}</div>
                  </div>
                </div>
              ))}
              {pending && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-[#6B7280] shadow-sm">
                    <span className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-[#1D4ED8] [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-[#1D4ED8] [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-[#1D4ED8]" />
                    </span>
                    Analyse en cours…
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {(chips?.length || linkRow?.length) ? (
              <div className="border-t border-slate-200 bg-white px-4 py-2 sm:px-5">
                <div className="flex flex-wrap gap-2">
                  {chips?.map((s) => (
                    <button
                      key={s.query}
                      type="button"
                      disabled={pending}
                      onClick={() => void send(s.query)}
                      className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                    >
                      {s.label}
                    </button>
                  ))}
                  {linkRow?.map((l) => (
                    <Link
                      key={l.path}
                      to={l.path}
                      className="rounded-full border border-[#1D4ED8]/30 bg-blue-50 px-3 py-1 text-xs font-semibold text-[#1D4ED8] hover:bg-blue-100"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="border-t border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <textarea
                  className="stb-input min-h-[52px] flex-1 resize-y font-sans sm:min-h-[44px]"
                  placeholder="Ex. crédit de 20000 sur 5 ans revenus 3200 charges 900…"
                  rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      const t = input.trim()
                      if (t) {
                        setInput('')
                        void send(t)
                      }
                    }
                  }}
                  disabled={pending}
                />
                <button
                  type="button"
                  disabled={pending || !input.trim()}
                  onClick={() => {
                    const t = input.trim()
                    if (t) {
                      setInput('')
                      void send(t)
                    }
                  }}
                  className="stb-btn-primary shrink-0 px-6 py-3 sm:py-2.5"
                >
                  Envoyer
                </button>
              </div>
              <p className="mt-2 text-center text-[11px] text-[#6B7280] sm:text-left">
                <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px]">
                  Entrée
                </kbd>{' '}
                envoie ·{' '}
                <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px]">
                  Maj+Entrée
                </kbd>{' '}
                nouvelle ligne
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
