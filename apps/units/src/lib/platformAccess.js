/**
 * platformAccess.js — Shared plan-based access control for all NuGens apps
 *
 * Plan hierarchy:
 *  free / admin            → access to ALL apps (free tier / admin)
 *  ng_*                    → access to ALL apps (NuGens suite subscription)
 *  hx_*                    → HyperX only
 *  monthly / yearly / gene_* → Gen-E only (old Gene plan names)
 *  dh_*                    → DigiHub only
 *  units_*                 → Units only
 *  unknown                 → allow (never silently lock out)
 */

/** Returns true if the given plan allows access to the specified app */
export function hasAppAccess(plan, app) {
  if (!plan || plan === "free" || plan === "admin") return true;
  if (plan.startsWith("ng_")) return true;          // NuGens suite → all apps
  if (plan === "monthly" || plan === "yearly" || plan.startsWith("gene_")) return app === "gene";
  if (plan.startsWith("hx_")) return app === "hyperx";
  if (plan.startsWith("dh_")) return app === "digihub";
  if (plan.startsWith("units_")) return app === "units";
  return true; // Unknown plan — never lock out
}

/** All platform links for the sidebar switcher */
export const PLATFORM_LINKS = [
  { label: "NuGens Dashboard", icon: "⊞", color: "#e8185d", url: "https://nugens.in.net/dashboard" },
  { label: "Gen-E AI",         icon: "◎", color: "#7c3aed", url: "https://gene.nugens.in.net"      },
  { label: "HyperX",           icon: "⬡", color: "#e8185d", url: "https://hyperx.nugens.in.net"    },
  { label: "DigiHub",          icon: "◈", color: "#0284c7", url: "https://digihub.nugens.in.net"   },
  { label: "Units",            icon: "◇", color: "#d97706", url: "https://units.nugens.in.net"     },
];

/** Friendly label for the upgrade/access-denied page */
export const APP_LABELS = {
  gene:    "Gen-E AI",
  hyperx:  "HyperX",
  digihub: "DigiHub",
  units:   "Units",
  nugens:  "NuGens",
};

