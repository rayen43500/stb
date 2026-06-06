import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { History, Loader2 } from 'lucide-react'
import { api } from '../lib/api'
import { roleLabelFr } from '../lib/roleLabels'
import type { Role } from '../types'

type CommentRow = {
  _id?: string
  role: string
  text: string
  action: string
  createdAt?: string
}

type CreditRow = {
  _id: string
  comments?: CommentRow[]
}

type NotifRow = {
  _id: string
  title: string
  message: string
  createdAt?: string
  link?: string
}

type TimelineEntry =
  | {
      kind: 'comment'
      id: string
      t: number
      dossierId: string
      dossierRef: string
      role: string
      action: string
      text: string
    }
  | {
      kind: 'notif'
      id: string
      t: number
      title: string
      message: string
      link?: string
    }

function roleDisplay(role: string): string {
  const map: Record<string, string> = {
    CLIENT: 'Client',
    AGENT_BANCAIRE: 'Agent',
    CHEF_AGENCE: 'Chef d’agence',
    
  }
  return map[role] || roleLabelFr[role as Role] || role
}

export function HistoriquePage() {
  const [credits, setCredits] = useState<CreditRow[]>([])
  const [notifs, setNotifs] = useState<NotifRow[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([api.get<CreditRow[]>('/credits/'), api.get<NotifRow[]>('/notifications')])
      .then(([cr, nt]) => {
        setCredits(cr.data)
        setNotifs(nt.data)
        setErr(null)
      })
      .catch(() => setErr('Impossible de charger l’historique.'))
      .finally(() => setLoading(false))
  }, [])

  const entries = useMemo(() => {
    const list: TimelineEntry[] = []
    for (const c of credits) {
      const ref = c._id.slice(-8)
      for (const cm of c.comments || []) {
        const t = cm.createdAt ? new Date(cm.createdAt).getTime() : 0
        list.push({
          kind: 'comment',
          id: `${c._id}-${cm._id || cm.action}-${t}`,
          t,
          dossierId: c._id,
          dossierRef: ref,
          role: cm.role,
          action: cm.action,
          text: cm.text,
        })
      }
    }
    for (const n of notifs) {
      list.push({
        kind: 'notif',
        id: `n-${n._id}`,
        t: n.createdAt ? new Date(n.createdAt).getTime() : 0,
        title: n.title,
        message: n.message,
        link: n.link,
      })
    }
    list.sort((a, b) => b.t - a.t)
    return list.slice(0, 200)
  }, [credits, notifs])

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <header className="border-b border-[#E2E8F0] pb-4">
        <div className="flex items-center gap-2 text-[#64748B]">
          <History className="h-5 w-5" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wide">Traçabilité</span>
        </div>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-[#0F172A]">Historique des événements</h1>
        <p className="mt-1 text-sm text-[#64748B]">
          Commentaires de workflow et notifications liés à vos dossiers (ordre antichronologique).
        </p>
      </header>

      {err && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>}

      {loading ? (
        <div className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-6 py-12 text-sm text-[#64748B] shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-[#1D4ED8]" aria-hidden />
          Chargement de l’historique…
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white px-6 py-12 text-center text-sm text-[#64748B] shadow-sm">
          Aucun événement enregistré pour le moment.
        </div>
      ) : (
        <ol className="relative border-l border-[#E2E8F0] pl-6">
          {entries.map((e) => (
            <li key={e.id} className="mb-8 ml-1">
              <span className="absolute -left-[9px] mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-[#1D4ED8] shadow" />
              <time className="text-xs font-medium text-[#94A3B8]">
                {e.t
                  ? new Date(e.t).toLocaleString('fr-TN', { dateStyle: 'short', timeStyle: 'short' })
                  : '—'}
              </time>
              {e.kind === 'comment' ? (
                <div className="mt-2 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
                    <span className="font-semibold text-[#0F172A]">{roleDisplay(e.role)}</span>
                    <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 font-mono text-[10px] text-[#475569]">
                      {e.action}
                    </span>
                    <Link className="font-mono text-[#1D4ED8] hover:underline" to={`/dossiers/${e.dossierId}`}>
                      Dossier …{e.dossierRef}
                    </Link>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-[#334155]">{e.text}</p>
                </div>
              ) : (
                <div className="mt-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 shadow-sm">
                  <p className="font-semibold text-[#0F172A]">{e.title}</p>
                  <p className="mt-1 text-sm text-[#475569]">{e.message}</p>
                  {e.link && (
                    <Link
                      to={e.link.startsWith('/') ? e.link : `/${e.link}`}
                      className="mt-2 inline-block text-xs font-semibold text-[#1D4ED8] hover:underline"
                    >
                      Ouvrir le dossier →
                    </Link>
                  )}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
