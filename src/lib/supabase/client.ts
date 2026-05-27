import { createBrowserClient as sbssrBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase — CÔTÉ NAVIGATEUR uniquement.
 *
 * Utilise la ANON_KEY (publique). Sujet au RLS.
 * À importer uniquement dans les composants 'use client'.
 *
 * Le client est initialisé au runtime via /api/config pour éviter
 * de dépendre de NEXT_PUBLIC_* (qui peuvent être undefined au build time).
 */

let _client: ReturnType<typeof sbssrBrowserClient> | null = null;
let _initPromise: Promise<void> | null = null;

/**
 * Fetch Supabase config from /api/config (runtime).
 * Falls back to process.env if available (build-time).
 */
async function loadConfig(): Promise<{ url: string; key: string }> {
  // 1) Try process.env (works if NEXT_PUBLIC_* were available at build time)
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (envUrl && envKey) {
    return { url: envUrl, key: envKey };
  }

  // 2) Fetch from API route (server-side env vars are always available)
  try {
    const res = await fetch("/api/config");
    if (res.ok) {
      const data = await res.json();
      if (data.supabaseUrl && data.supabaseAnonKey) {
        return { url: data.supabaseUrl, key: data.supabaseAnonKey };
      }
    }
  } catch {
    // Network error — fall through
  }

  throw new Error(
    "[OGOTEL] Supabase n'est pas configuré. " +
    "Ajoutez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY " +
    "dans les variables d'environnement Vercel.",
  );
}

/**
 * Initialize the Supabase browser client.
 * Safe to call multiple times — only initializes once.
 */
export async function initSupabaseClient(): Promise<void> {
  if (_client) return;
  if (_initPromise) {
    await _initPromise;
    return;
  }

  _initPromise = (async () => {
    const { url, key } = await loadConfig();
    _client = sbssrBrowserClient(url, key);
  })();

  await _initPromise;
}

/**
 * Get or create the Supabase browser client.
 *
 * IMPORTANT: Call initSupabaseClient() first if you're not sure
 * the client has been initialized (e.g., on first page load).
 */
export function getSupabaseClient() {
  if (_client) return _client;

  // Fallback: try env vars directly (sync, for cases where build had them)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    _client = sbssrBrowserClient(url, key);
    return _client;
  }

  throw new Error(
    "[OGOTEL] Supabase client non initialisé. " +
    "Appelez initSupabaseClient() avant d'utiliser le client.",
  );
}

/**
 * Legacy alias — creates or returns the existing client.
 * Prefer initSupabaseClient() + getSupabaseClient() for new code.
 */
export function createBrowserClient() {
  return getSupabaseClient();
}
