export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/connexion')
  }

  console.log('[DASHBOARD AUTH] user ok:', user.id, user.email)

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, role, hotel_id, is_active')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('[DASHBOARD AUTH ERROR] profileError:', profileError.message)
    redirect('/connexion?error=profil')
  }

  if (!profile) {
    redirect('/connexion?error=profil-introuvable')
  }

  if (!profile.is_active) {
    redirect('/connexion?error=compte-inactif')
  }

  console.log('[DASHBOARD AUTH] profile ok:', {
    role: profile.role,
    hotel_id: profile.hotel_id,
    is_active: profile.is_active,
  })

  if (profile.role === 'super_admin') {
    console.log('[DASHBOARD AUTH] super_admin detected')
    return <>{children}</>
  }

  if (!profile.hotel_id) {
    redirect('/connexion?error=hotel-manquant')
  }

  return <>{children}</>
}
