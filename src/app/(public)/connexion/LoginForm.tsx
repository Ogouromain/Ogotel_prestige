"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  KeyRound,
  ShieldCheck,
  Hotel,
  Users,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { SITE } from "@/lib/constants";

/* ─── Validation ──────────────────────────────────────────────────── */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L'e-mail est requis")
    .email("Veuillez entrer un e-mail valide"),
  password: z
    .string()
    .min(1, "Le mot de passe est requis"),
});

type LoginValues = z.infer<typeof loginSchema>;

/* ─── Données du formulaire de connexion ──────────────────────────── */
const ROLE_INFO = [
  {
    icon: ShieldCheck,
    label: "Super Admin",
    desc: "Gestion complète de tous les hôtels",
  },
  {
    icon: Hotel,
    label: "Administrateur",
    desc: "Gestion de votre établissement",
  },
  {
    icon: Briefcase,
    label: "Manager",
    desc: "Supervision et reporting",
  },
  {
    icon: Users,
    label: "Réceptionniste",
    desc: "Réservations et accueil",
  },
];

/* ─── Composant ───────────────────────────────────────────────────── */
export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginValues) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Erreur lors de la connexion.");
        return;
      }

      toast.success(
        result.user?.hotel_name
          ? `Bienvenue, ${result.user.full_name} !`
          : "Connexion réussie !"
      );

      // Redirection selon le rôle
      const redirectUrl = result.redirect_url || "/dashboard";
      router.push(redirectUrl);
      router.refresh();
    } catch {
      toast.error("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* ─── Côté gauche : Branding (desktop uniquement) ─── */}
        <motion.div
          initial={{ opacity: 0, x: -32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="hidden lg:flex flex-col"
        >
          {/* Logo texte */}
          <div className="mb-8">
            <span className="font-serif text-4xl font-bold text-navy">
              OGOTEL
            </span>
            <span className="block text-sm tracking-[0.35em] text-gold font-medium mt-1">
              PRESTIGE
            </span>
          </div>

          {/* Description */}
          <h2 className="text-2xl font-semibold text-navy leading-snug">
            Accédez à votre{" "}
            <span className="text-gold">espace de gestion</span>
          </h2>
          <p className="text-slate mt-3 leading-relaxed">
            Connectez-vous pour gérer vos réservations, chambres, clients et
            facturation depuis un tableau de bord unifié.
          </p>

          {/* Rôles disponibles */}
          <div className="mt-8 grid grid-cols-2 gap-3">
            {ROLE_INFO.map((role) => (
              <div
                key={role.label}
                className="flex items-start gap-3 rounded-xl bg-ivory p-3.5"
              >
                <div className="mt-0.5 rounded-lg bg-gold/10 p-1.5 text-gold">
                  <role.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy">
                    {role.label}
                  </p>
                  <p className="text-xs text-slate mt-0.5">{role.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Indicateur de sécurité */}
          <div className="mt-8 flex items-center gap-2 text-slate text-xs">
            <svg
              className="h-4 w-4 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Connexion sécurisée via Supabase Auth — chiffrement de bout en bout
          </div>
        </motion.div>

        {/* ─── Côté droit : Formulaire ─── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto"
        >
          <div className="rounded-2xl border border-border bg-white p-8 shadow-sm shadow-navy/5">
            {/* En-tête (mobile) */}
            <div className="flex flex-col items-center text-center lg:hidden">
              <span className="font-serif text-2xl font-bold text-navy">
                OGOTEL
              </span>
              <span className="text-xs tracking-[0.3em] text-gold font-medium">
                PRESTIGE
              </span>
            </div>

            {/* Icône de connexion */}
            <div className="mx-auto mt-4 lg:mt-0 flex w-fit rounded-2xl bg-gradient-to-br from-navy to-navy-light p-3 text-ivory shadow-lg shadow-navy/20">
              <LogIn className="h-6 w-6" />
            </div>

            {/* Titre */}
            <div className="mt-5 text-center">
              <h1 className="text-xl font-semibold text-navy">
                Connexion à votre espace
              </h1>
              <p className="mt-1.5 text-sm text-slate">
                Accédez au tableau de bord de votre établissement.
              </p>
            </div>

            {/* Formulaire */}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="mt-8 space-y-5"
              >
                {/* E-mail */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate text-sm font-medium">
                        Adresse e-mail
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="votre@email.com"
                          autoComplete="email"
                          disabled={loading}
                          className="h-11 rounded-xl border-border bg-ivory/50 focus:bg-white transition-colors placeholder:text-slate/40"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Mot de passe */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-slate text-sm font-medium">
                          Mot de passe
                        </FormLabel>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Votre mot de passe"
                            autoComplete="current-password"
                            disabled={loading}
                            className="h-11 rounded-xl border-border bg-ivory/50 focus:bg-white transition-colors pr-11 placeholder:text-slate/40"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate/50 hover:text-slate transition-colors"
                            tabIndex={-1}
                            aria-label={
                              showPassword
                                ? "Masquer le mot de passe"
                                : "Afficher le mot de passe"
                            }
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Bouton de connexion */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-navy font-semibold text-ivory hover:bg-navy-light transition-colors shadow-md shadow-navy/15"
                >
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.span
                        key="loading"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex items-center gap-2"
                      >
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Connexion en cours…
                      </motion.span>
                    ) : (
                      <motion.span
                        key="idle"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex items-center gap-2"
                      >
                        <LogIn className="h-4 w-4" />
                        Se connecter
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </form>
            </Form>

            {/* Séparateur */}
            <div className="relative my-6 flex items-center">
              <div className="flex-1 border-t border-border" />
              <span className="px-3 text-xs text-slate/60">ou</span>
              <div className="flex-1 border-t border-border" />
            </div>

            {/* Lien vers activation */}
            <Link
              href="/activer"
              className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-gold/30 bg-gold/5 text-gold-dark hover:bg-gold/10 hover:border-gold/50 transition-all text-sm font-medium"
            >
              <KeyRound className="h-4 w-4" />
              Activer un nouveau compte
            </Link>

            {/* Lien vers landing */}
            <p className="mt-5 text-center text-sm text-slate">
              Pas encore de compte ?{" "}
              <Link
                href="/#abonnement"
                className="font-medium text-gold hover:text-gold-dark transition-colors"
              >
                Demander un abonnement
              </Link>
            </p>
          </div>

          {/* Footer mobile */}
          <p className="mt-4 text-center text-xs text-slate/50 lg:hidden">
            {SITE.name} — {SITE.address}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
