import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

/**
 * Page /dashboard — Routeur par rôle.
 *
 * Cette page ne rend rien — elle redirige immédiatement :
 *   super_admin   → /dashboard/admin
 *   hotel_admin   → /dashboard/mon-hotel
 *   manager       → /dashboard/mon-hotel
 *   receptionist  → /dashboard/mon-hotel
 *
 * Les vérifications d'auth et de profil sont déjà faites par le layout.
 */
export default async function DashboardPage() {
  const supabase = await createServerClient()

  if (!supabase) {
    console.error('[DASHBOARD PAGE] createServerClient() null')
    redirect('/connexion?error=configuration')
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.log('[DASHBOARD PAGE] redirect -> /connexion (no user)')
    redirect('/connexion')
  }

  console.log('[DASHBOARD PAGE] user ok:', user.id, user.email)

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, hotel_id, is_active')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('[DASHBOARD PAGE ERROR] profileError:', profileError.message)
    redirect('/connexion?error=profil')
  }

  if (!profile) {
    console.log('[DASHBOARD PAGE] redirect -> profil-introuvable')
    redirect('/connexion?error=profil-introuvable')
  }

  if (!profile.is_active) {
    console.log('[DASHBOARD PAGE] redirect -> compte-inactif')
    redirect('/connexion?error=compte-inactif')
  }

  // ═══ Routage par rôle ═══

  // super_admin → AVANT la vérification hotel_id
  if (profile.role === 'super_admin') {
    console.log('[DASHBOARD PAGE] role = super_admin, redirect -> /dashboard/admin')
    redirect('/dashboard/admin')
  }

  // Tous les autres rôles nécessitent un hotel_id
  if (!profile.hotel_id) {
    console.log('[DASHBOARD PAGE] redirect -> hotel-manquant (role:', profile.role, ')')
    redirect('/connexion?error=hotel-manquant')
  }

  // hotel_admin, manager, receptionist → dashboard hôtel
  console.log('[DASHBOARD PAGE] role =', profile.role, ', redirect -> /dashboard/mon-hotel')
  redirect('/dashboard/mon-hotel')
}
