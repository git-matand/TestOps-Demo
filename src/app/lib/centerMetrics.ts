import { TestCenter, BENCHES_INITIAL, ASSETS_INITIAL, DATA } from "../data";

// ─── Cost constants (aligned with AIInsights simulator) ───────────────────────
export const BENCH_COST_PER_WEEK = 3_200; // €/bench/week
const TARGET_UTILIZATION = 70;            // ideal util %; both idle & overload penalised

// Deterministic per-center pass-rate seed (no raw pass-rate in data model).
const CENTER_PASS_RATE: Record<string, number> = {
  "TC-MUC": 96, "TC-STR": 91, "TC-WAW": 98,
};

// ─── Health Score weights — LOCKED 40/25/20/15 (per IMPROVEMENT_PLAN #4) ───────
export const HEALTH_WEIGHTS = {
  availability: 0.40,
  utilizationFit: 0.25,
  passRate: 0.20,
  issueDensity: 0.15,
} as const;

function parseEuro(s: string | undefined): number {
  if (!s) return 0;
  const n = parseFloat(s.replace(/[^\d.]/g, ""));
  return isNaN(n) ? 0 : n;
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

// ─── Core per-center operational metrics ──────────────────────────────────────
export interface CenterMetrics {
  center: TestCenter;
  benchCount: number;
  upCt: number; downCt: number; maintCt: number; degradedCt: number;
  availabilityPct: number;
  utilizationPct: number;
  passRatePct: number;
  openIssues: number;
}

// `utilizationOverride` lets callers pass the bed-utilization figure already
// shown elsewhere in the UI (META) so Health Score stays consistent on screen.
export function computeCenterMetrics(center: TestCenter, utilizationOverride?: number): CenterMetrics {
  const benches = BENCHES_INITIAL.filter(b => center.benchIds.includes(b.id));
  const upCt       = benches.filter(b => b.status === "Up").length;
  const downCt     = benches.filter(b => b.status === "Down").length;
  const maintCt    = benches.filter(b => b.status === "Maintenance").length;
  const degradedCt = benches.filter(b => b.status === "Degraded").length;
  const availabilityPct = benches.length ? Math.round((upCt / benches.length) * 100) : 0;

  const live = benches.filter(b => b.telemetry.collectorUp);
  const utilizationPct = utilizationOverride != null
    ? utilizationOverride
    : live.length
      ? Math.round(live.reduce((s, b) => s + b.telemetry.cpuPct, 0) / live.length)
      : 0;

  const passRatePct = CENTER_PASS_RATE[center.id] ?? 93;
  const openIssues = computeCenterIssues(center).length;

  return {
    center, benchCount: benches.length,
    upCt, downCt, maintCt, degradedCt,
    availabilityPct, utilizationPct, passRatePct, openIssues,
  };
}

// ─── Health Score (composite 0–100) ───────────────────────────────────────────
export interface HealthBreakdownRow {
  label: string;
  rawLabel: string;   // human-readable raw input
  points: number;     // 0–100 normalised component
  weight: number;     // 0–1
  contribution: number;
}
export interface HealthScore {
  score: number;
  color: string;      // CSS var
  fill: string;       // hex (for SVG gauge)
  label: "Healthy" | "Watch" | "At risk";
  breakdown: HealthBreakdownRow[];
}

export function computeHealthScore(center: TestCenter, m?: CenterMetrics): HealthScore {
  const met = m ?? computeCenterMetrics(center);

  const availPoints = met.availabilityPct;
  const utilGap     = clamp(Math.abs(met.utilizationPct - TARGET_UTILIZATION) * 2);
  const utilPoints  = 100 - utilGap;
  const passPoints  = met.passRatePct;
  const issueDensity = clamp((met.openIssues / Math.max(1, met.benchCount)) * 25);
  const issuePoints = 100 - issueDensity;

  const breakdown: HealthBreakdownRow[] = [
    { label: "Availability",   rawLabel: `${met.upCt}/${met.benchCount} Up (${met.availabilityPct}%)`, points: availPoints, weight: HEALTH_WEIGHTS.availability,   contribution: HEALTH_WEIGHTS.availability * availPoints },
    { label: "Utilization fit", rawLabel: `${met.utilizationPct}% (target ${TARGET_UTILIZATION}%)`,    points: utilPoints,  weight: HEALTH_WEIGHTS.utilizationFit, contribution: HEALTH_WEIGHTS.utilizationFit * utilPoints },
    { label: "Pass rate",      rawLabel: `${met.passRatePct}%`,                                         points: passPoints,  weight: HEALTH_WEIGHTS.passRate,       contribution: HEALTH_WEIGHTS.passRate * passPoints },
    { label: "Issue density",  rawLabel: `${met.openIssues} open / ${met.benchCount} benches`,          points: issuePoints, weight: HEALTH_WEIGHTS.issueDensity,   contribution: HEALTH_WEIGHTS.issueDensity * issuePoints },
  ];

  const score = Math.round(breakdown.reduce((s, r) => s + r.contribution, 0));
  const label  = score >= 80 ? "Healthy" : score >= 60 ? "Watch" : "At risk";
  const color  = score >= 80 ? "var(--ok)" : score >= 60 ? "var(--warn)" : "var(--bad)";
  const fill   = score >= 80 ? "#1A9648" : score >= 60 ? "#B8860B" : "#C0392B";

  return { score, color, fill, label, breakdown };
}

// ─── Cost vs Efficiency economics ─────────────────────────────────────────────
export interface CenterEconomics {
  assetValue: number;     // € sum of asset book value
  benchWeeklyCost: number;
  totalWeeklyCost: number;
  efficiencyPct: number;  // util × passRate / 100
  costPerEffPoint: number;
  quadrant: "Efficient & Lean" | "Efficient & Costly" | "Underused & Lean" | "Underused & Costly";
}

export function computeCenterEconomics(center: TestCenter, m?: CenterMetrics): CenterEconomics {
  const met = m ?? computeCenterMetrics(center);
  const assets = ASSETS_INITIAL.filter(a => center.assetTags.includes(a.tag));
  const assetValue = assets.reduce((s, a) => s + parseEuro(a.value), 0);
  const benchWeeklyCost = met.benchCount * BENCH_COST_PER_WEEK;
  const totalWeeklyCost = Math.round(benchWeeklyCost + assetValue * 0.01); // 1%/wk amortised on book value
  const efficiencyPct = Math.round((met.utilizationPct * met.passRatePct) / 100);
  const costPerEffPoint = efficiencyPct ? Math.round(totalWeeklyCost / efficiencyPct) : totalWeeklyCost;

  // Quadrant split — median-ish thresholds for a 3-center demo
  const isCostly = totalWeeklyCost >= 27_000;
  const isEfficient = efficiencyPct >= 60;
  const quadrant = isEfficient
    ? (isCostly ? "Efficient & Costly" : "Efficient & Lean")
    : (isCostly ? "Underused & Costly" : "Underused & Lean");

  return { assetValue, benchWeeklyCost, totalWeeklyCost, efficiencyPct, costPerEffPoint, quadrant };
}

// ─── Scoped issues for drill-down ─────────────────────────────────────────────
export interface CenterIssue {
  sev: "critical" | "warning";
  kind: "bench" | "asset" | "campaign";
  id: string;
  title: string;
  detail: string;
}

export function computeCenterIssues(center: TestCenter): CenterIssue[] {
  const out: CenterIssue[] = [];
  const benches = BENCHES_INITIAL.filter(b => center.benchIds.includes(b.id));

  benches.filter(b => b.status === "Down").forEach(b => out.push({
    sev: "critical", kind: "bench", id: b.id,
    title: `${b.id} is offline`,
    detail: `${b.name} · last seen ${b.telemetry.lastSeen ?? "unknown"}`,
  }));

  benches.filter(b => b.telemetry.collectorUp).forEach(b => {
    const hit = b.dfTable.find(d => d.usePct > 90);
    if (hit) out.push({
      sev: "critical", kind: "bench", id: b.id + "-disk",
      title: `Disk critical on ${b.id}`,
      detail: `${hit.mount} at ${hit.usePct}% — ${hit.used} / ${hit.size}`,
    });
  });

  benches.filter(b => b.status === "Maintenance").forEach(b => out.push({
    sev: "warning", kind: "bench", id: b.id + "-maint",
    title: `${b.id} in maintenance`,
    detail: `${b.name} · unavailable for scheduling`,
  }));

  ASSETS_INITIAL
    .filter(a => center.assetTags.includes(a.tag) && a.status === "investigating")
    .forEach(a => out.push({
      sev: "warning", kind: "asset", id: a.tag,
      title: `Asset #${a.tag} under investigation`,
      detail: `${a.model} · ${a.location}`,
    }));

  const allCampaigns = [
    ...DATA.campaigns.planned, ...DATA.campaigns.progress,
  ];
  allCampaigns
    .filter(c => c.risk && c.centerId === center.id)
    .forEach(c => out.push({
      sev: "warning", kind: "campaign", id: c.id,
      title: `${c.id} blocked`,
      detail: `${c.title} · ${c.due}`,
    }));

  return out.sort((a, b) => (a.sev === b.sev ? 0 : a.sev === "critical" ? -1 : 1));
}

// ─── Top assets by value (for cost drill-down) ────────────────────────────────
export function topAssetsByValue(center: TestCenter, n = 5) {
  return ASSETS_INITIAL
    .filter(a => center.assetTags.includes(a.tag))
    .map(a => ({ tag: a.tag, model: a.model, value: parseEuro(a.value), location: a.location }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
}
