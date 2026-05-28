import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    /*
     * Correspond à toutes les routes SAUF :
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation images)
     * - favicon.ico (icône navigateur)
     * - Dossier public (assets, images, etc.)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

/**
 * Proxy Next.js 16 — remplace le middleware.
 *
 * Gère la session utilisateur et protège les routes dashboard.
 * En cas d'erreur critique (Supabase non configuré, etc.),
 * les routes /dashboard sont redirigées vers /connexion proprement.
 * Les autres routes continuent normalement.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  try {
    return await updateSession(request);
  } catch (error) {
    console.error("[PROXY] Erreur critique:", error);

    // Si c'est une route dashboard, rediriger vers connexion
    // (ne pas laisser le layout crasher avec error=serveur)
    if (pathname.startsWith("/dashboard")) {
      const { NextResponse } = await import("next/server");
      const url = request.nextUrl.clone();
      url.pathname = "/connexion";
      url.searchParams.set("error", "session");
      return NextResponse.redirect(url);
    }

    // Pour les autres routes, laisser passer
    const { NextResponse } = await import("next/server");
    return NextResponse.next({ request });
  }
}
