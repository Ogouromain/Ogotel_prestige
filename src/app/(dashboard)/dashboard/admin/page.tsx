"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  CalendarCheck,
  Wallet,
  Users,
  ArrowRight,
  Activity,
} from "lucide-react";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/constants/roles";
import {
  ACTIVITY_ACTION_LABELS,
  type ActivityAction,
  type ActivityLog,
} from "@/types";
import type { Role } from "@/lib/constants";

// ─── Types ──────────────────────────────────────────────────────────
interface SuperAdminStats {
  role: "super_admin";
  full_name: string;
  hotels: number;
  active_hotels?: number;
  pending_requests: number;
  active_subscriptions: number;
  total_users: number;
  recent_activity: ActivityLog[];
}

// ─── Helpers ────────────────────────────────────────────────────────
function getRelativeTime(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `il y a ${diffMin}min`;
  if (diffH < 24) return `il y a ${diffH}h`;
  if (diffD < 7) return `il y a ${diffD}j`;
  return new Date(date).toLocaleDateString("fr-FR");
}

function getActionIcon(action: ActivityAction) {
  switch (action) {
    case "create":  return <Activity className="h-4 w-4 text-emerald-500" />;
    case "update":  return <Activity className="h-4 w-4 text-blue-500" />;
    case "delete":  return <Activity className="h-4 w-4 text-red-500" />;
    case "login":   return <Activity className="h-4 w-4 text-navy" />;
    case "logout":  return <Activity className="h-4 w-4 text-slate" />;
    case "approve": return <Activity className="h-4 w-4 text-emerald-500" />;
    case "reject":  return <Activity className="h-4 w-4 text-red-500" />;
    default:        return <Activity className="h-4 w-4 text-slate" />;
  }
}

// ─── KPI Config ─────────────────────────────────────────────────────
const SA_KPIS = [
  { key: "hotels",              label: "Hôtels",              icon: Building2,   border: "border-l-emerald-500",  bg: "bg-emerald-50",  iconColor: "text-emerald-600" },
  { key: "pending_requests",    label: "Demandes en attente", icon: CalendarCheck, border: "border-l-amber-500",   bg: "bg-amber-50",    iconColor: "text-amber-600" },
  { key: "active_subscriptions",label: "Abonnements actifs",  icon: Wallet,      border: "border-l-blue-500",     bg: "bg-blue-50",     iconColor: "text-blue-600" },
  { key: "total_users",         label: "Utilisateurs",        icon: Users,       border: "border-l-purple-500",   bg: "bg-purple-50",   iconColor: "text-purple-600" },
] as const;

// ─── Animation ──────────────────────────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// ─── KPI Card ───────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  icon: Icon,
  border,
  bg,
  iconColor,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  border: string;
  bg: string;
  iconColor: string;
}) {
  return (
    <Card className={`rounded-xl border border-border border-l-4 ${border} bg-white shadow-sm transition-shadow hover:shadow-md`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate">{label}</p>
            <p className="mt-1 text-2xl font-bold text-navy">
              {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
            </p>
          </div>
          <div className={`rounded-lg ${bg} p-2.5`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ───────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) {
          setError("Impossible de charger les statistiques.");
          return;
        }
        const data = await res.json();
        if (data.role === "super_admin") {
          setStats(data as SuperAdminStats);
        } else {
          setError("Accès réservé au super administrateur.");
        }
      } catch {
        setError("Erreur réseau. Veuillez réessayer.");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <Activity className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-navy">Erreur de chargement</h2>
            <p className="mt-2 text-sm text-slate">{error ?? "Données indisponibles."}</p>
            <Button onClick={() => window.location.reload()} className="mt-4 bg-navy text-ivory hover:bg-navy-light">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy">
            Bonjour, {stats.full_name} 👋
          </h1>
          <p className="mt-1 text-sm text-slate">Voici un aperçu de votre plateforme OGOTEL Prestige.</p>
        </div>
        <Badge variant="outline" className="border-red-200 bg-red-100 text-red-800 w-fit">
          Super Administrateur
        </Badge>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SA_KPIS.map((kpi) => (
          <motion.div key={kpi.key} variants={item}>
            <KpiCard
              label={kpi.label}
              value={stats[kpi.key as keyof SuperAdminStats] as number}
              icon={kpi.icon}
              border={kpi.border}
              bg={kpi.bg}
              iconColor={kpi.iconColor}
            />
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div variants={item} className="flex flex-wrap gap-3">
        <Button asChild className="rounded-xl bg-navy text-ivory hover:bg-navy-light">
          <Link href="/dashboard/admin/demandes">
            <CalendarCheck className="mr-2 h-4 w-4" />
            Voir les demandes
            {stats.pending_requests > 0 && (
              <Badge className="ml-2 bg-amber-500 text-white hover:bg-amber-600">
                {stats.pending_requests}
              </Badge>
            )}
          </Link>
        </Button>
        <Button asChild variant="outline" className="rounded-xl border-border hover:bg-ivory">
          <Link href="/dashboard/admin/hotels">
            <Building2 className="mr-2 h-4 w-4" />
            Gérer les hôtels
          </Link>
        </Button>
        <Button asChild variant="outline" className="rounded-xl border-border hover:bg-ivory">
          <Link href="/dashboard/admin/abonnements">
            <Wallet className="mr-2 h-4 w-4" />
            Abonnements
          </Link>
        </Button>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={item}>
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-gold-dark" />
                <h2 className="font-serif text-lg font-semibold text-navy">Activité récente</h2>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-gold-dark hover:text-gold hover:bg-gold/10">
                <Link href="/dashboard/admin/journal">
                  Tout voir <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            {!stats.recent_activity || stats.recent_activity.length === 0 ? (
              <div className="py-8 text-center">
                <Activity className="mx-auto mb-3 h-10 w-10 text-slate/40" />
                <p className="text-sm text-slate">Aucune activité récente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recent_activity.slice(0, 10).map((log: ActivityLog) => (
                  <div key={log.id} className="flex items-start gap-3 rounded-lg border border-border/50 px-4 py-3 transition-colors hover:bg-ivory/50">
                    {getActionIcon(log.action as ActivityAction)}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-navy">
                          {(log.details?.user_name as string) ?? "Utilisateur"}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${
                            ROLE_COLORS[log.user_role as Role] ?? "bg-slate-100 text-slate"
                          }`}
                        >
                          {log.user_role ? (ROLE_LABELS[log.user_role as Role] ?? log.user_role) : ""}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-sm text-slate">
                        <span className="font-medium text-navy/80">
                          {ACTIVITY_ACTION_LABELS[log.action as ActivityAction] ?? log.action}
                        </span>
                        {log.entity_type && (
                          <span>
                            {" — "}
                            {log.entity_type}
                            {log.entity_id ? ` #${log.entity_id.slice(0, 8)}` : ""}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-xs text-slate">
                      {getRelativeTime(log.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
