import { createServerClient as sbssrServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase — CÔTÉ SERVEUR uniquement.
 *
 * Lit les variables d'environnement SANS préfixe NEXT_PUBLIC_.
 * Cela évite le problème d'inlining au build time par Next.js :
 *   process.env.NEXT_PUBLIC_* → remplacé à la compilation → undefined
 *   process.env.SUPABASE_*     → lu au runtime → valeur correcte
 *
 * Fallback sur NEXT_PUBLIC_* si les vars sans préfixe n'existent pas.
 *
 * Ne JAMAIS throw — retourne null si Supabase n'est pas configuré.
 * L'appelant doit vérifier null et gérer l'erreur.
 */
export async function createServerClient() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error(
      "[OGOTEL][SERVER CLIENT] SUPABASE_URL ou SUPABASE_ANON_KEY manquantes."
    );
    return null;
  }

  const cookieStore = await cookies();

  return sbssrServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // setAll est appelé depuis un Server Component.
          // Impossible de modifier les cookies ici —
          // le proxy (middleware) se charge de rafraîchir la session.
        }
      },
    },
  });
}
