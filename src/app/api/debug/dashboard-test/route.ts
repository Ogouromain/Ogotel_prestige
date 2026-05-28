import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * GET /api/debug/dashboard-test
 * Endpoint de diagnostic temporaire.
 */
export async function GET() {
  try {
    const results: Record<string, unknown> = {};
    
    const supabase = await createServerClient();
    results["1_client"] = "ok";
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    results["2_user"] = user ? { id: user.id, email: user.email } : null;
    results["2_error"] = userError?.message ?? null;
    
    if (!user) return NextResponse.json({ ...results, conclusion: "no_user" });
    
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, role, hotel_id, is_active, full_name")
      .eq("id", user.id)
      .maybeSingle();
    results["3_profile"] = profile;
    results["3_error"] = profileError?.message ?? null;
    
    return NextResponse.json(results);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : null;
    return NextResponse.json({ error: message, stack }, { status: 500 });
  }
}
