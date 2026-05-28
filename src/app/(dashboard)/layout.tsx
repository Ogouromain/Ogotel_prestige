export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/shared/DashboardSidebar";
import { MobileSidebarTrigger } from "@/components/shared/MobileSidebarTrigger";
import { DashboardRoleGuard } from "@/components/shared/DashboardRoleGuard";
import type { Role } from "@/lib/constants";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

/**
 * DashboardLayout — Gate d'authentification pour TOUTES les pages /dashboard/*.
 *
 * Flux de vérification (sans try/catch autour des redirects) :
 *   1. Auth Supabase via createServerClient() (cookies utilisateur)
 *   2. Profil via le MÊME client (pas de SERVICE_ROLE_KEY)
 *   3. Validation : profil existe, actif, rôle, hôtel
 *   4. Rendu du layout avec sidebar et header
 */
export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  // ═══════════════════════════════════════════════════════════════════════
  // ÉTAPE 1 — Authentification (createServerClient = cookies utilisateur)
  // ═══════════════════════════════════════════════════════════════════════
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.log("[DASHBOARD AUTH] redirect -> /connexion (aucun user)");
    redirect("/connexion");
  }

  console.log("[DASHBOARD AUTH] user ok — id:", user.id, "email:", user.email);

  // ═══════════════════════════════════════════════════════════════════════
  // ÉTAPE 2 — Profil (MÊME client, pas de SERVICE_ROLE_KEY)
  // ═══════════════════════════════════════════════════════════════════════
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, hotel_id, is_active, full_name, hotels(name)")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[DASHBOARD AUTH ERROR] profil query failed:", profileError.message, profileError.code);
    redirect("/connexion?error=profil");
  }

  if (!profile) {
    console.log("[DASHBOARD AUTH] redirect -> /connexion?error=profil-introuvable");
    redirect("/connexion?error=profil-introuvable");
  }

  console.log("[DASHBOARD AUTH] profile ok — role:", profile.role, "is_active:", profile.is_active);

  // ═══════════════════════════════════════════════════════════════════════
  // ÉTAPE 3 — Validation profil
  // ═══════════════════════════════════════════════════════════════════════
  if (!profile.is_active) {
    console.log("[DASHBOARD AUTH] redirect -> /connexion?error=compte-inactif");
    redirect("/connexion?error=compte-inactif");
  }

  const userRole = profile.role as Role;

  // Les rôles non super_admin doivent avoir un hotel_id
  if (userRole !== "super_admin" && !profile.hotel_id) {
    console.log("[DASHBOARD AUTH] redirect -> /connexion?error=hotel-manquant (role:", userRole, ")");
    redirect("/connexion?error=hotel-manquant");
  }

  console.log("[DASHBOARD AUTH] role =", userRole, "— accès autorisé");

  // ═══════════════════════════════════════════════════════════════════════
  // ÉTAPE 4 — Données pour le rendu
  // ═══════════════════════════════════════════════════════════════════════
  // Supabase retourne hotels comme un tableau — on accède via index [0]
  const hotels = profile.hotels as any;
  const hotelName = Array.isArray(hotels) ? hotels[0]?.name : hotels?.name ?? null;

  const fullName = profile.full_name || user.email || "Utilisateur";
  const initial = fullName.charAt(0).toUpperCase();

  const roleLabel =
    userRole === "super_admin"
      ? "Super Administrateur"
      : userRole === "hotel_admin"
        ? `Admin — ${hotelName ?? ""}`
        : userRole === "manager"
          ? "Manager"
          : "Réceptionniste";

  // ═══════════════════════════════════════════════════════════════════════
  // ÉTAPE 5 — Rendu du layout
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar
        profile={{
          full_name: fullName,
          role: userRole,
          hotel_name: hotelName,
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
  );
}
