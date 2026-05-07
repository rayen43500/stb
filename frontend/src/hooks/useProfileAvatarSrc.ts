import { useEffect, useState } from 'react'
import { api } from '../lib/api'

/**
 * Charge la photo de profil via l’API (JWT), car une balise <img src> ne peut pas envoyer le header Authorization.
 */
export function useProfileAvatarSrc(
  hasAvatar: boolean | undefined,
  token: string | null,
  bustKey?: string | null,
) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!hasAvatar || !token) {
      setSrc(null)
      return
    }
    let blobUrl: string | null = null
    let cancelled = false
    api
      .get('/profile/avatar', { responseType: 'blob' })
      .then((r) => {
        if (cancelled) return
        blobUrl = URL.createObjectURL(r.data)
        setSrc(blobUrl)
      })
      .catch(() => {
        if (!cancelled) setSrc(null)
      })
    return () => {
      cancelled = true
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [hasAvatar, token, bustKey])

  return src
}
