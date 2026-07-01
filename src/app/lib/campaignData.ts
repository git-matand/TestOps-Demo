// Campaign data model + 9 domain-aligned mock campaigns (DVC / MBition structure)

export type CampaignStatus = "planned" | "active" | "completed" | "report" | "blocked";
export type RiskLevel     = "none" | "low" | "medium" | "high" | "critical";

export interface CampaignBench {
  id:         string;   // e.g. "x264"
  status:     "working" | "focus-needed" | "not-working";
  uptimePct:  number;
  cpuPct:     number;
  ramPct:     number;
  diskPct:    number;
  coredumps:  number;
}

export interface CampaignExecution {
  totalTests:      number;
  executed:        number;
  pass:            number;
  fail:            number;
  skip:            number;
  other:           number;
  passRate:        number;   // 0–100
  automationRate:  number;   // 0–100
  bugsTotal:       number;
  bugsOpen:        number;
  bugsBySeverity:  { blocker: number; critical: number; major: number; normal: number };
  passRateTrend:   number[]; // 7 days
  automationTrend: number[]; // 7 days
  execPerDay:      number[]; // 7 days
}

export interface CampaignEnvironment {
  benchCount:        number;
  benchWorking:      number;
  benchFocusNeeded:  number;
  benchNotWorking:   number;
  benchUptimePct:    number;
  workerCount:       number;
  workerUptimePct:   number;
  diskCriticalCount: number;
  coredumpCount:     number;
  cpuAvgPct:         number;
  ramAvgPct:         number;
  benches:           CampaignBench[];
}

export interface CampaignAI {
  healthScore:             number;
  healthColor:             string;
  healthLabel:             "On Track" | "Needs Attention" | "At Risk" | "Critical";
  riskLevel:               RiskLevel;
  riskReason:              string;
  forecastedCompletionDate: string;  // ISO date
  forecastDeltaDays:       number;   // positive = late, negative = early
  recommendations: {
    text:   string;
    action: string;
    impact: string;
  }[];
  lessonsLearned?: string[];
}

export interface RichCampaign {
  id:            string;
  title:         string;
  status:        CampaignStatus;
  domain:        string;
  domainLabel:   string;
  team:          string;
  ownerInitials: string;
  ownerName:     string;
  centerId:      string;
  centerLabel:   string;
  startDate:     string;
  endDate:       string;
  teamSize:      number;
  prog:          number;
  risk:          boolean;
  execution:     CampaignExecution;
  environment:   CampaignEnvironment;
  ai:            CampaignAI;
  integrations: {
    jiraProject?:      string;
    gitlabPipeline?:   string;
    jenkinsBuild?:     string;
    grafanaDashboard?: string;
    testPlanId?:       string;
    lastBuildStatus?:  "passed" | "failed" | "running";
    lastBuildNum?:     number;
    lastBuildAge?:     string;
    buildSuccessRate?: number;
    jiraSprint?:       string;
    jiraSprintEnd?:    string;
  };
}

// ─── Utility ─────────────────────────────────────────────────────────────────
const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

function healthMeta(score: number): { healthColor: string; healthLabel: CampaignAI["healthLabel"] } {
  if (score >= 80) return { healthColor: "var(--ok)",   healthLabel: "On Track" };
  if (score >= 60) return { healthColor: "var(--warn)", healthLabel: "Needs Attention" };
  if (score >= 40) return { healthColor: "var(--bad)",  healthLabel: "At Risk" };
  return              { healthColor: "var(--bad)",  healthLabel: "Critical" };
}

// Health score formula matching PRD:
// 40% pass-rate-health + 25% automation-coverage + 20% environment-health + 15% risk-density
function computeAI(
  exec: CampaignExecution,
  env: CampaignEnvironment,
  startDate: string,
  endDate: string,
  riskReason: string,
  recommendations: CampaignAI["recommendations"],
  lessonsLearned?: string[],
): CampaignAI {
  const passPoints  = clamp(exec.passRate);
  const autoPoints  = clamp(exec.automationRate);
  const envPoints   = clamp(env.benchUptimePct);
  const bugDensity  = clamp((exec.bugsOpen / Math.max(1, exec.executed / 100)) * 25);
  const issuePoints = 100 - bugDensity;
  const score       = Math.round(passPoints * 0.40 + autoPoints * 0.25 + envPoints * 0.20 + issuePoints * 0.15);

  const { healthColor, healthLabel } = healthMeta(score);

  // Simple velocity-based forecast
  const avgExecPerDay  = exec.execPerDay.reduce((s, v) => s + v, 0) / exec.execPerDay.length || 1;
  const remaining      = exec.totalTests - exec.executed;
  const daysNeeded     = Math.ceil(remaining / Math.max(1, avgExecPerDay));
  const today          = new Date("2026-07-01");
  const forecastedDate = new Date(today.getTime() + daysNeeded * 86_400_000);
  const deadline       = new Date(endDate);
  const deltaMs        = forecastedDate.getTime() - deadline.getTime();
  const forecastDeltaDays = Math.round(deltaMs / 86_400_000);

  const riskLevel: RiskLevel =
    score >= 80 ? "none" :
    score >= 65 ? "low" :
    score >= 50 ? "medium" :
    score >= 35 ? "high" : "critical";

  return {
    healthScore: score, healthColor, healthLabel, riskLevel, riskReason,
    forecastedCompletionDate: forecastedDate.toISOString().slice(0, 10),
    forecastDeltaDays,
    recommendations,
    lessonsLearned,
  };
}

// ─── Mock bench generators ────────────────────────────────────────────────────
function makeBench(
  id: string,
  status: CampaignBench["status"],
  uptime: number,
  cpu: number,
  ram: number,
  disk: number,
  cores: number,
): CampaignBench {
  return { id, status, uptimePct: uptime, cpuPct: cpu, ramPct: ram, diskPct: disk, coredumps: cores };
}

function envSummary(benches: CampaignBench[], workerCount: number, workerUptime: number): CampaignEnvironment {
  const working    = benches.filter(b => b.status === "working").length;
  const focusNeeded = benches.filter(b => b.status === "focus-needed").length;
  const notWorking = benches.filter(b => b.status === "not-working").length;
  const avgUptime  = Math.round(benches.reduce((s, b) => s + b.uptimePct, 0) / benches.length);
  const diskCrit   = benches.filter(b => b.diskPct > 85).length;
  const coredumps  = benches.reduce((s, b) => s + b.coredumps, 0);
  const cpuAvg     = Math.round(benches.reduce((s, b) => s + b.cpuPct, 0) / benches.length);
  const ramAvg     = Math.round(benches.reduce((s, b) => s + b.ramPct, 0) / benches.length);
  return {
    benchCount: benches.length, benchWorking: working,
    benchFocusNeeded: focusNeeded, benchNotWorking: notWorking,
    benchUptimePct: avgUptime, workerCount, workerUptimePct: workerUptime,
    diskCriticalCount: diskCrit, coredumpCount: coredumps,
    cpuAvgPct: cpuAvg, ramAvgPct: ramAvg, benches,
  };
}

// ─── 9 Domain Campaigns ───────────────────────────────────────────────────────

const cmp301_benches = [
  makeBench("x227", "working",     99.4, 34, 56, 72, 0),
  makeBench("x225", "working",     99.1, 41, 60, 68, 1),
  makeBench("x264", "not-working", 18.5, 71, 80, 92, 4),
  makeBench("x269", "working",     97.3, 38, 55, 74, 0),
  makeBench("x270", "working",     98.2, 29, 48, 65, 0),
];
const cmp301_env  = envSummary(cmp301_benches, 3, 99.4);
const cmp301_exec: CampaignExecution = {
  totalTests: 2183, executed: 2183, pass: 1401, fail: 307, skip: 202, other: 273,
  passRate: 64.2, automationRate: 71,
  bugsTotal: 6, bugsOpen: 6,
  bugsBySeverity: { blocker: 1, critical: 2, major: 1, normal: 2 },
  passRateTrend:   [59, 61, 62, 63, 64, 64.2, 64.2],
  automationTrend: [68, 69, 70, 70, 71, 71, 71],
  execPerDay:      [280, 310, 295, 315, 308, 292, 383],
};

const cmp302_benches = [
  makeBench("x278", "focus-needed", 12.0, 68, 79, 89, 5),
  makeBench("x276", "not-working",   0.0, 0,  0,  0,  0),
  makeBench("x191", "working",      44.0, 52, 61, 71, 2),
  makeBench("x285", "not-working",   0.0, 0,  0,  0,  0),
  makeBench("x178", "working",      55.0, 48, 58, 75, 1),
  makeBench("x237", "not-working",   0.0, 0,  0,  0,  0),
  makeBench("x238", "not-working",   0.0, 0,  0,  0,  0),
  makeBench("x271", "working",      66.0, 42, 55, 70, 0),
  makeBench("x284", "not-working",   0.0, 0,  0,  0,  0),
];
const cmp302_env  = envSummary(cmp302_benches, 4, 0);
const cmp302_exec: CampaignExecution = {
  totalTests: 136, executed: 136, pass: 100, fail: 36, skip: 0, other: 0,
  passRate: 73.5, automationRate: 100,
  bugsTotal: 4, bugsOpen: 4,
  bugsBySeverity: { blocker: 0, critical: 1, major: 2, normal: 1 },
  passRateTrend:   [70, 71, 72, 73, 73, 73.5, 73.5],
  automationTrend: [100,100,100,100,100,100, 100],
  execPerDay:      [18, 20, 19, 21, 20, 19, 19],
};

const cmp303_benches = [
  makeBench("x231", "working",      82.0, 55, 62, 74, 1),
  makeBench("x259", "not-working",   0.0, 0,  0,  0,  0),
  makeBench("x258", "not-working",   0.0, 0,  0,  0,  0),
  makeBench("x46",  "focus-needed", 31.0, 65, 74, 87, 3),
  makeBench("x273", "working",      91.0, 44, 58, 69, 0),
  makeBench("x229", "not-working",   0.0, 0,  0,  0,  0),
  makeBench("x253", "focus-needed", 28.0, 63, 71, 88, 4),
  makeBench("x42",  "working",      87.0, 49, 60, 72, 0),
  makeBench("x252", "focus-needed", 22.0, 68, 77, 91, 5),
  makeBench("x230", "working",      79.0, 51, 63, 76, 1),
  makeBench("x255", "working",      88.0, 43, 56, 68, 0),
  makeBench("x220", "not-working",   0.0, 0,  0,  0,  0),
];
const cmp303_env  = envSummary(cmp303_benches, 5, 0);
const cmp303_exec: CampaignExecution = {
  totalTests: 527, executed: 527, pass: 377, fail: 176, skip: 56, other: 8,
  passRate: 71.5, automationRate: 0,
  bugsTotal: 11, bugsOpen: 11,
  bugsBySeverity: { blocker: 0, critical: 1, major: 4, normal: 6 },
  passRateTrend:   [68, 70, 71, 71, 71.5, 71.5, 71.5],
  automationTrend: [0, 0, 0, 0, 0, 0, 0],
  execPerDay:      [70, 78, 75, 80, 74, 73, 77],
};

const cmp304_benches = [
  makeBench("x266", "working",     100.0, 31, 48, 62, 0),
  makeBench("x265", "working",     100.0, 29, 45, 60, 0),
  makeBench("x268", "not-working",   0.0, 0,  0,  0,  0),
  makeBench("x267", "working",      99.5, 35, 51, 66, 0),
  makeBench("x146", "focus-needed", 68.2, 62, 71, 86, 2),
  makeBench("x287", "working",     100.0, 28, 44, 58, 0),
  makeBench("x232", "working",     100.0, 33, 49, 63, 0),
  makeBench("x286", "working",     100.0, 30, 46, 61, 0),
];
const cmp304_env  = envSummary(cmp304_benches, 6, 100);
const cmp304_exec: CampaignExecution = {
  totalTests: 855, executed: 855, pass: 798, fail: 37, skip: 20, other: 0,
  passRate: 93.5, automationRate: 100,
  bugsTotal: 14, bugsOpen: 14,
  bugsBySeverity: { blocker: 0, critical: 2, major: 10, normal: 2 },
  passRateTrend:   [91, 92, 92, 93, 93, 93.5, 93.5],
  automationTrend: [100,100,100,100,100,100, 100],
  execPerDay:      [118, 124, 121, 128, 120, 121, 103],
};

// CMP-305 — PRIMARY DEMO CAMPAIGN (Driving Functions — critical state)
const cmp305_benches = [
  makeBench("x64",  "working",      89.0, 44, 58, 71, 1),
  makeBench("x235", "not-working",   0.0, 0,  0,  0,  0),
  makeBench("x246", "working",      92.0, 39, 54, 69, 0),
  makeBench("x234", "working",      88.0, 47, 61, 74, 2),
  makeBench("x233", "focus-needed", 41.0, 72, 81, 93, 7),
  makeBench("x244", "working",      95.0, 36, 52, 67, 0),
  makeBench("x283", "working",      91.0, 42, 57, 70, 1),
  makeBench("x281", "working",      87.0, 45, 60, 73, 0),
  makeBench("x241", "focus-needed", 38.0, 75, 83, 95, 9),
  makeBench("x84",  "not-working",   0.0, 0,  0,  0,  0),
  makeBench("x245", "working",      93.0, 38, 53, 68, 0),
  makeBench("x272", "working",      86.0, 48, 62, 75, 3),
  makeBench("x282", "not-working",   0.0, 0,  0,  0,  0),
  makeBench("x28",  "working",      90.0, 41, 56, 72, 1),
  makeBench("x247", "not-working",   0.0, 0,  0,  0,  0),
];
const cmp305_env  = envSummary(cmp305_benches, 8, 0);
const cmp305_exec: CampaignExecution = {
  totalTests: 14366, executed: 13687, pass: 6631, fail: 7037, skip: 190, other: 0,
  passRate: 48.5, automationRate: 63,
  bugsTotal: 46, bugsOpen: 46,
  bugsBySeverity: { blocker: 9, critical: 12, major: 25, normal: 0 },
  passRateTrend:   [52, 51, 50, 49, 49, 48.5, 48.5],
  automationTrend: [65, 64, 64, 63, 63, 63, 63],
  execPerDay:      [1820, 1950, 1870, 2010, 1930, 1880, 1227],
};

const cmp306_benches = [
  makeBench("x227", "working",     99.4, 34, 56, 72, 0),
  makeBench("x225", "working",     99.1, 41, 60, 68, 1),
  makeBench("x264", "not-working",  0.0, 0,  0,  0,  0),
  makeBench("x269", "working",     97.3, 38, 55, 74, 0),
  makeBench("x270", "working",     98.2, 29, 48, 65, 0),
];
const cmp306_env  = envSummary(cmp306_benches, 3, 99.4);
const cmp306_exec: CampaignExecution = {
  totalTests: 621, executed: 617, pass: 444, fail: 65, skip: 97, other: 11,
  passRate: 72.8, automationRate: 31,
  bugsTotal: 4, bugsOpen: 4,
  bugsBySeverity: { blocker: 0, critical: 2, major: 2, normal: 0 },
  passRateTrend:   [70, 71, 72, 72, 73, 72.8, 72.8],
  automationTrend: [28, 29, 30, 30, 31, 31, 31],
  execPerDay:      [82, 90, 87, 92, 88, 86, 92],
};

const cmp307_benches = [
  makeBench("x249", "not-working",  0.0, 0,  0,  0,  0),
  makeBench("x239", "not-working",  0.0, 0,  0,  0,  0),
  makeBench("x79",  "not-working",  0.0, 0,  0,  0,  0),
  makeBench("x250", "not-working",  0.0, 0,  0,  0,  0),
  makeBench("x240", "not-working",  0.0, 0,  0,  0,  0),
  makeBench("x248", "not-working",  0.0, 0,  0,  0,  0),
  makeBench("x279", "not-working",  0.0, 0,  0,  0,  0),
];
const cmp307_env  = envSummary(cmp307_benches, 2, 0);
const cmp307_exec: CampaignExecution = {
  totalTests: 0, executed: 0, pass: 0, fail: 0, skip: 0, other: 0,
  passRate: 0, automationRate: 0,
  bugsTotal: 0, bugsOpen: 0,
  bugsBySeverity: { blocker: 0, critical: 0, major: 0, normal: 0 },
  passRateTrend:   [0, 0, 0, 0, 0, 0, 0],
  automationTrend: [0, 0, 0, 0, 0, 0, 0],
  execPerDay:      [0, 0, 0, 0, 0, 0, 0],
};

const cmp308_benches = [
  makeBench("x157", "not-working",  0.0, 0,  0,  0,  0),
  makeBench("x205", "not-working",  0.0, 0,  0,  0,  0),
  makeBench("x236", "not-working",  0.0, 0,  0,  0,  0),
];
const cmp308_env  = envSummary(cmp308_benches, 2, 78);
const cmp308_exec: CampaignExecution = {
  totalTests: 1791, executed: 1780, pass: 1661, fail: 28, skip: 90, other: 1,
  passRate: 93.3, automationRate: 94,
  bugsTotal: 0, bugsOpen: 0,
  bugsBySeverity: { blocker: 0, critical: 0, major: 0, normal: 0 },
  passRateTrend:   [90, 91, 92, 92, 93, 93.3, 93.3],
  automationTrend: [92, 93, 93, 94, 94, 94, 94],
  execPerDay:      [240, 258, 251, 261, 249, 255, 266],
};

const cmp309_benches = [
  makeBench("x277", "working",     98.0, 36, 52, 71, 0),
  makeBench("x280", "working",     97.5, 40, 56, 74, 1),
  makeBench("x169", "working",     96.8, 38, 54, 73, 0),
];
const cmp309_env  = envSummary(cmp309_benches, 2, 98);
const cmp309_exec: CampaignExecution = {
  totalTests: 1747, executed: 1670, pass: 1010, fail: 382, skip: 278, other: 0,
  passRate: 57.1, automationRate: 80,
  bugsTotal: 12, bugsOpen: 12,
  bugsBySeverity: { blocker: 4, critical: 2, major: 6, normal: 0 },
  passRateTrend:   [62, 60, 59, 58, 57, 57.1, 57.1],
  automationTrend: [81, 81, 80, 80, 80, 80, 80],
  execPerDay:      [225, 242, 236, 251, 238, 244, 234],
};

// ─── Full campaign list ────────────────────────────────────────────────────────
export const RICH_CAMPAIGNS: RichCampaign[] = [
  {
    id: "CMP-301", title: "App Enabler — W43 Regression", status: "active",
    domain: "app_enabler", domainLabel: "App Enabler",
    team: "AEVT (App Enabler Verification team)", ownerInitials: "AK", ownerName: "A. Kovalenko",
    centerId: "TC-MUC", centerLabel: "Munich (TC-MUC)", startDate: "2026-06-09", endDate: "2026-07-14",
    teamSize: 5, prog: 65, risk: false,
    execution: cmp301_exec, environment: cmp301_env,
    ai: computeAI(cmp301_exec, cmp301_env, "2026-06-09", "2026-07-14",
      "1 bench offline (x264) reducing capacity by 20%",
      [
        { text: "Restore bench x264", action: "Schedule maintenance", impact: "restores 20% capacity" },
        { text: "Escalate 1 blocker in Jira", action: "Open Jira", impact: "unblocks ~8% of tests" },
      ]
    ),
    integrations: {
      jiraProject: "AEVT", jiraSprint: "Sprint 43", jiraSprintEnd: "2026-07-08",
      grafanaDashboard: "DVC Test Report Overview", lastBuildStatus: "passed",
      lastBuildNum: 2312, lastBuildAge: "18m ago", buildSuccessRate: 87, testPlanId: "DVC-W43-AE",
    },
  },
  {
    id: "CMP-302", title: "Architecture & Security — W43 Validation", status: "active",
    domain: "architecture_security_safety", domainLabel: "Architecture & Security & Safety",
    team: "ProductSecurity (SR-1789)", ownerInitials: "SM", ownerName: "S. Marek",
    centerId: "TC-STR", centerLabel: "Stuttgart (TC-STR)", startDate: "2026-06-09", endDate: "2026-07-14",
    teamSize: 9, prog: 44, risk: true,
    execution: cmp302_exec, environment: cmp302_env,
    ai: computeAI(cmp302_exec, cmp302_env, "2026-06-09", "2026-07-14",
      "5 of 9 benches offline — 0% worker uptime halting parallel execution",
      [
        { text: "Restore 5 offline benches", action: "Schedule maintenance", impact: "+178% execution velocity" },
        { text: "Escalate bench outage to HW team", action: "Notify HW-Engineer", impact: "reduces outage window" },
      ]
    ),
    integrations: {
      jiraProject: "ARSS", jiraSprint: "Sprint 43", jiraSprintEnd: "2026-07-08",
      grafanaDashboard: "DVC Test Report Overview", lastBuildStatus: "failed",
      lastBuildNum: 891, lastBuildAge: "2h ago", buildSuccessRate: 62, testPlanId: "DVC-W43-ARSS",
    },
  },
  {
    id: "CMP-303", title: "Audio Verification — W43", status: "active",
    domain: "audio", domainLabel: "Audio",
    team: "AudioVerification (SR-2730)", ownerInitials: "LW", ownerName: "L. Wójcik",
    centerId: "TC-MUC", centerLabel: "Munich (TC-MUC)", startDate: "2026-06-09", endDate: "2026-07-18",
    teamSize: 12, prog: 58, risk: false,
    execution: cmp303_exec, environment: cmp303_env,
    ai: computeAI(cmp303_exec, cmp303_env, "2026-06-09", "2026-07-18",
      "0% automation — all tests run manually, slowing execution cycle",
      [
        { text: "Automate top 50 failing scenarios", action: "Create automation tasks", impact: "reduces cycle by 30%" },
        { text: "Fix disk on x46, x252 (>88%)", action: "Alert HW-Engineer", impact: "prevents job failure" },
      ]
    ),
    integrations: {
      jiraProject: "AUDIO", jiraSprint: "Sprint 43", jiraSprintEnd: "2026-07-08",
      grafanaDashboard: "DVC Test Report Overview", lastBuildStatus: "running",
      lastBuildNum: 1548, lastBuildAge: "4m ago", buildSuccessRate: 79, testPlanId: "DVC-W43-AUDIO",
    },
  },
  {
    id: "CMP-304", title: "Connectivity — W43 Full Regression", status: "active",
    domain: "connectivity", domainLabel: "Connectivity",
    team: "DVC Connectivity Spyrosoft (SR-3048654)", ownerInitials: "KN", ownerName: "K. Nowak",
    centerId: "TC-WAW", centerLabel: "Warsaw (TC-WAW)", startDate: "2026-06-09", endDate: "2026-07-11",
    teamSize: 8, prog: 82, risk: false,
    execution: cmp304_exec, environment: cmp304_env,
    ai: computeAI(cmp304_exec, cmp304_env, "2026-06-09", "2026-07-11",
      "Minor: bench x146 approaching disk threshold (86%)",
      [
        { text: "Clear disk on x146 (86%)", action: "Schedule cleanup", impact: "prevents potential failure" },
      ]
    ),
    integrations: {
      jiraProject: "CONN", jiraSprint: "Sprint 43", jiraSprintEnd: "2026-07-08",
      grafanaDashboard: "DVC Test Report Overview", lastBuildStatus: "passed",
      lastBuildNum: 3204, lastBuildAge: "6m ago", buildSuccessRate: 94, testPlanId: "DVC-W43-CONN",
    },
  },
  {
    id: "CMP-305", title: "Driving Functions — W43 Regression", status: "active",
    domain: "driving_functions", domainLabel: "Driving Functions",
    team: "Verification - Driving Functions (SR-1788)", ownerInitials: "PB", ownerName: "P. Bakun",
    centerId: "TC-MUC", centerLabel: "Munich (TC-MUC)", startDate: "2026-06-09", endDate: "2026-07-14",
    teamSize: 15, prog: 33, risk: true,
    execution: cmp305_exec, environment: cmp305_env,
    ai: computeAI(cmp305_exec, cmp305_env, "2026-06-09", "2026-07-14",
      "Pass rate critically low (48.5%), 4 benches offline, 9 blocker bugs open",
      [
        { text: "Restore 4 offline benches (x235, x84, x282, x247)", action: "Schedule maintenance", impact: "+27% execution capacity" },
        { text: "Escalate 9 blocker bugs to R&D", action: "Open Jira filter", impact: "unblocks ~18% of failed tests" },
        { text: "Fix x233, x241 disk (>93%)", action: "Alert HW-Engineer", impact: "prevents imminent job failure" },
      ]
    ),
    integrations: {
      jiraProject: "DRVFN", jiraSprint: "Sprint 43", jiraSprintEnd: "2026-07-08",
      grafanaDashboard: "DVC Test Report Overview", lastBuildStatus: "failed",
      lastBuildNum: 5841, lastBuildAge: "22m ago", buildSuccessRate: 61, testPlanId: "DVC-W43-DRV",
    },
  },
  {
    id: "CMP-306", title: "Hybrid Apps — W43 Integration", status: "active",
    domain: "hybrid_apps", domainLabel: "Hybrid Apps",
    team: "In-Vehicle Personalization (IVP) (SR-1780)", ownerInitials: "WP", ownerName: "W. Pikulski",
    centerId: "TC-STR", centerLabel: "Stuttgart (TC-STR)", startDate: "2026-06-09", endDate: "2026-07-18",
    teamSize: 5, prog: 48, risk: false,
    execution: cmp306_exec, environment: cmp306_env,
    ai: computeAI(cmp306_exec, cmp306_env, "2026-06-09", "2026-07-18",
      "Low automation rate (31%) extending manual execution time",
      [
        { text: "Automate 25 regression cases", action: "Create automation plan", impact: "+12% pass rate velocity" },
        { text: "Investigate 2 critical bugs", action: "Open Jira", impact: "may resolve 8% of failures" },
      ]
    ),
    integrations: {
      jiraProject: "HYBAP", jiraSprint: "Sprint 43", jiraSprintEnd: "2026-07-08",
      grafanaDashboard: "DVC Test Report Overview", lastBuildStatus: "passed",
      lastBuildNum: 1124, lastBuildAge: "34m ago", buildSuccessRate: 77, testPlanId: "DVC-W43-HYBAP",
    },
  },
  {
    id: "CMP-307", title: "Vehicle Functions — W43 Smoke", status: "blocked",
    domain: "vehicle_functions", domainLabel: "Vehicle Functions",
    team: "QTeam Connectivity (SR-1808)", ownerInitials: "AK", ownerName: "A. Kovalenko",
    centerId: "TC-WAW", centerLabel: "Warsaw (TC-WAW)", startDate: "2026-06-16", endDate: "2026-07-21",
    teamSize: 7, prog: 0, risk: true,
    execution: cmp307_exec, environment: cmp307_env,
    ai: computeAI(cmp307_exec, cmp307_env, "2026-06-16", "2026-07-21",
      "All 7 benches offline (0% uptime) — campaign cannot start",
      [
        { text: "Restore benches x79, x250 first (HW priority)", action: "Create HW ticket", impact: "enables campaign start" },
        { text: "Escalate to test center manager", action: "Notify Manager", impact: "expedites resolution" },
      ]
    ),
    integrations: {
      jiraProject: "VEHFN", jiraSprint: "Sprint 43", jiraSprintEnd: "2026-07-08",
      grafanaDashboard: "DVC Test Report Overview", lastBuildStatus: "failed",
      lastBuildNum: 208, lastBuildAge: "4d ago", buildSuccessRate: 0, testPlanId: "DVC-W43-VEHFN",
    },
  },
  {
    id: "CMP-308", title: "Vehicle Abstraction — W43 Regression", status: "completed",
    domain: "vehicle_abstraction", domainLabel: "Vehicle Abstraction",
    team: "Android Platform Development (SR-1866)", ownerInitials: "SM", ownerName: "S. Marek",
    centerId: "TC-WAW", centerLabel: "Warsaw (TC-WAW)", startDate: "2026-06-02", endDate: "2026-06-27",
    teamSize: 3, prog: 100, risk: false,
    execution: cmp308_exec, environment: cmp308_env,
    ai: computeAI(cmp308_exec, cmp308_env, "2026-06-02", "2026-06-27",
      "Completed — all benches offline post-campaign (de-allocated)",
      [],
      [
        "Pass rate reached 93.3% — above the 90% target. ✓",
        "All 3 benches offline post-campaign — de-allocation confirmed.",
        "Automation coverage 94% (target: 90%). Exceeded. ✓",
        "0 open bugs at campaign end. Excellent quality gate. ✓",
      ]
    ),
    integrations: {
      jiraProject: "VEHAB", jiraSprint: "Sprint 42", jiraSprintEnd: "2026-06-24",
      grafanaDashboard: "DVC Test Report Overview", lastBuildStatus: "passed",
      lastBuildNum: 744, lastBuildAge: "4d ago", buildSuccessRate: 91, testPlanId: "DVC-W42-VEHAB",
    },
  },
  {
    id: "CMP-309", title: "Starfish — W43 System Test", status: "active",
    domain: "starfish", domainLabel: "Starfish",
    team: "Starfish QA (SR-3724252)", ownerInitials: "LW", ownerName: "L. Wójcik",
    centerId: "TC-MUC", centerLabel: "Munich (TC-MUC)", startDate: "2026-06-09", endDate: "2026-07-11",
    teamSize: 3, prog: 55, risk: true,
    execution: cmp309_exec, environment: cmp309_env,
    ai: computeAI(cmp309_exec, cmp309_env, "2026-06-09", "2026-07-11",
      "Pass rate declining 5% WoW; 4 blocker bugs increasing failure rate",
      [
        { text: "Investigate 4 blocker bugs (root cause)", action: "Open Jira", impact: "may restore +15% pass rate" },
        { text: "Increase team to 5 FTE", action: "Request resourcing", impact: "estimated +3 days velocity" },
      ]
    ),
    integrations: {
      jiraProject: "STAR", jiraSprint: "Sprint 43", jiraSprintEnd: "2026-07-08",
      grafanaDashboard: "DVC Test Report Overview", lastBuildStatus: "failed",
      lastBuildNum: 2891, lastBuildAge: "41m ago", buildSuccessRate: 72, testPlanId: "DVC-W43-STAR",
    },
  },
];

export function getCampaignById(id: string): RichCampaign | undefined {
  return RICH_CAMPAIGNS.find(c => c.id === id);
}

export function getCampaignsByStatus(status: CampaignStatus): RichCampaign[] {
  return RICH_CAMPAIGNS.filter(c => c.status === status);
}

export function getPortfolioKPIs() {
  const active    = RICH_CAMPAIGNS.filter(c => c.status === "active");
  const onTrack   = active.filter(c => c.ai.riskLevel === "none" || c.ai.riskLevel === "low").length;
  const atRisk    = active.filter(c => c.ai.riskLevel === "medium" || c.ai.riskLevel === "high").length;
  const blocked   = RICH_CAMPAIGNS.filter(c => c.status === "blocked").length;
  const totalBugs = RICH_CAMPAIGNS.reduce((s, c) => s + c.execution.bugsOpen, 0);
  const avgPass   = Math.round(
    active.filter(c => c.execution.executed > 0).reduce((s, c) => s + c.execution.passRate, 0) /
    Math.max(1, active.filter(c => c.execution.executed > 0).length)
  );
  const avgAuto   = Math.round(
    active.reduce((s, c) => s + c.execution.automationRate, 0) / Math.max(1, active.length)
  );
  return {
    total: RICH_CAMPAIGNS.length, active: active.length, onTrack, atRisk,
    blocked, totalBugs, avgPassRate: avgPass, avgAutomationRate: avgAuto,
  };
}
