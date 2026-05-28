"use client";

import { useEffect } from "react";

/**
 * error.tsx — Error boundary pour le layout (dashboard).
 *
 * Intercepte les erreurs dans les Server Components du dashboard.
 * En production, redirige vers /connexion après un court délai.
 * En développement, affiche le détail pour le debug.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DASHBOARD ERROR BOUNDARY]", {
      message: error?.message,
      digest: error?.digest,
      stack: error?.stack?.slice(0, 500),
    });

    // En production, rediriger vers connexion
    if (process.env.NODE_ENV === "production") {
      const timer = setTimeout(() => {
        window.location.href = `/connexion?error=serveur&digest=${encodeURIComponent(error?.digest ?? "unknown")}`;
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const isProduction = process.env.NODE_ENV === "production";

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-8 w-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-navy">
          Erreur de chargement
        </h2>

        {isProduction ? (
          <>
            <p className="mt-3 text-sm text-slate">
              Une erreur est survenue lors du chargement du tableau de bord.
              Redirection vers la connexion…
            </p>
            <p className="mt-1 text-[10px] text-slate/50 font-mono">
              Digest: {error?.digest ?? "N/A"}
            </p>
            <div className="mt-6">
              <a
                href="/connexion?error=serveur"
                className="inline-block rounded-xl bg-navy px-6 py-2.5 text-sm font-semibold text-ivory hover:bg-navy-light transition-colors"
              >
                Retourner à la connexion
              </a>
            </div>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm text-slate">
              {error?.message ?? "Erreur inconnue"}
            </p>
            {error?.digest && (
              <p className="mt-1 text-[10px] text-slate/50 font-mono">
                Digest: {error.digest}
              </p>
            )}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={() => reset()}
                className="rounded-xl bg-navy px-6 py-2.5 text-sm font-semibold text-ivory hover:bg-navy-light transition-colors"
              >
                Réessayer
              </button>
              <a
                href="/connexion"
                className="rounded-xl border border-border px-6 py-2.5 text-sm font-semibold text-navy hover:bg-muted transition-colors"
              >
                Déconnexion
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
