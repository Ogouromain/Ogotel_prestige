"use client";

import { useEffect } from "react";

/**
 * global-error.tsx — Dernier filet de sécurité.
 *
 * Intercepte les erreurs non gérées au niveau RootLayout.
 * En production, redirige immédiatement vers /connexion.
 * En développement, affiche le détail de l'erreur pour le debug.
 *
 * IMPORTANT: Ce composant DOIT avoir <html> et <body> car il
 * remplace complètement le RootLayout quand il se déclenche.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // En production, rediriger vers la connexion au lieu d'afficher une page morte
  useEffect(() => {
    const isProduction = process.env.NODE_ENV === "production";
    if (isProduction) {
      // Délai court pour éviter une boucle de redirect
      const timer = setTimeout(() => {
        window.location.href = "/connexion?error=serveur";
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const isProduction = process.env.NODE_ENV === "production";
  const errorMsg = error?.message ?? "Erreur inconnue";

  return (
    <html lang="fr">
      <body className="antialiased">
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-10 w-10 text-red-500"
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

            <h1 className="text-2xl font-bold text-navy">
              Une erreur est survenue
            </h1>

            {isProduction ? (
              <>
                <p className="mt-3 text-sm text-slate">
                  Une erreur inattendue s&apos;est produite. Redirection vers la page de connexion…
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
                  Erreur en développement — consultez la console pour plus de détails.
                </p>
                <pre className="mt-4 max-h-48 overflow-auto rounded-lg bg-red-50 p-3 text-left text-xs text-red-800 whitespace-pre-wrap">
                  {errorMsg}
                  {error.digest && `\n\nDigest: ${error.digest}`}
                </pre>
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
                    Retour à la connexion
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
