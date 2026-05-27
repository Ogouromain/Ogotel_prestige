import { NextResponse } from "next/server";

/**
 * GET /api/debug/env
 *
 * Diagnostic endpoint — lists which Supabase env vars are available.
 * Remove this in production after debugging!
 */
export async function GET() {
  const vars = {
    SUPABASE_URL: process.env.SUPABASE_URL || undefined,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || undefined,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
      ? `${process.env.SUPABASE_ANON_KEY.slice(0, 10)}...`
      : undefined,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(0, 10)}...`
      : undefined,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
      ? `${process.env.SUPABASE_SERVICE_ROLE_KEY.slice(0, 10)}...`
      : undefined,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || undefined,
    NODE_ENV: process.env.NODE_ENV || undefined,
  };

  const available = Object.entries(vars)
    .filter(([, v]) => v !== undefined)
    .map(([k]) => k);
  const missing = Object.entries(vars)
    .filter(([, v]) => v === undefined)
    .map(([k]) => k);

  return NextResponse.json({
    status: missing.length === 0 ? "ok" : "missing_vars",
    available,
    missing,
    vars,
  });
}
