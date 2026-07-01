# Campaign Management — Redesign PRD
**Version:** 1.0 · **Date:** 2026-07-01 · **Status:** Draft for stakeholder review  
**Authors:** Senior PM + Senior Product Designer (AI-assisted)  
**Stakeholders:** Wojciech, Jose, Kartik, Ahoy, Andrii

---

## 1. Executive Summary

The current Campaign Management screen duplicates scheduling and reporting features that already exist in Jira, Jenkins, GitLab, and Grafana. This redesign repositions Campaigns as an **intelligent integrator and command center** — it pulls data from all external tools, presents it in role-appropriate views, and layers AI-driven predictions and advisory on top.

**North-star outcome:** A test manager or C-level executive can open Campaigns and immediately know — without switching tools — whether each active campaign is on track, what the risk is, and what action to take.

---

## 2. Problem Statement

| Current State | Desired State |
|---|---|
| Kanban board with static cards | Live campaign health hub pulling from Jira, Grafana, Jenkins, GitLab |
| Same view for all roles | Adaptive dashboards: executive summary ↔ engineer detail |
| Manual fields (Jenkins, Polarion) that users skip | Auto-populated from integrations; no redundant input |
| No forecasting or risk signal | AI predicts completion date, flags risk, recommends actions |
| Simulator buried in AI Insights | Simulation is a first-class tab in every campaign |
| No post-campaign report | Automated "Lessons Learned" generated when campaign completes |
| Confusing terminology (bed vs device, test bench) | Consistent glossary enforced throughout the UI |

---

## 3. User Personas & Role Adaptation

### 3.1 Manager (C-level / Test Manager)
**Goal:** Understand portfolio health at a glance. Make resourcing decisions.  
**Questions they ask:** Is this campaign on track? Do we have enough engineers and benches? What does the forecast say?  
**Campaign view shows:** Health score, forecasted completion date, % automated, trend arrows, risk flags, cost impact, AI advisory.

### 3.2 HW-Engineer
**Goal:** Ensure environment is ready and hardware is not blocking execution.  
**Questions they ask:** Which benches are working? What's the disk / uptime situation? Which benches need maintenance?  
**Campaign view shows:** Bench readiness per campaign, uptime %, resource health (CPU/RAM/disk/coredumps), blocker hardware issues.

### 3.3 Engineer (Test Engineer)
**Goal:** Execute tests, track progress, understand what's failing.  
**Questions they ask:** What's my pass rate today? Where are the failures? Which bugs are open?  
**Campaign view shows:** Test execution breakdown (PASS/FAIL/SKIP), bug list by severity, automation rate, daily trend chart.

---

## 4. New Conceptual Model

A **Campaign** in the redesigned system is a named test initiative mapped 1:1 to a domain or delivery milestone. It is NOT a Jira ticket and NOT a Jenkins job — it is the **aggregated view** of all of them.

```
Campaign
├── Identity: name, domain, owner, dates, status
├── Scope: team(s), test center(s), benches assigned
├── Execution data  ← pulled from Jira / TestRail / Polarion
│   ├── tests executed, PASS / FAIL / SKIP / OTHER counts
│   ├── pass rate %, automation rate %
│   └── bugs: Blocker / Critical / Major / Normal
├── Environment data  ← pulled from Grafana / direct telemetry
│   ├── bench uptime %, worker uptime %
│   ├── CPU / RAM / disk usage per bench
│   └── coredump count
├── Pipeline data  ← pulled from Jenkins / GitLab CI
│   ├── last build status, build trend
│   └── deployment frequency
└── AI layer  ← computed locally (deterministic for demo)
    ├── health score (0–100)
    ├── forecasted completion date
    ├── risk level + reason
    ├── recommended actions
    └── simulation output
```

---

## 5. Information Architecture

### 5.1 Campaign List (Portfolio View)
Replaces the simple Kanban. Two display modes:
- **List mode** (default): sortable table with inline KPI sparklines
- **Board mode** (optional toggle): simplified status columns

### 5.2 Campaign Detail (Single Campaign View)
5 tabs:

| Tab | Audience | Primary Content |
|---|---|---|
| **Overview** | All (role-adapted) | Health score card, KPI strip, AI advisory panel |
| **Execution** | Engineer, Manager | Test metrics chart, pass rate trend, bug table |
| **Resources** | HW-Engineer, Manager | Bench readiness, worker status, environment health |
| **Integrations** | Manager, HW-Engineer | Live data from Jira / Grafana / Jenkins / GitLab |
| **Simulate** | Manager | Campaign simulator with AI risk assessment |

---

## 6. Screen Specification — Campaign List

### 6.1 Header KPI Strip (role-adapted)

**Manager sees:**
- Active Campaigns `8 / 12`
- On Track `5` (green)
- At Risk `2` (amber)
- Blocked `1` (red)
- Portfolio Automation Rate `68%`

**Engineer sees:**
- My Campaigns `3`
- Tests Run Today `1,247`
- Pass Rate (today) `71.5%`
- Open Bugs `46`

**HW-Engineer sees:**
- Benches In Use `9 / 12`
- Bench Uptime (avg) `18.5%` ← critical indicator
- Workers Down `3`
- Disk Critical `4 benches`

### 6.2 Campaign List Table

Columns (all roles):
```
[Status dot] | Campaign Name | Domain | Owner | Start → End | Progress bar | Pass Rate | Automation % | Risk | Actions
```

Status dots:
- 🟢 On Track
- 🟡 Needs Attention  
- 🔴 At Risk / Blocked
- ⚪ Planned
- ✓ Completed

**Row expansion (click):** Shows inline mini-summary before navigating to detail — prevents full-page navigation for quick checks.

### 6.3 Filters & Sorting
- Filter by: Status, Domain, Owner, Test Center, Date range, Risk level
- Sort by: Health Score, Pass Rate, Due Date, # Open Bugs
- Quick filters: "My campaigns", "At risk", "Completing this week"

---

## 7. Screen Specification — Campaign Detail

### 7.1 Tab: Overview

**Top section — Health Score Card**
Large central score (0–100) with color fill (green/amber/red).  
Sub-score breakdown (matching Health Score formula used in Test Centers):
```
Health Score = 40% pass-rate-health + 25% automation-rate + 20% environment-uptime + 15% risk-density
```

**KPI Strip (role-adapted)**

Manager view:
```
[ Forecasted Completion ] [ % Automated ] [ Automation Trend ] [ Team Utilization ] [ HW Utilization ] [ Cost Impact ]
```

Engineer view:
```
[ Tests Run ] [ Pass Rate ] [ Failed Tests ] [ Skipped Tests ] [ Open Bugs ] [ Blockers ]
```

HW-Engineer view:
```
[ Bench Uptime ] [ Worker Uptime ] [ Disk Critical ] [ Coredumps ] [ Benches Assigned ] [ Benches OK ]
```

**AI Advisory Panel** (below KPIs)
Card-style insight with:
- 🔴 / 🟡 / 🟢 status pill
- Plain-language status: `"This campaign is 12% behind forecast. At current pace, completion is June 28 — 3 days late."`
- 1–3 recommended actions (chips the user can click to simulate):
  - "Add 2 engineers → saves 2 days"
  - "Increase bench allocation → +8% pass rate"
  - "Escalate 3 blockers in Jira → unblocks 12% of tests"

**Timeline Bar**
Visual bar: `[Start] ━━━━━━━━━●━━━━━━━━━[Today]━━━━━━━━━[Forecast]━━━━━━━━━━━━━[Deadline]`
Shows: planned vs actual progress, forecast completion, risk zone highlighted in amber/red.

---

### 7.2 Tab: Execution

This tab replicates the key data from the `generated-report.html` report, live and per-campaign.

**Test Execution Table** (matches DVC report structure)

| Automation Status | PASS | FAIL | SKIP | OTHER | Executed | Total |
|---|---|---|---|---|---|---|
| Automatable | 156 | 98 | 9 | 21 | 679 | 2,364 |
| Automated | 936 | 775 | 381 | 0 | 2,501 | 7,930 |
| Manual | 148 | 76 | 72 | 131 | 651 | 1,932 |
| **Total** | **1,240** | **949** | **462** | **152** | **3,831** | **12,226** |

**Charts row:**
1. **Pass Rate Trend** — 7-day sparkline + WoW delta
2. **Automation Rate Trend** — bar chart showing manual → automated ratio over time
3. **Failure Distribution** — donut: FAIL categories (env / logic / flaky / infrastructure)

**Bug Table** (grouped by severity)

| Severity | Count | TO DO | IN PROGRESS | CLOSED | RCA |
|---|---|---|---|---|---|
| 1 - Blocker | 6 | 4 | 2 | 0 | 0 |
| 2 - Critical | 12 | 8 | 3 | 1 | 0 |
| 3 - Major | 25 | 15 | 7 | 3 | 0 |
| 4 - Normal | 34 | 20 | 10 | 4 | 0 |

Source badge: `← Jira · synced 2m ago`

---

### 7.3 Tab: Resources

**Bench Readiness Panel** (matches DVC report "Test Environment" section)

Per-bench status grid:
```
[x264]  ██ WORKING       uptime: 99.4%   CPU: 34%   RAM: 56%   Disk: 72%   Coredumps: 0
[x276]  ▓▓ FOCUS NEEDED  uptime: 68.2%   CPU: 71%   RAM: 80%   Disk: 91%↑  Coredumps: 3
[x285]  ░░ NOT WORKING   uptime: 0%      — maintenance window —
```

**Worker Overview**  
Same structure for PC workers (the Grafana "Workers overview" dashboard equivalent).

**Team Allocation Panel**
```
Domain Team: Verification - Driving Functions
  Engineers assigned: 15 FTE  
  Available now:  9  
  On other campaigns: 6
```

**Hardware Utilization**  
Mini heatmap showing bench load %, matching the style of the existing `beds` heatmap on Dashboard.

---

### 7.4 Tab: Integrations

Shows live data cards per connected tool. Status badge on each: `● Connected` / `○ Disconnected`.

**Jira Card**
- Open issues: `46 total (6 Blockers, 12 Critical)`
- Last sync: `2 min ago`
- Sprint: `Sprint 43 · ends Jul 8`
- Link: `→ Open in Jira`

**Grafana Card**
- Dashboard: `DVC Test Report Overview`
- Bench uptime avg: `18.5%` 🔴
- Worker uptime avg: `99.4%` 🟢  
- Last data point: `5 min ago`
- Link: `→ Open dashboard`

**Jenkins / GitLab CI Card**
- Last build: `#1,247 · PASSED · 14m ago`
- Build success rate (7d): `84%`
- Pipeline: `DVC-Main · branch: release/CW43`
- Link: `→ View pipeline`

**TestRail / Polarion Card**  
(Note: displayed as "Test Management" — tool name abstracted)
- Test plan: `DVC-W17`
- Test cases linked: `2,226`
- Last run synced: `1h ago`

---

### 7.5 Tab: Simulate

Embeds the existing `CampaignSimulator` component (from AIInsights) as a native tab — no modal needed.

**Additional inputs specific to a campaign:**
- Pre-filled: Campaign name, Test Center, current bench count, current team size
- User-editable: Duration weeks, team size delta, bench count delta

**Output:**
- Revised completion date
- Risk assessment score
- Assumption string (shown in mono under results)
- "Apply this scenario" button → creates a new planned campaign with these parameters

---

## 8. New Campaign Data Model (TypeScript)

```typescript
export type CampaignStatus = "planned" | "active" | "completed" | "report" | "blocked";
export type RiskLevel = "none" | "low" | "medium" | "high" | "critical";

export interface CampaignDomain {
  id: string;         // e.g. "driving_functions"
  label: string;      // e.g. "Driving Functions"
  team: string;       // e.g. "Verification - Driving Functions (SR-1788)"
}

export interface CampaignExecution {
  // Test counts (from Jira/TestRail)
  totalTests: number;
  executed: number;
  pass: number;
  fail: number;
  skip: number;
  other: number;
  passRate: number;       // 0–100
  automationRate: number; // 0–100 (automated / total)
  
  // Bugs (from Jira)
  bugsTotal: number;
  bugsOpen: number;
  bugsByseverity: { blocker: number; critical: number; major: number; normal: number };
  
  // Trends (7-day arrays)
  passRateTrend: number[];
  automationTrend: number[];
  executedPerDayTrend: number[];
}

export interface CampaignEnvironment {
  // Bench data (from Grafana)
  benchCount: number;
  benchWorking: number;
  benchFocusNeeded: number;
  benchNotWorking: number;
  benchUptimePct: number;  // average across assigned benches
  
  // Worker data
  workerCount: number;
  workerUptimePct: number;
  
  // Resource health (from Grafana)
  diskCriticalCount: number;  // benches with disk > 85%
  coredumpCount: number;
  cpuAvgPct: number;
  ramAvgPct: number;
  
  // Individual benches
  benches: {
    id: string;           // e.g. "x264"
    status: "working" | "focus-needed" | "not-working";
    uptimePct: number;
    cpuPct: number;
    ramPct: number;
    diskPct: number;
    coredumps: number;
  }[];
}

export interface CampaignAI {
  healthScore: number;         // 0–100
  healthColor: string;         // CSS var
  healthLabel: string;         // "On Track" | "Needs Attention" | "At Risk" | "Critical"
  riskLevel: RiskLevel;
  riskReason: string;
  forecastedCompletionDate: string;  // ISO date
  forecastDeltaDays: number;         // positive = delayed, negative = ahead
  recommendations: {
    text: string;
    action: string;             // chip label
    impact: string;             // e.g. "saves 2 days"
  }[];
  lessonsLearned?: string[];    // populated when status === "completed"
}

export interface Campaign {
  id: string;                   // e.g. "CMP-201"
  title: string;
  status: CampaignStatus;
  domain: CampaignDomain;
  
  // Dates
  startDate: string;            // ISO
  endDate: string;              // ISO (planned deadline)
  
  // Ownership
  ownerInitials: string;
  centerId: string;             // e.g. "TC-MUC"
  
  // Scope
  benchIds: string[];           // e.g. ["x64", "x235"]
  teamSize: number;             // FTE count
  
  // Live data (populated from integrations)
  execution: CampaignExecution;
  environment: CampaignEnvironment;
  ai: CampaignAI;
  
  // Integration sources
  integrations: {
    jiraProject?: string;
    gitlabPipeline?: string;
    jenkinsBuild?: string;
    grafanaDashboard?: string;
    testManagementPlan?: string;
  };
}
```

---

## 9. Health Score Formula (Campaigns)

Mirrors the Test Centers health score, but adapted for campaign metrics:

```
Campaign Health Score = 
  40% × pass-rate-health      (pass rate mapped 0–100, where 95%+ = 100pts)
+ 25% × automation-coverage   (automation rate 0–100)
+ 20% × environment-health    (bench uptime % mapped to 0–100)
+ 15% × risk-density          (inverse of open bugs per 100 tests, capped 0–100)
```

Color thresholds:
- 80–100: `var(--ok)` · "On Track"
- 60–79: `var(--warn)` · "Needs Attention"
- 40–59: `var(--bad)` · "At Risk"
- 0–39: `var(--bad)` · "Critical"

---

## 10. AI Features — Detailed Specification

All AI features are **deterministic** for the demo (no LLM calls). Logic lives in `lib/campaignAI.ts`.

### 10.1 Forecasted Completion

```
forecastedDate = startDate + (totalTests / dailyVelocity)
dailyVelocity = avg(executedPerDayTrend, last 7 days)
forecastDeltaDays = daysBetween(forecastedDate, endDate)
```
If `forecastDeltaDays > 3`: risk = "medium"  
If `forecastDeltaDays > 7` or `benchNotWorking > 2`: risk = "high"

### 10.2 Recommendations Engine

Rule-based (priority ordered):

1. **Blocker bugs present** → "Escalate N blockers → unblocks X% of tests"
2. **Pass rate < 50%** → "Review failing test suite — failure rate critical"
3. **forecastDeltaDays > 5** → "Add N engineers → estimated savings: Y days"
4. **benchNotWorking > 1** → "Restore N benches → execution velocity +X%"
5. **diskCritical > 0** → "Clear disk on N benches — risk of job failure"
6. **automationRate < 40%** → "Automate top failing scenarios — reduce cycle time"

### 10.3 Lessons Learned (Post-Campaign)

Triggered when status → "completed". Generates 3–5 auto-statements:
- `"Pass rate reached 93.4% — above the 90% target. ✓"`
- `"Bench uptime averaged 18.5% — critically low. Root cause: disk overflow on x276, x285."`
- `"6 Blocker bugs remained open at campaign end — recommend pre-campaign bug sweep."`
- `"Automation coverage was 68% (target: 75%). Automatable tests still executed manually."`

### 10.4 AI Chat Integration (in existing AIChat.tsx)

Add campaign-specific NLU intents to `lib/chatNlu.ts`:

| User says | Intent | Response |
|---|---|---|
| "is CAN-Stack on track?" | `campaign.status` | Health score + forecast delta |
| "which campaigns are at risk?" | `campaign.risk` | List campaigns with riskLevel ≥ medium |
| "show me failing tests for driving functions" | `campaign.failures` | Failure count + top failure categories |
| "how many blockers does CMP-201 have?" | `campaign.bugs` | Bug count by severity for campaign |
| "forecast CMP-210 with 3 more engineers" | `campaign.simulate` | Call simulateCampaign() and return result |

---

## 11. Terminology Cleanup

The following terms are standardized across all UI text, labels, and mock data:

| Old (remove) | New (use) | Definition |
|---|---|---|
| "bed" (as noun) | **Test Bench** | Physical rack/station with one or more connected DUTs |
| "DUT" (unexplained) | **Device Under Test (DUT)** | First use: spell out; subsequent: DUT |
| "test bed" | **Test Bench** or **Bench** | Never "test bed" — confusing with "testbed" (one word) |
| "Bench" (ambiguous) | **Test Bench** (full) or **Bench ID** (abbreviated) | Context-dependent |
| "worker" | **PC Worker** | Host machine running the test agent |
| "rack" | **Bench Rack** | Physical rack housing multiple benches |
| Jenkins / Polarion (as fields) | Abstracted as "CI Pipeline" / "Test Management" | Tool names hidden; only shown in Integrations tab |
| "campaign" | **Test Campaign** | Full name on first use per screen |

Remove from Campaign card fields:
- ~~`integ` field showing tool name (Jira, Polarion, GitLab CI)~~ → replaced by integration status icons
- ~~`beds` count field~~ → replaced by specific Bench IDs with status dots
- ~~`duts` count field~~ → part of Resources tab, not the list card

---

## 12. Mock Data Plan

### 12.1 New mock campaigns — aligned with real DVC report domains

Replace the current 8 mock campaigns with 9 domain-aligned campaigns:

| Campaign ID | Domain | Status | Pass Rate | Risk |
|---|---|---|---|---|
| CMP-301 | App Enabler | active | 64.2% | medium |
| CMP-302 | Architecture & Security | active | 73.5% | high |
| CMP-303 | Audio | active | 71.5% | medium |
| CMP-304 | Connectivity | active | 93.5% | none |
| CMP-305 | Driving Functions | active | 48.5% | critical |
| CMP-306 | Hybrid Apps | active | 72.8% | medium |
| CMP-307 | Vehicle Functions | blocked | 0% | critical |
| CMP-308 | Vehicle Abstraction | active | 82.4% | low |
| CMP-309 | Starfish | active | 57.1% | high |

### 12.2 Rich mock data per campaign (CMP-305 as primary demo campaign)

CMP-305 "Driving Functions — W43 Regression" is the primary demo campaign:
- 15 benches (x64, x235, x246, x234, x233, x244, x283, x281, x241, x84, x245, x272, x282, x28, x247)
- 4 benches NOT WORKING (x235, x84, x282, x247)
- 2 benches FOCUS NEEDED (x233, x241)
- 14,366 total tests · 13,687 executed
- Pass rate: 48.5% 🔴 (critical)
- 46 open bugs (9 Blocker, 12 Critical, 25 Major)
- Forecasted: 8 days late
- AI: "Restore 4 benches + escalate 9 blockers → completion by deadline"

---

## 13. Implementation Plan

### Phase 1 — Data & Model (2–3h)
1. Create `src/app/lib/campaignAI.ts` — health score, forecast, recommendations, lessons learned
2. Create `src/app/lib/campaignData.ts` — extended mock data (9 campaigns, rich fields)
3. Update `Campaign` interface in `data.ts`

### Phase 2 — Campaign List Redesign (3–4h)
1. Replace Kanban with sortable table + role-adapted KPI strip
2. Add status dots, risk badges, inline pass rate sparkline
3. Keep Board mode toggle (optional, lower priority)
4. Update filters

### Phase 3 — Campaign Detail Page (5–6h)
1. Create `CampaignDetail.tsx` with 5-tab layout (Overview / Execution / Resources / Integrations / Simulate)
2. Overview tab: HealthScore card (reuse `centerMetrics` pattern) + KPI strip + AI Advisory + Timeline bar
3. Execution tab: test execution table + trend charts + bug table
4. Resources tab: bench grid + worker panel + team allocation
5. Integrations tab: live data cards per tool
6. Simulate tab: embed existing `CampaignSimulator`

### Phase 4 — AI Chat Extension (1–2h)
1. Add 5 new campaign intents to `lib/chatNlu.ts`
2. Connect to new `campaignData` mock store

### Phase 5 — Terminology & Polish (1h)
1. Global find/replace: "beds" → "benches", "DUTs" → "Devices (DUT)"
2. Remove tool name from campaign list cards
3. Update glossary labels throughout

---

## 14. Out of Scope (for this sprint)

- Real API calls to Jira / Grafana / Jenkins (mock data only)
- Campaign creation form (existing "New campaign" toast is sufficient)
- Drag-and-drop Kanban (removed in favor of table)
- Mobile responsive layout
- Export to PDF (existing Reports screen covers this)

---

## 15. Open Questions for Stakeholders

1. **Wojciech / Jose / Kartik**: Which 3 KPIs matter most on the campaign list? (Pass rate, Automation %, or something else?)
2. **Ahoy**: Can you share sample Grafana screenshot showing bench uptime format? (To match the visual in Resources tab)
3. **Ahoy**: What's the target pass rate threshold for "On Track" — is 90% right, or domain-specific?
4. **All**: Should post-campaign Lessons Learned be auto-sent to a Slack/email, or just shown in the UI?
5. **Manager role**: Should the Manager see the Execution tab (test details), or only Overview + Resources?

---

## Appendix A — Grafana Dashboard Mapping

Based on the exported Grafana PDFs, the following dashboards map to UI sections:

| Grafana Dashboard | Maps to TestOps UI |
|---|---|
| DVC Test Report Overview | Campaign List → KPI strip |
| Test Bench Overview | Resources tab → Bench grid |
| Test Bench Details | Resources tab → Bench detail row expansion |
| Workers Overview | Resources tab → Worker panel |
| Worker Details | Resources tab → Worker detail row expansion |

---

## Appendix B — DVC Report Field Mapping

The `generated-report.html` fields map to the Campaign data model as follows:

| Report Field | Campaign Data Field |
|---|---|
| Domain | `campaign.domain.label` |
| No of Benches | `campaign.environment.benchCount` |
| Test bench readiness | `campaign.environment.benchWorking` / total |
| Test Execution (PASS/FAIL/SKIP) | `campaign.execution.pass/fail/skip` |
| Pass rate | `campaign.execution.passRate` |
| Automation rate | `campaign.execution.automationRate` |
| Bug reporting (Blocker/Critical) | `campaign.execution.bugsByseverity` |
| Worker uptime | `campaign.environment.workerUptimePct` |
| Rack/bench uptime | `campaign.environment.benchUptimePct` |
| Disk critical | `campaign.environment.diskCriticalCount` |
| Coredumps | `campaign.environment.coredumpCount` |
| Overall Status (OK/NOK/IN PROGRESS) | Derived from `campaign.ai.healthScore` |
| Risk | `campaign.ai.riskLevel` |
