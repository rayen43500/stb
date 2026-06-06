import { useEffect, useState } from 'react'
import { api, downloadBlob } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../types'
import { ManagementCharts } from '../components/dashboard/WorkspaceCharts'

type PendingClient = {
  _id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  nationalId?: string
  dateOfBirth?: string
  createdAt?: string
}

type AgentRow = {
  id: string
  email: string
  firstName?: string
  lastName?: string
  matricule?: string
  dossiersTraitesAujourdhui: number
  dossiersTraitesMois: number
  statut: string
}

type ReportData = {
  totalDossiers: number
  approuves: number
  refuses: number
  montantApprouve: number
  scoreMoyen: number | null
}

export function ChefComptesPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'clients' | 'agents' | 'create' | 'reports'>('clients')
  const [pending, setPending] = useState<PendingClient[]>([])
  const [agents, setAgents] = useState<AgentRow[]>([])
  const [report, setReport] = useState<ReportData | null>(null)
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [staffForm, setStaffForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    matricule: '',
    role: 'AGENT_BANCAIRE' as Role,
    agencyName: '',
  })

  async function loadPending() {
    const { data } = await api.get<PendingClient[]>('/chef/pending-clients')
    setPending(data)
  }

  async function loadAgents() {
    const { data } = await api.get<AgentRow[]>('/chef/agents')
    setAgents(data)
  }

  async function loadReport() {
    const { data } = await api.get<ReportData>('/chef/reports/monthly')
    setReport(data)
  }

  useEffect(() => {
    if (!user || !['CHEF_AGENCE', 'ADMIN'].includes(user.role)) return
    loadPending().catch(() => setErr('Chargement impossible'))
    loadAgents().catch(() => {})
    loadReport().catch(() => {})
  }, [user?.role])

  async function approve(id: string) {
    setLoading(true)
    setErr(null)
    try {
      await api.post(`/chef/clients/${id}/approve`)
      setMsg('Code d\'activation envoyé au client')
      await loadPending()
    } catch (e: unknown) {
      setErr('Validation échouée')
    } finally {
      setLoading(false)
    }
  }

  async function reject(id: string) {
    const reason = rejectReason[id]?.trim()
    if (!reason) {
      setErr('Motif de refus obligatoire')
      return
    }
    setLoading(true)
    try {
      await api.post(`/chef/clients/${id}/reject`, { reason })
      setMsg('Inscription refusée')
      await loadPending()
    } catch {
      setErr('Refus échoué')
    } finally {
      setLoading(false)
    }
  }

  async function createStaff(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErr(null)
    try {
      const { data } = await api.post<{ tempPassword?: string }>('/chef/staff', staffForm)
      setMsg(`Compte créé. Mot de passe temporaire : ${data.tempPassword || '(envoyé par email)'}`)
      setStaffForm({ email: '', firstName: '', lastName: '', matricule: '', role: 'AGENT_BANCAIRE', agencyName: '' })
      await loadAgents()
    } catch (e: unknown) {
      setErr('Création échouée — vérifiez l\'email')
    } finally {
      setLoading(false)
    }
  }

  if (!user || !['CHEF_AGENCE', 'ADMIN'].includes(user.role)) {
    return <p className="text-red-600">Accès réservé au chef agence et à l'administrateur.</p>
  }

  const tabs = [
    { id: 'clients' as const, label: 'Inscriptions clients' },
    { id: 'agents' as const, label: 'Équipe agents' },
    { id: 'create' as const, label: 'Créer un compte' },
    { id: 'reports' as const, label: 'Rapports' },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="stb-h1">Gestion agence</h1>
        <p className="stb-lead">Validation des inscriptions, création de comptes internes et rapports.</p>
      </header>

      {msg && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{msg}</p>}
      {err && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{err}</p>}

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setTab(t.id); setMsg(null); setErr(null) }}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === t.id ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {report && <ManagementCharts agents={agents} report={report} />}

      {tab === 'clients' && (
        <section className="stb-card">
          <h2 className="stb-h2">Inscriptions en attente ({pending.length})</h2>
          {pending.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Aucune inscription en attente.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {pending.map((c) => (
                <li key={c._id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {c.firstName} {c.lastName}
                      </p>
                      <p className="text-sm text-slate-600">{c.email} · CIN {c.nationalId}</p>
                      {c.phone && <p className="text-sm text-slate-500">{c.phone}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => approve(c._id)}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-500"
                      >
                        Valider (envoi code)
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    <input
                      className="stb-input flex-1 text-sm"
                      placeholder="Motif de refus (obligatoire pour refuser)"
                      value={rejectReason[c._id] || ''}
                      onChange={(e) => setRejectReason((r) => ({ ...r, [c._id]: e.target.value }))}
                    />
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => reject(c._id)}
                      className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
                    >
                      Refuser
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === 'agents' && (
        <section className="stb-card overflow-x-auto">
          <h2 className="stb-h2">Agents de l&apos;agence</h2>
          <table className="mt-4 min-w-full text-sm">
            <thead className="border-b text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2 text-left">Agent</th>
                <th className="py-2 text-left">Matricule</th>
                <th className="py-2 text-left">Statut</th>
                <th className="py-2 text-right">Aujourd&apos;hui</th>
                <th className="py-2 text-right">Ce mois</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {agents.map((a) => (
                <tr key={a.id}>
                  <td className="py-3">
                    {a.firstName} {a.lastName}
                    <div className="text-xs text-slate-500">{a.email}</div>
                  </td>
                  <td className="py-3 font-mono text-xs">{a.matricule || '—'}</td>
                  <td className="py-3 capitalize">{a.statut}</td>
                  <td className="py-3 text-right tabular-nums">{a.dossiersTraitesAujourdhui}</td>
                  <td className="py-3 text-right tabular-nums">{a.dossiersTraitesMois}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {tab === 'create' && (
        <section className="stb-card max-w-lg">
          <h2 className="stb-h2">Créer un compte interne</h2>
          <form className="mt-4 space-y-4" onSubmit={createStaff}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="stb-label">Prénom</label>
                <input className="stb-input" required value={staffForm.firstName} onChange={(e) => setStaffForm((f) => ({ ...f, firstName: e.target.value }))} />
              </div>
              <div>
                <label className="stb-label">Nom</label>
                <input className="stb-input" required value={staffForm.lastName} onChange={(e) => setStaffForm((f) => ({ ...f, lastName: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="stb-label">Email professionnel</label>
              <input type="email" className="stb-input" required value={staffForm.email} onChange={(e) => setStaffForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="stb-label">Matricule</label>
              <input className="stb-input" required value={staffForm.matricule} onChange={(e) => setStaffForm((f) => ({ ...f, matricule: e.target.value }))} />
            </div>
            <div>
              <label className="stb-label">Rôle</label>
              <select className="stb-input" value={staffForm.role} onChange={(e) => setStaffForm((f) => ({ ...f, role: e.target.value as Role }))}>
                <option value="AGENT_BANCAIRE">Agent bancaire</option>
                <option value="CHEF_AGENCE">Chef d&apos;agence</option>
                
              </select>
            </div>
            <div>
              <label className="stb-label">Agence</label>
              <input className="stb-input" value={staffForm.agencyName} onChange={(e) => setStaffForm((f) => ({ ...f, agencyName: e.target.value }))} />
            </div>
            <button type="submit" disabled={loading} className="stb-btn-primary w-full py-3">
              Créer et envoyer identifiants
            </button>
          </form>
        </section>
      )}

      {tab === 'reports' && report && (
        <section className="stb-card">
          <h2 className="stb-h2">Rapport mensuel</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
            <div><dt className="text-slate-500">Dossiers du mois</dt><dd className="text-xl font-bold">{report.totalDossiers}</dd></div>
            <div><dt className="text-slate-500">Approuvés / Refusés</dt><dd className="text-xl font-bold">{report.approuves} / {report.refuses}</dd></div>
            <div><dt className="text-slate-500">Montant accordé</dt><dd className="text-xl font-bold">{report.montantApprouve.toLocaleString('fr-TN')} TND</dd></div>
            <div><dt className="text-slate-500">Score IA moyen</dt><dd className="text-xl font-bold">{report.scoreMoyen ?? '—'}</dd></div>
          </dl>
          <button
            type="button"
            className="mt-6 rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
            onClick={() => downloadBlob('/chef/reports/monthly.pdf', `rapport-agence-${new Date().toISOString().slice(0, 7)}.pdf`)}
          >
            Exporter en PDF
          </button>
        </section>
      )}
    </div>
  )
}
