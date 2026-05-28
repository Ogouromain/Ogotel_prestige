export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/shared/DashboardSidebar'
import { MobileSidebarTrigger } from '@/components/shared/MobileSidebarTrigger'
import { DashboardRoleGuard } from '@/components/shared/DashboardRoleGuard'
import type { Role } from '@/lib/constants'

type ProfileData = {
  id: string
  email: string | null
  role: string
  hotel_id: string | null
  is_active: boolean
  full_name: string | null
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ═══ Auth ═══
  const supabase = await createServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.log('[DASHBOARD AUTH] redirect -> /connexion (no user)')
    redirect('/connexion')
  }

  console.log('[DASHBOARD AUTH] user ok:', user.id, user.email)

  // ═══ Profil (même client, pas de SERVICE_ROLE_KEY) ═══
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, role, hotel_id, is_active, full_name')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('[DASHBOARD AUTH ERROR] profileError:', profileError.message)
    redirect('/connexion?error=profil')
  }

  if (!profile) {
    console.log('[DASHBOARD AUTH] redirect -> profil-introuvable')
    redirect('/connexion?error=profil-introuvable')
  }

  if (!profile.is_active) {
    console.log('[DASHBOARD AUTH] redirect -> compte-inactif')
    redirect('/connexion?error=compte-inactif')
  }

  // ═══ Validation rôle ═══
  const userRole = profile.role as Role

  console.log('[DASHBOARD AUTH] profile ok:', {
    role: userRole,
    hotel_id: profile.hotel_id,
    is_active: profile.is_active,
  })

  // super_admin → toujours autorisé (hotel_id pas requis)
  // autres rôles → hotel_id obligatoire
  if (userRole !== 'super_admin' && !profile.hotel_id) {
    console.log('[DASHBOARD AUTH] redirect -> hotel-manquant (role:', userRole, ')')
    redirect('/connexion?error=hotel-manquant')
  }

  // ═══ Données pour le rendu ═══
  const profileData: ProfileData = {
    id: profile.id,
    email: profile.email ?? user.email ?? null,
    role: userRole,
    hotel_id: profile.hotel_id,
    is_active: profile.is_active,
    full_name: profile.full_name,
  }

  // ═══ Nom d'affichage ═══
  const fullName = profileData.full_name || profileData.email || 'Utilisateur'
  const initial = fullName.charAt(0).toUpperCase()

  const roleLabel =
    userRole === 'super_admin'
      ? 'Super Administrateur'
      : userRole === 'hotel_admin'
        ? 'Admin'
        : userRole === 'manager'
          ? 'Manager'
          : 'Réceptionniste'

  // ═══ Rendu ═══
  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar
        profile={{
          full_name: fullName,
          role: userRole,
        }}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Barre supérieure */}
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-white/80 px-4 backdrop-blur-md lg:px-6">
          <MobileSidebarTrigger
            profile={{
              role: userRole,
            }}
          />
          <div className="flex flex-col">
            <span className="font-serif text-lg font-medium text-navy lg:hidden">
              OGOTEL
            </span>
          </div>
          {/* Infos utilisateur (desktop) */}
          <div className="ml-auto hidden items-center gap-3 lg:flex">
            <div className="text-right">
              <p className="text-sm font-medium text-navy">{fullName}</p>
              <p className="text-xs text-slate">{roleLabel}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-sm font-semibold text-ivory">
              {initial}
            </div>
          </div>
        </header>

        {/* Zone principale */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
            <DashboardRoleGuard userRole={userRole}>
              {children}
            </DashboardRoleGuard>
          </div>
        </main>
      </div>
    </div>
  )
}
