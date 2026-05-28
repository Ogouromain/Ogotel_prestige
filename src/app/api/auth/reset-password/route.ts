import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const resetSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
});

/**
 * POST /api/auth/reset-password
 *
 * Utilise le Admin Client pour réinitialiser le mot de passe d'un utilisateur.
 * Envoie un email de réinitialisation Supabase.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const admin = createAdminClient();

    // Vérifier que l'utilisateur existe dans profiles (et est actif)
    const { data: profile } = await admin
      .from("profiles")
      .select("id, is_active")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({
        success: true,
        message: "Si un compte existe avec cet e-mail, un lien de réinitialisation a été envoyé.",
      });
    }

    if (!profile.is_active) {
      return NextResponse.json(
        { error: "Ce compte a été désactivé. Contactez le support." },
        { status: 403 }
      );
    }

    // Envoyer l'email de réinitialisation via Supabase Admin API
    const { error: resetError } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: email.toLowerCase().trim(),
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "https://ogotel-prestige.vercel.app"}/connexion`,
      },
    });

    if (resetError) {
      console.error("[auth/reset-password] Error:", resetError.message);
      return NextResponse.json(
        { error: "Impossible d'envoyer l'email de réinitialisation." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Si un compte existe avec cet e-mail, un lien de réinitialisation a été envoyé.",
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
