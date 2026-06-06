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
    CHEF_AGENCE: "Chef d'agence",
  }
  return map[role] || roleLabelFr[role as Role] || role
}

function eventLink(entry: TimelineEntry): string | null {
  if (entry.kind === 'comment') return `/dossiers/${entry.dossierId}`
  if (!entry.link) return null
  return entry.link.startsWith('/') ? entry.link : `/${entry.link}`
}

export function HistoriquePage() {
  const [credits, setCredits] = useState<CreditRow[]>([])
  const [notifs, setNotifs] = useState<NotifRow[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api.get<CreditRow[]>('/credits/'), api.get<NotifRow[]>('/notifications')])
      .then(([cr, nt]) => {
        setCredits(cr.data)
        setNotifs(nt.data)
        setErr(null)
      })
      .catch(() => setErr("Impossible de charger l'historique."))
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
    <div className="mx-auto w-full max-w-7xl space-y-6">
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
          Chargement de l'historique...
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white px-6 py-12 text-center text-sm text-[#64748B] shadow-sm">
          Aucun événement enregistré pour le moment.
        </div>
      ) : (
        <div className="stb-table-shell">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="stb-table-head">
                <tr>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Auteur / événement</th>
                  <th className="px-4 py-3.5">Dossier</th>
                  <th className="px-4 py-3.5">Détail</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((entry) => {
                  const link = eventLink(entry)
                  return (
                    <tr key={entry.id} className="align-top transition hover:bg-blue-50/40">
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-500">
                        {entry.t
                          ? new Date(entry.t).toLocaleString('fr-TN', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                            entry.kind === 'comment'
                              ? 'bg-blue-50 text-blue-700 ring-blue-200'
                              : 'bg-slate-100 text-slate-700 ring-slate-200'
                          }`}
                        >
                          {entry.kind === 'comment' ? 'Workflow' : 'Notification'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {entry.kind === 'comment' ? (
                          <>
                            <span className="block font-semibold text-slate-900">{roleDisplay(entry.role)}</span>
                            <span className="mt-1 inline-flex rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-600">
                              {entry.action}
                            </span>
                          </>
                        ) : (
                          <span className="font-semibold text-slate-900">{entry.title}</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {entry.kind === 'comment' ? (
                          <Link
                            className="font-mono text-xs font-semibold text-blue-700 hover:underline"
                            to={`/dossiers/${entry.dossierId}`}
                          >
                            {entry.dossierRef}
                          </Link>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="max-w-xl whitespace-pre-wrap px-4 py-3.5 text-slate-700">
                        {entry.kind === 'comment' ? entry.text : entry.message}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {link ? (
                          <Link
                            to={link}
                            className="inline-flex rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600"
                          >
                            Ouvrir
                          </Link>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
