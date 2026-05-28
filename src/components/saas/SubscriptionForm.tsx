"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  User,
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  BedDouble,
  CreditCard,
  FileText,
  Loader2,
  CheckCircle2,
  Send,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SITE } from "@/lib/constants";
import type { PlanTier } from "@/types";

/* ═══════════════════════════════════════════════════════════════════
   SCHEMA ZOD
   ═══════════════════════════════════════════════════════════════════ */
const subscriptionSchema = z.object({
  hotel_name: z.string().min(2, "Le nom de l'hôtel est requis (min. 2 caractères)"),
  contact_name: z.string().min(2, "Le nom complet du propriétaire est requis"),
  email: z.string().email("Adresse e-mail invalide"),
  phone: z.string().min(8, "Le numéro de téléphone est requis"),
  whatsapp: z.string().optional(),
  city: z.string().min(2, "La ville est requise"),
  room_count: z.coerce
    .number({ error: "Veuillez entrer un nombre" })
    .int({ error: "Le nombre de chambres doit être un entier" })
    .min(1, { error: "Minimum 1 chambre" })
    .optional(),
  desired_plan: z.enum(["starter", "pro", "prestige"], {
    error: "Veuillez choisir un plan",
  }),
  message: z.string().optional(),
});

type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;

/* ═══════════════════════════════════════════════════════════════════
   PLAN OPTIONS
   ═══════════════════════════════════════════════════════════════════ */
const PLAN_OPTIONS: { value: PlanTier; label: string }[] = [
  { value: "starter", label: "Starter — 20 000 FCFA/mois" },
  { value: "pro", label: "Pro — 50 000 FCFA/mois" },
  { value: "prestige", label: "Prestige — 90 000 FCFA/mois" },
];

/* ═══════════════════════════════════════════════════════════════════
   FORM FIELD CONFIG
   ═══════════════════════════════════════════════════════════════════ */
interface FieldConfig {
  name: keyof SubscriptionFormValues;
  label: string;
  placeholder: string;
  type: "text" | "email" | "tel" | "number" | "textarea" | "select";
  icon: React.ElementType;
  required?: boolean;
  hint?: string;
  colSpan?: 1 | 2;
}

const FIELDS: FieldConfig[] = [
  {
    name: "hotel_name",
    label: "Nom de l'hôtel",
    placeholder: "Hôtel Le Palmier",
    type: "text",
    icon: Building2,
    required: true,
    hint: "Nom de votre établissement hôtelier",
  },
  {
    name: "contact_name",
    label: "Nom complet du propriétaire",
    placeholder: "Jean Dupont",
    type: "text",
    icon: User,
    required: true,
  },
  {
    name: "email",
    label: "Adresse e-mail",
    placeholder: "jean@exemple.com",
    type: "email",
    icon: Mail,
    required: true,
  },
  {
    name: "phone",
    label: "Téléphone",
    placeholder: "+225 XX XX XX XX XX",
    type: "tel",
    icon: Phone,
    required: true,
  },
  {
    name: "whatsapp",
    label: "WhatsApp",
    placeholder: "+225 XX XX XX XX XX",
    type: "tel",
    icon: MessageCircle,
    hint: "Optionnel — sera utilisé pour vous envoyer le code d'activation",
  },
  {
    name: "city",
    label: "Ville",
    placeholder: "Abidjan",
    type: "text",
    icon: MapPin,
    required: true,
  },
  {
    name: "room_count",
    label: "Nombre de chambres",
    placeholder: "25",
    type: "number",
    icon: BedDouble,
    hint: "Nombre total de chambres de votre établissement",
  },
  {
    name: "desired_plan",
    label: "Plan choisi",
    placeholder: "Sélectionner un plan",
    type: "select",
    icon: CreditCard,
    required: true,
  },
  {
    name: "message",
    label: "Message",
    placeholder: "Décrivez votre établissement et vos besoins...",
    type: "textarea",
    icon: FileText,
    colSpan: 2,
    hint: "Optionnel — nous aidera à mieux comprendre vos besoins",
  },
];

/* ═══════════════════════════════════════════════════════════════════
   INPUT CLASS
   ═══════════════════════════════════════════════════════════════════ */
const INPUT_CLASS =
  "rounded-xl border-border focus:border-gold focus:ring-gold/20 transition-colors bg-white";

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

interface SubscriptionFormProps {
  /** Masque le titre et la description au-dessus du formulaire */
  compact?: boolean;
}

export default function SubscriptionForm({ compact = false }: SubscriptionFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema) as Resolver<SubscriptionFormValues>,
    defaultValues: {
      city: "Abidjan",
      desired_plan: "starter",
    },
  });

  async function onSubmit(data: SubscriptionFormValues) {
    setLoading(true);
    setServerError(null);
    setWhatsappUrl(null);

    try {
      const res = await fetch("/api/subscription/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setServerError(result.error || "Erreur lors de l'envoi de la demande.");
        return;
      }

      setWhatsappUrl(result.whatsapp_url || null);
      setSuccess(true);
      reset();
    } catch {
      setServerError("Erreur réseau. Veuillez vérifier votre connexion et réessayer.");
    } finally {
      setLoading(false);
    }
  }

  /* ─── État de succès ──────────────────────────────────────────── */
  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-white p-8 md:p-12 text-center"
      >
        {/* Decorative gradient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full bg-emerald-100 opacity-40 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Animated checkmark */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-50 flex items-center justify-center"
          >
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <h3 className="text-navy text-2xl font-serif font-semibold">
              Demande envoyée avec succès !
            </h3>
            <p className="text-slate text-base mt-3 max-w-md mx-auto leading-relaxed">
              Merci pour votre confiance. Notre équipe étudiera votre demande et vous
              contactera sous <span className="font-semibold text-navy">24 heures</span>.
            </p>
          </motion.div>

          {/* Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-8 bg-ivory rounded-xl p-6 max-w-sm mx-auto"
          >
            <h4 className="text-navy font-semibold text-sm mb-4">
              Que se passe-t-il ensuite ?
            </h4>
            <ol className="text-slate text-sm space-y-2.5 text-left">
              {[
                "Notre équipe étudie votre dossier",
                "Vous recevez un e-mail de confirmation",
                "Effectuez le paiement (Wave, Orange Money, espèces)",
                "Recevez votre code d'activation",
                "Configurez votre hôtel et commencez !",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold/10 text-gold text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
          >
            {whatsappUrl && (
              <Button
                asChild
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-6 font-semibold shadow-lg shadow-emerald-500/20"
              >
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Confirmer sur WhatsApp
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            )}
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setSuccess(false);
                setWhatsappUrl(null);
              }}
              className="rounded-full px-6 border-navy/20 text-navy hover:bg-navy/5"
            >
              Nouvelle demande
            </Button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  /* ─── Formulaire ──────────────────────────────────────────────── */
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      animate={compact ? { opacity: 1, y: 0 } : "visible"}
      variants={{
        hidden: {},
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
      }}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="relative rounded-2xl border border-border bg-white p-6 md:p-8 lg:p-10 shadow-sm"
      >
        {/* Subtle gold accent line at top */}
        <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        {/* Header (only in full mode) */}
        {!compact && (
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 bg-gold/10 text-gold text-xs font-semibold tracking-wider uppercase px-4 py-2 rounded-full mb-4">
              <CreditCard className="h-3.5 w-3.5" />
              Demande d&apos;abonnement
            </div>
            <h3 className="text-navy text-2xl font-serif font-semibold">
              Lancez votre projet avec OGOTEL Prestige
            </h3>
            <p className="text-slate text-sm mt-2 max-w-lg mx-auto">
              Remplissez ce formulaire et notre équipe vous contactera sous 24 heures
              pour finaliser votre abonnement.
            </p>
          </div>
        )}

        {/* Server error */}
        <AnimatePresence>
          {serverError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3"
            >
              <span className="shrink-0 mt-0.5">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <div>
                <p className="font-semibold">Erreur</p>
                <p className="mt-0.5">{serverError}</p>
              </div>
              <button
                type="button"
                onClick={() => setServerError(null)}
                className="ml-auto shrink-0 text-red-400 hover:text-red-600 transition-colors"
              >
                &times;
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form fields — grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {FIELDS.map((field) => {
            const Icon = field.icon;
            const colSpan = field.colSpan === 2 ? "md:col-span-2" : "";

            if (field.type === "select") {
              return (
                <div key={field.name} className={colSpan}>
                  <label className="flex items-center gap-2 text-sm font-medium text-navy mb-1.5">
                    <Icon className="h-4 w-4 text-gold" />
                    {field.label}
                    {field.required && <span className="text-red-400">*</span>}
                  </label>
                  <Select
                    onValueChange={(v) =>
                      setValue(field.name, v as PlanTier, { shouldValidate: true })
                    }
                    defaultValue="starter"
                  >
                    <SelectTrigger className={INPUT_CLASS}>
                      <SelectValue placeholder={field.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {PLAN_OPTIONS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-3.5 w-3.5 text-gold" />
                            <span>{p.label}</span>
                            {p.value === "pro" && (
                              <span className="text-[10px] bg-gold/10 text-gold font-semibold px-2 py-0.5 rounded-full">
                                Populaire
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors[field.name] && (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-red-400" />
                      {errors[field.name]?.message}
                    </p>
                  )}
                </div>
              );
            }

            if (field.type === "textarea") {
              return (
                <div key={field.name} className={colSpan}>
                  <label className="flex items-center gap-2 text-sm font-medium text-navy mb-1.5">
                    <Icon className="h-4 w-4 text-gold" />
                    {field.label}
                  </label>
                  <Textarea
                    rows={4}
                    placeholder={field.placeholder}
                    {...register(field.name)}
                    className={`${INPUT_CLASS} resize-none`}
                  />
                  {field.hint && (
                    <p className="text-slate text-xs mt-1.5">{field.hint}</p>
                  )}
                </div>
              );
            }

            return (
              <div key={field.name} className={colSpan}>
                <label className="flex items-center gap-2 text-sm font-medium text-navy mb-1.5">
                  <Icon className="h-4 w-4 text-gold" />
                  {field.label}
                  {field.required && <span className="text-red-400">*</span>}
                </label>
                <Input
                  type={field.type}
                  placeholder={field.placeholder}
                  {...register(field.name)}
                  className={INPUT_CLASS}
                />
                {field.hint && (
                  <p className="text-slate text-xs mt-1.5">{field.hint}</p>
                )}
                {errors[field.name] && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-red-400" />
                    {errors[field.name]?.message}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit */}
        <div className="mt-8">
          <Button
            type="submit"
            disabled={loading}
            size="lg"
            className="w-full bg-navy text-ivory hover:bg-navy-light rounded-full py-3.5 text-base font-semibold shadow-lg shadow-navy/20 transition-all hover:shadow-navy/30 disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Envoyer ma demande d&apos;abonnement
              </>
            )}
          </Button>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-5 text-slate text-xs">
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                  clipRule="evenodd"
                />
              </svg>
              Données sécurisées
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clipRule="evenodd"
                />
              </svg>
              Réponse sous 24h
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                  clipRule="evenodd"
                />
              </svg>
              Sans engagement
            </span>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
