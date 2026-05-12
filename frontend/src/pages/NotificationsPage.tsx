import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Loader2 } from 'lucide-react'
import { api } from '../lib/api'

type Row = {
  _id: string
  title: string
  message: string
  read?: boolean
  link?: string
  createdAt?: string
}

export function NotificationsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const { data } = await api.get<Row[]>('/notifications')
      setRows(data)
      setErr(null)
    } catch {
      setErr('Impossible de charger les notifications.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function markRead(id: string) {
    try {
      await api.patch(`/notifications/${id}/read`)
      setRows((r) => r.map((x) => (x._id === id ? { ...x, read: true } : x)))
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <div className="flex items-center gap-2 text-[#64748B]">
            <Bell className="h-5 w-5" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wide">Messagerie agence</span>
          </div>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-[#0F172A]">Notifications</h1>
          <p className="mt-1 text-sm text-[#64748B]">
            Messages liés au traitement de vos dossiers (changements de statut, demandes de pièces).
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-[10px] border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
        >
          Actualiser
        </button>
      </header>

      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-6 py-12 text-sm text-[#64748B] shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-[#1D4ED8]" aria-hidden />
          Chargement…
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white px-6 py-12 text-center text-sm text-[#64748B] shadow-sm">
          Aucune notification pour le moment. Les alertes apparaissent lors des mises à jour de vos dossiers par
          l&apos;agence.
        </div>
      ) : (
        <ul className="divide-y divide-[#F1F5F9] rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
          {rows.map((n) => (
            <li
              key={n._id}
              className={`flex flex-col gap-2 px-4 py-4 transition hover:bg-[#F8FAFC] sm:flex-row sm:items-start sm:justify-between ${n.read ? 'opacity-80' : 'bg-blue-50/40'}`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[#0F172A]">{n.title}</span>
                  {!n.read && (
                    <span className="rounded-full bg-[#1D4ED8] px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                      Nouveau
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-[#475569]">{n.message}</p>
                {n.createdAt && (
                  <p className="mt-2 text-xs text-[#94A3B8]">
                    {new Date(n.createdAt).toLocaleString('fr-TN', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {n.link && (
                  <Link
                    to={n.link.startsWith('/') ? n.link : `/${n.link}`}
                    className="rounded-[10px] bg-[#1D4ED8] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1E40AF]"
                  >
                    Voir le dossier
                  </Link>
                )}
                {!n.read && (
                  <button
                    type="button"
                    onClick={() => void markRead(n._id)}
                    className="rounded-[10px] border border-[#E2E8F0] px-3 py-1.5 text-xs font-medium text-[#64748B] hover:bg-white"
                  >
                    Marquer lu
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
