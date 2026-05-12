import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useProfileAvatarSrc } from '../hooks/useProfileAvatarSrc'
import { roleLabelFr } from '../lib/roleLabels'

function flashMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const m = (err as { response?: { data?: { message?: string } } }).response?.data?.message
    if (m) return String(m)
  }
  return 'Une erreur est survenue'
}

export function AccountPage() {
  const { user, refreshMe, token } = useAuth()
  const avatarSrc = useProfileAvatarSrc(user?.hasAvatar, token, user?.updatedAt ?? null)

  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState('Tunisie')
  const [nationalId, setNationalId] = useState('')
  const [agencyName, setAgencyName] = useState('')

  const [monthlyIncome, setMonthlyIncome] = useState<number | ''>('')
  const [monthlyCharges, setMonthlyCharges] = useState<number | ''>('')
  const [contractType, setContractType] = useState('CDI')
  const [seniorityMonths, setSeniorityMonths] = useState<number | ''>('')
  const [priorDefaults, setPriorDefaults] = useState<number | ''>('')
  const [bankingIncidents, setBankingIncidents] = useState<number | ''>('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPassword2, setNewPassword2] = useState('')

  const [photoFile, setPhotoFile] = useState<File | null>(null)

  useEffect(() => {
    if (!user) return
    setFirstName(user.firstName || '')
    setLastName(user.lastName || '')
    setPhone(user.phone || '')
    setAddressLine1(user.addressLine1 || '')
    setAddressLine2(user.addressLine2 || '')
    setCity(user.city || '')
    setPostalCode(user.postalCode || '')
    setCountry(user.country || 'Tunisie')
    setNationalId(user.nationalId || '')
    setAgencyName(user.staffProfile?.agencyName || '')
    const cp = user.clientProfile
    if (cp) {
      setMonthlyIncome(cp.monthlyIncome ?? '')
      setMonthlyCharges(cp.monthlyCharges ?? '')
      setContractType((cp.contractType as string) || 'CDI')
      setSeniorityMonths(cp.seniorityMonths ?? '')
      setPriorDefaults(cp.priorDefaults ?? '')
      setBankingIncidents(cp.bankingIncidents ?? '')
    }
  }, [user])

  if (!user) {
    return (
      <div className="stb-page text-slate-600">
        <Link to="/login" className="stb-link">
          Connectez-vous
        </Link>{' '}
        pour gérer votre compte.
      </div>
    )
  }

  async function saveIdentity(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setMsg(null)
    try {
      const body: Record<string, unknown> = {
        firstName,
        lastName,
        phone,
        addressLine1,
        addressLine2,
        city,
        postalCode,
        country,
        nationalId,
      }
      if (['ADMIN', 'AGENT_BANCAIRE', 'CHEF_AGENCE', 'COMITE_CREDIT'].includes(user.role)) {
        body.staffProfile = { agencyName: agencyName.trim() || undefined }
      }
      await api.patch('/profile', body)
      await refreshMe()
      setMsg({ type: 'ok', text: 'Informations enregistrées.' })
    } catch (err) {
      setMsg({ type: 'err', text: flashMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  async function saveClientFinance(e: React.FormEvent) {
    e.preventDefault()
    if (user?.role !== 'CLIENT') return
    setSaving(true)
    setMsg(null)
    try {
      await api.patch('/clients/me', {
        monthlyIncome: monthlyIncome === '' ? undefined : Number(monthlyIncome),
        monthlyCharges: monthlyCharges === '' ? undefined : Number(monthlyCharges),
        contractType,
        seniorityMonths: seniorityMonths === '' ? undefined : Number(seniorityMonths),
        priorDefaults: priorDefaults === '' ? undefined : Number(priorDefaults),
        bankingIncidents: bankingIncidents === '' ? undefined : Number(bankingIncidents),
      })
      await refreshMe()
      setMsg({ type: 'ok', text: 'Profil financier mis à jour.' })
    } catch (err) {
      setMsg({ type: 'err', text: flashMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== newPassword2) {
      setMsg({ type: 'err', text: 'Les deux saisies du nouveau mot de passe diffèrent.' })
      return
    }
    setSaving(true)
    setMsg(null)
    try {
      await api.patch('/profile/password', { currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setNewPassword2('')
      setMsg({ type: 'ok', text: 'Mot de passe modifié.' })
    } catch (err) {
      setMsg({ type: 'err', text: flashMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  async function submitPhoto(e: React.FormEvent) {
    e.preventDefault()
    if (!photoFile) return
    const fd = new FormData()
    fd.append('file', photoFile)
    setSaving(true)
    setMsg(null)
    try {
      await api.post('/profile/avatar', fd)
      setPhotoFile(null)
      await refreshMe()
      setMsg({ type: 'ok', text: 'Photo de profil mise à jour.' })
    } catch (err) {
      setMsg({ type: 'err', text: flashMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  async function removePhoto() {
    setSaving(true)
    setMsg(null)
    try {
      await api.delete('/profile/avatar')
      await refreshMe()
      setMsg({ type: 'ok', text: 'Photo supprimée.' })
    } catch (err) {
      setMsg({ type: 'err', text: flashMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="stb-page space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Compte & profil</p>
          <h1 className="stb-h1 mt-1">Mon compte</h1>
          <p className="stb-lead">
            {roleLabelFr[user.role]} — mettez à jour vos coordonnées, votre adresse et votre photo. Votre e-mail de
            connexion reste fixe.
          </p>
        </div>
        <Link to="/dashboard" className="stb-btn-secondary shrink-0 self-start px-4 py-2 text-sm">
          ← Mon espace
        </Link>
      </div>

      {msg && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            msg.type === 'ok'
              ? 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200'
              : 'bg-red-50 text-red-800 ring-1 ring-red-200'
          }`}
        >
          {msg.text}
        </div>
      )}

      <section className="stb-card">
        <h2 className="text-lg font-semibold text-slate-900">Photo de profil</h2>
        <p className="mt-1 text-sm text-slate-600">JPEG, PNG, GIF ou WebP — 2 Mo maximum.</p>
        <div className="mt-6 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-2 ring-slate-200">
            {avatarSrc ? (
              <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-slate-400">
                {(firstName?.[0] || user.email[0]).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <form className="flex flex-wrap items-end gap-3" onSubmit={submitPhoto}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                className="max-w-[220px] text-sm text-slate-600"
              />
              <button type="submit" disabled={!photoFile || saving} className="stb-btn-primary text-sm">
                Enregistrer la photo
              </button>
            </form>
            {user.hasAvatar && (
              <button type="button" onClick={() => removePhoto()} disabled={saving} className="stb-btn-secondary text-sm">
                Supprimer la photo
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="stb-card">
        <h2 className="text-lg font-semibold text-slate-900">Identité & coordonnées</h2>
        <form className="mt-6 grid gap-5 sm:grid-cols-2" onSubmit={saveIdentity}>
          <div className="sm:col-span-2">
            <label className="stb-label">E-mail (connexion)</label>
            <input className="stb-input bg-slate-50" value={user.email} readOnly disabled />
          </div>
          <div>
            <label className="stb-label">Prénom</label>
            <input className="stb-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div>
            <label className="stb-label">Nom</label>
            <input className="stb-input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="stb-label">Téléphone</label>
            <input className="stb-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+216…" />
          </div>
          <div className="sm:col-span-2">
            <label className="stb-label">Adresse — ligne 1</label>
            <input className="stb-input" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="stb-label">Adresse — ligne 2 (optionnel)</label>
            <input className="stb-input" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
          </div>
          <div>
            <label className="stb-label">Ville</label>
            <input className="stb-input" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <label className="stb-label">Code postal</label>
            <input className="stb-input" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="stb-label">Pays</label>
            <input className="stb-input" value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
          <div>
            <label className="stb-label">CIN / N° pièce d&apos;identité</label>
            <input
              className="stb-input"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              placeholder="Ex. 12345678"
            />
          </div>
          {['ADMIN', 'AGENT_BANCAIRE', 'CHEF_AGENCE', 'COMITE_CREDIT'].includes(user.role) && (
            <div>
              <label className="stb-label">Agence (affichage profil)</label>
              <input
                className="stb-input"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="Ex. Agence centre-ville"
              />
            </div>
          )}
          <div className="sm:col-span-2">
            <button type="submit" disabled={saving} className="stb-btn-primary">
              Enregistrer les informations
            </button>
          </div>
        </form>
      </section>

      {user.role === 'CLIENT' && (
        <section className="stb-card border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/40">
          <h2 className="text-lg font-semibold text-slate-900">Profil financier & crédit</h2>
          <p className="mt-1 text-sm text-slate-600">
            Ces données alimentent les simulations et l&apos;étude de risque lors de l&apos;analyse de vos dossiers.
          </p>
          <form className="mt-6 grid gap-5 sm:grid-cols-2" onSubmit={saveClientFinance}>
            <div>
              <label className="stb-label">Revenus mensuels nets (TND)</label>
              <input
                type="number"
                className="stb-input"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
            <div>
              <label className="stb-label">Charges mensuelles (TND)</label>
              <input
                type="number"
                className="stb-input"
                value={monthlyCharges}
                onChange={(e) => setMonthlyCharges(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
            <div>
              <label className="stb-label">Type de contrat</label>
              <select className="stb-input" value={contractType} onChange={(e) => setContractType(e.target.value)}>
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="INDEPENDANT">Indépendant</option>
              </select>
            </div>
            <div>
              <label className="stb-label">Ancienneté (mois)</label>
              <input
                type="number"
                className="stb-input"
                value={seniorityMonths}
                onChange={(e) => setSeniorityMonths(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
            <div>
              <label className="stb-label">Incidents de paiement passés</label>
              <input
                type="number"
                min={0}
                className="stb-input"
                value={priorDefaults}
                onChange={(e) => setPriorDefaults(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
            <div>
              <label className="stb-label">Incidents bancaires</label>
              <input
                type="number"
                min={0}
                className="stb-input"
                value={bankingIncidents}
                onChange={(e) => setBankingIncidents(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" disabled={saving} className="stb-btn-primary">
                Enregistrer le profil financier
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="stb-card">
        <h2 className="text-lg font-semibold text-slate-900">Sécurité</h2>
        <p className="mt-1 text-sm text-slate-600">Changement de mot de passe — minimum 8 caractères.</p>
        <form className="mt-6 grid max-w-xl gap-4" onSubmit={submitPassword}>
          <div>
            <label className="stb-label">Mot de passe actuel</label>
            <input
              type="password"
              className="stb-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="stb-label">Nouveau mot de passe</label>
            <input
              type="password"
              className="stb-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="stb-label">Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              className="stb-input"
              value={newPassword2}
              onChange={(e) => setNewPassword2(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <button type="submit" disabled={saving} className="stb-btn-secondary w-fit">
            Mettre à jour le mot de passe
          </button>
        </form>
      </section>
    </div>
  )
}
