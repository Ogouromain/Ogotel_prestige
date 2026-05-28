import { createServerClient } from "@/lib/supabase/server";
import type { AuthResult } from "./types";
import type { UserProfile } from "@/types";

/**
 * Récupère l'utilisateur authentifié — CÔTÉ SERVEUR.
 *
 * À utiliser dans les Server Components, API Routes, Server Actions.
 * Se base sur le cookie de session (SSR-friendly).
 *
 * @throws Ne lance jamais — renvoie { user: null } si pas de session.
 */
export async function getServerUser(): Promise<AuthResult> {
  const supabase = await createServerClient();

  if (!supabase) {
    return { user: null, session: null };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    user: user ?? null,
    session: session ?? null,
  };
}

/**
 * Récupère l'utilisateur authentifié ou redirige — CÔTÉ SERVEUR.
 *
 * Wrapper avec redirect automatique si non connecté.
 * À utiliser dans les layouts et pages serveurs protégés.
 */
export async function requireServerUser(): Promise<AuthResult> {
  const result = await getServerUser();
  if (!result.user) {
    const { redirect } = await import("next/navigation");
    redirect("/connexion");
  }
  return result;
}

/**
 * Récupère le profil complet de l'utilisateur connecté — CÔTÉ SERVEUR.
 *
 * Combine l'utilisateur Supabase Auth + le profil dans la table `profiles`.
 * Utilise UNIQUEMENT le client serveur authentifié (pas createAdminClient).
 * Utilise maybeSingle() pour ne pas crasher si le profil n'existe pas.
 */
export async function getServerProfile(): Promise<{
  user: NonNullable<AuthResult["user"]> | null;
  profile: UserProfile | null;
}> {
  const { user } = await getServerUser();
  if (!user) return { user: null, profile: null };

  const supabase = await createServerClient();
  if (!supabase) return { user, profile: null };

  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[getServerProfile] erreur:", error.message);
      return { user, profile: null };
    }

    return { user, profile: profile as UserProfile | null };
  } catch (err) {
    console.error("[getServerProfile] erreur critique:", err);
    return { user, profile: null };
  }
}

/**
 * Récupère le profil ou redirige — CÔTÉ SERVEUR.
 *
 * Wrapper avec redirect si non connecté ou si pas de profil.
 */
export async function requireServerProfile(): Promise<{
  user: NonNullable<AuthResult["user"]>;
  profile: UserProfile;
}> {
  const { user, profile } = await getServerProfile();
  if (!user || !profile) {
    const { redirect } = await import("next/navigation");
    redirect("/connexion");
  }
  return { user: user!, profile: profile! };
}
