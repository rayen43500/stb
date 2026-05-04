import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth()
  const loc = useLocation()
  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-400">Chargement…</div>
    )
  }
  if (!token) return <Navigate to="/login" state={{ from: loc }} replace />
  return children
}
