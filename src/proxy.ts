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
 * Gère la session utilisateur et protège les routes dashboard.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  try {
    return await updateSession(request);
  } catch (error) {
    console.error("[PROXY] Erreur critique:", error);
    // En cas d'erreur Supabase (config manquante, etc.), laisser passer la requête
    // Le layout dashboard gérera l'erreur proprement avec une redirection
    const { NextResponse } = await import("next/server");
    return NextResponse.next({ request });
  }
}
