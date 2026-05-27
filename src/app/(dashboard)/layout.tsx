export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardSidebar } from "@/components/shared/DashboardSidebar";
import { MobileSidebarTrigger } from "@/components/shared/MobileSidebarTrigger";
import { DashboardRoleGuard } from "@/components/shared/DashboardRoleGuard";
import type { Role } from "@/lib/constants";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  // ─── Auth ────────────────────────────────────────────────────────
  // createServerClient() peut lancer une erreur si Supabase n'est pas configuré.
  // On la catche UNIQUEMENT pour rediriger proprement, jamais pour avaler NEXT_REDIRECT.
  let user: { id: string; email?: string } | null = null;

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      redirect("/connexion");
    }
    user = data.user;
  } catch (err: unknown) {
    // NEXT_REDIRECT est un signal interne de Next.js — ne jamais l'attraper
    const msg = err instanceof Error ? err.message : "";
    if (msg === "NEXT_REDIRECT") throw err;
    if (msg.includes("DYNAMIC_SERVER_USAGE")) throw err;

    // Toute autre erreur (Supabase indisponible, cookies invalides, etc.)
    console.error("[Dashboard Layout] Erreur auth:", msg);
    redirect("/connexion?error=serveur");
  }

  // ─── Profil avec jointure hôtel (via admin client pour fiabilité) ─
  // Supabase retourne hotels comme un tableau — on cast en any pour éviter
  // le conflit de type array vs object sur la jointure.
  let profileData: { id: string; role: Role; hotel_id: string | null; is_active: boolean; full_name: string; hotels?: any } | null = null;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("id, role, hotel_id, is_active, full_name, hotels(name)")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[Dashboard Layout] Erreur profil:", error.message);
      redirect("/connexion?error=profil");
    }

    profileData = data;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "NEXT_REDIRECT") throw err;
    if (msg.includes("DYNAMIC_SERVER_USAGE")) throw err;

    console.error("[Dashboard Layout] Erreur chargement profil:", msg);
    redirect("/connexion?error=profil");
  }

  if (!profileData) {
    redirect("/connexion?error=profil-introuvable");
  }

  if (!profileData.is_active) {
    redirect("/connexion?error=compte-inactif");
  }

  // ─── Données profil ───────────────────────────────────────────────
  const userRole: Role = profileData.role;
  const fullName = profileData.full_name || user.email || "Utilisateur";
  const hotelName = profileData.hotels?.name;
  const initial = fullName.charAt(0).toUpperCase();

  const roleLabel =
    userRole === "super_admin"
      ? "Super Administrateur"
      : userRole === "hotel_admin"
        ? `Admin — ${hotelName ?? ""}`
        : userRole === "manager"
          ? "Manager"
          : "Réceptionniste";

  // ─── Rendu du layout ────────────────────────────────────────────
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
