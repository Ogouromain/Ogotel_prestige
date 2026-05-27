import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/**
 * GET /api/config
 *
 * Returns Supabase PUBLIC configuration (anon key only) to the client at RUNTIME.
 * This avoids relying on NEXT_PUBLIC_* build-time inlining,
 * which can be undefined in Vercel deployments.
 *
 * 🔒 Sécurité :
 * - Seul l'anon key (publique par conception) est exposé
 * - Aucune clé secrète (service_role) n'est transmise
 * - Cache-Control: private empêche la mise en cache côté CDN
 */
export async function GET() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      {
        error: "Supabase non configuré",
        message:
          "Les variables NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY doivent être définies.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      supabaseUrl,
      supabaseAnonKey,
    },
    {
      headers: {
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
