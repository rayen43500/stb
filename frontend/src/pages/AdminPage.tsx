import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { Role } from '../types'

type UserRow = {
  _id: string
  email: string
  role: Role
  firstName?: string
  lastName?: string
}

const roles: Role[] = ['CLIENT', 'AGENT_BANCAIRE', 'CHEF_AGENCE', 'COMITE_CREDIT', 'ADMIN']

export function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      const { data } = await api.get<UserRow[]>('/users/')
      setUsers(data)
    } catch {
      setError('Accès admin requis')
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function changeRole(id: string, role: Role) {
    try {
      await api.patch(`/users/${id}`, { role })
      await load()
    } catch {
      setError('Mise à jour impossible')
    }
  }

  return (
    <div className="stb-page space-y-8">
      <div>
        <h1 className="stb-h1">Administration</h1>
        <p className="stb-lead">Gestion des rôles et lien vers les journaux d&apos;audit (API).</p>
      </div>
      {error && <p className="text-red-600">{error}</p>}

      <section className="stb-card">
        <h2 className="text-lg font-medium text-slate-900">Utilisateurs</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Nom</th>
                <th className="px-3 py-2">Rôle</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t border-slate-200">
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-slate-700"
                      value={u.role}
                      onChange={(e) => changeRole(u._id, e.target.value as Role)}
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        <h2 className="text-lg font-medium">Audit</h2>
        <p className="mt-2 text-amber-700">
          Les entrées d&apos;audit sont exposées via <code className="rounded bg-amber-100 px-1">GET /api/audit</code>{' '}
          (GET avec jeton admin). Utilisez Postman ou un client HTTP pour consulter les journaux détaillés.
        </p>
        <Link to="/dossiers" className="mt-4 inline-block text-blue-700 hover:underline">
          Retour dossiers
        </Link>
      </section>
    </div>
  )
}
