import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const setPasswordSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  new_password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

/**
 * POST /api/auth/admin-set-password
 *
 * ⚠️ ENDPOINT TEMPORAIRE — À SUPPRIMER APRÈS UTILISATION
 *
 * Permet de définir directement un mot de passe pour un utilisateur.
 * Utilise le Service Role Key (bypass RLS).
 *
 * Sécurité : protégé par SETUP_SECRET en production.
 */
export async function POST(request: NextRequest) {
  try {
    // ─── Sécurité : vérifier le secret en production ──────────────
    if (process.env.NODE_ENV === "production") {
      const setupSecret = request.headers.get("x-setup-secret");
      const expectedSecret = process.env.SETUP_SECRET;

      if (!expectedSecret || setupSecret !== expectedSecret) {
        return NextResponse.json(
          { error: "Accès non autorisé." },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const parsed = setPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, new_password } = parsed.data;
    const admin = createAdminClient();

    // Trouver l'utilisateur par email
    const { data: users, error: listError } = await admin.auth.admin.listUsers({
      filter: email.toLowerCase().trim(),
    });

    if (listError || !users || users.users.length === 0) {
      return NextResponse.json(
        { error: "Aucun compte trouvé avec cet e-mail." },
        { status: 404 }
      );
    }

    const user = users.users[0];

    // Mettre à jour le mot de passe
    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      password: new_password,
      email_confirm: true,
    });

    if (updateError) {
      console.error("[auth/admin-set-password] Error:", updateError.message);
      return NextResponse.json(
        { error: `Impossible de mettre à jour le mot de passe: ${updateError.message}` },
        { status: 500 }
      );
    }

    console.log(`[auth/admin-set-password] Password updated for ${email}`);

    return NextResponse.json({
      success: true,
      message: "Mot de passe mis à jour avec succès.",
    });
  } catch (error) {
    console.error("[auth/admin-set-password] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erreur serveur. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
