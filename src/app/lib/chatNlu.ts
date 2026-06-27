import { TEST_CENTERS } from "../data";
import {
  computeCenterMetrics, computeCenterEconomics, computeCenterIssues,
} from "./centerMetrics";
import { runSimulation, DUT_PER_BENCH, type SimParams } from "../components/AIInsights";

export type Intent = "simulate" | "capacity" | "cost" | "risk" | "fallback";

export interface NluResult {
  intent: Intent;
  text: string;          // markdown response (** bold, - bullets)
  assumptions?: string;  // recognised slots, shown to the user
  cta?: { label: string; params: SimParams }; // optional "open in simulator"
}

// META utilization seeds (mirror of TestCenters META, used for consistent figures)
const UTIL: Record<string, number> = { "TC-MUC": 78, "TC-STR": 45, "TC-WAW": 52 };
const metrics = (id: string) => computeCenterMetrics(TEST_CENTERS.find(c => c.id === id)!, UTIL[id]);

// ─── Slot extraction ──────────────────────────────────────────────────────────
function matchCenter(q: string): { id: string; matched: boolean } {
  const lower = q.toLowerCase();
  const hit = TEST_CENTERS.find(c =>
    lower.includes(c.city.toLowerCase()) ||
    lower.includes(c.id.toLowerCase()) ||
    lower.includes(c.country.toLowerCase())
  );
  return hit ? { id: hit.id, matched: true } : { id: "TC-MUC", matched: false };
}

function matchCampaignType(q: string): { type: string; matched: boolean } {
  const lower = q.toLowerCase();
  const hit = Object.keys(DUT_PER_BENCH).find(t => lower.includes(t.toLowerCase()));
  return hit ? { type: hit, matched: true } : { type: "Integration", matched: false };
}

function extractNumber(q: string, re: RegExp): number | null {
  const m = q.match(re);
  return m ? parseInt(m[1], 10) : null;
}

const cityOf = (id: string) => TEST_CENTERS.find(c => c.id === id)?.city ?? id;

// ─── Intent classification ────────────────────────────────────────────────────
function classify(q: string): Intent {
  const s = q.toLowerCase();
  if (/simulat|plan a|plan an|how long|how much would|estimate|what would it cost|run a campaign/.test(s)) return "simulate";
  if (/busiest|free|available|idle|load|utiliz|capacity|spare/.test(s)) return "capacity";
  if (/cheap|expensive|cost|budget|spend|efficien|€\/|per.?eff/.test(s)) return "cost";
  if (/risk|blocked|delayed|at risk|slip|down|offline|attention|problem/.test(s)) return "risk";
  return "fallback";
}

// ─── Intent handlers ──────────────────────────────────────────────────────────
function handleSimulate(q: string): NluResult {
  const center = matchCenter(q);
  const type = matchCampaignType(q);
  const duts = extractNumber(q, /(\d+)[\s-]*(?:duts?|devices?|units?)/i);
  const weeks = extractNumber(q, /(\d+)[\s-]*(?:weeks?|wks?|w\b)/i);
  const team = extractNumber(q, /(\d+)[\s-]*(?:engineers?|people|testers?|ppl)/i);

  const params: SimParams = {
    centerId: center.id,
    campaignType: type.type,
    dutCount: duts ?? 8,
    durationWeeks: weeks ?? 4,
    teamSize: team ?? 3,
    priority: /urgent|asap|high|critical/i.test(q) ? "high" : /low|whenever|backlog/i.test(q) ? "low" : "medium",
    selectedBenchIds: [],
  };

  const r = runSimulation(params);
  const topRisks = r.risks.slice().sort((a, b) => {
    const rank = { high: 0, med: 1, low: 2 };
    return rank[a.level] - rank[b.level];
  }).slice(0, 2);

  const text = [
    `**Simulation — ${params.campaignType} · ${cityOf(params.centerId)}**`,
    "",
    `- **Total cost:** €${r.totalCost.toLocaleString()} (${r.benchCost.toLocaleString()} benches · ${r.teamCost.toLocaleString()} team · ${r.dutCost.toLocaleString()} DUT)`,
    `- **Duration:** ${r.actualWeeks} weeks · ${r.startDate} → ${r.endDate}`,
    `- **Benches:** needs ${r.benchesNeeded}, ${r.availableBenches} available — ${r.feasible ? "feasible ✓" : "**not feasible** ✗ timeline extended"}`,
    `- **Recommended team:** ${r.recommendedTeam} engineers`,
    "",
    `**Top risks:**`,
    ...topRisks.map(rk => `- _${rk.level.toUpperCase()}_ — ${rk.text}`),
  ].join("\n");

  const slots: string[] = [
    `center=${cityOf(params.centerId)}${center.matched ? "" : " (default)"}`,
    `type=${params.campaignType}${type.matched ? "" : " (default)"}`,
    `DUTs=${params.dutCount}${duts == null ? " (default)" : ""}`,
    `duration=${params.durationWeeks}w${weeks == null ? " (default)" : ""}`,
  ];

  return { intent: "simulate", text, assumptions: slots.join(" · "), cta: { label: "Open in Campaign Simulator", params } };
}

function handleCapacity(q: string): NluResult {
  const rows = TEST_CENTERS.map(c => {
    const m = metrics(c.id);
    return { city: c.city, util: m.utilizationPct, avail: m.availabilityPct, up: m.upCt, total: m.benchCount };
  });
  const busiest = rows.slice().sort((a, b) => b.util - a.util)[0];
  const freest  = rows.slice().sort((a, b) => a.util - b.util)[0];

  const text = [
    `**Capacity across ${rows.length} centers:**`,
    "",
    ...rows.map(r => `- **${r.city}** — ${r.util}% load · ${r.up}/${r.total} benches Up (${r.avail}% avail)`),
    "",
    `**${freest.city}** has the most spare capacity (${freest.util}% load) — best target for a new campaign.`,
    `**${busiest.city}** is the busiest at ${busiest.util}% — watch for bench contention.`,
  ].join("\n");

  return { intent: "capacity", text };
}

function handleCost(q: string): NluResult {
  const rows = TEST_CENTERS.map(c => {
    const m = metrics(c.id);
    const e = computeCenterEconomics(TEST_CENTERS.find(x => x.id === c.id)!, m);
    return { city: c.city, cost: e.totalWeeklyCost, eff: e.efficiencyPct, perEff: e.costPerEffPoint, quad: e.quadrant };
  });
  const cheapest = rows.slice().sort((a, b) => a.perEff - b.perEff)[0];
  const costly   = rows.slice().sort((a, b) => b.perEff - a.perEff)[0];

  const text = [
    `**Cost vs efficiency by center:**`,
    "",
    ...rows.map(r => `- **${r.city}** — €${r.cost.toLocaleString()}/wk · ${r.eff}% efficiency · €${r.perEff.toLocaleString()}/eff-point · ${r.quad}`),
    "",
    `**${cheapest.city}** gives the best value (€${cheapest.perEff.toLocaleString()} per efficiency point).`,
    `**${costly.city}** is the costliest per unit of output — first candidate for optimization.`,
  ].join("\n");

  return { intent: "cost", text };
}

function handleRisk(q: string): NluResult {
  const all = TEST_CENTERS.flatMap(c =>
    computeCenterIssues(c).map(i => ({ ...i, city: c.city }))
  );
  const crit = all.filter(i => i.sev === "critical");
  const warn = all.filter(i => i.sev === "warning");

  if (all.length === 0) {
    return { intent: "risk", text: "No open issues across any center — all systems operational." };
  }

  const text = [
    `**${crit.length} critical · ${warn.length} warnings across all centers:**`,
    "",
    ...crit.slice(0, 4).map(i => `- _CRITICAL_ — **${i.title}** (${i.city}) · ${i.detail}`),
    ...warn.slice(0, 3).map(i => `- _warning_ — ${i.title} (${i.city})`),
  ].join("\n");

  return { intent: "risk", text };
}

// ─── Public entry ─────────────────────────────────────────────────────────────
export function answerQuery(query: string): NluResult | null {
  const intent = classify(query);
  switch (intent) {
    case "simulate": return handleSimulate(query);
    case "capacity": return handleCapacity(query);
    case "cost":     return handleCost(query);
    case "risk":     return handleRisk(query);
    default:         return null; // let caller fall back to scripted/general reply
  }
}
