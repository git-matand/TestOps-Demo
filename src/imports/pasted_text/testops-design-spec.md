 Technical Design Prompt — TestOps Platform: Asset Authoring & Test Bench Management

> **For:** Senior Product Designer extending the existing TestOps Platform prototype
> **Type:** Implementation-level design + interaction spec (solution-level, not a problem brief)
> **Source material:** This prompt, plus the four Grafana reference screenshots (RichOS test-bench overview, RichOS host detail, build/diagnostics panels, Windows worker detail)

---

## 0. Your role and objective

You are extending the **TestOps Platform** — an AI-driven hardware test-farm operations tool for Spyrosoft's automotive embedded test lab. The prototype already exists as a single-file, dark, **Linear-styled** clickable build with a working Assets module (registry, models, categories, audit, topology) and checkout/checkin/register flows.

Deliver **two connected capabilities**, fully consistent with the current design language:

1. **Asset authoring** — let a user *create* and *edit* assets through real forms (today only a minimal "register" exists and "edit" just opens a read-only drawer).
2. **Test Benches** — a new object composed *from* assets. The user can build a bench, see all benches and their live status at a glance, open a bench, and understand what it is, who built it and why, which assets it uses and where, and the live state of those assets (gauges, charts, diagnostics).

The monitoring data these benches expose lives in Grafana today (the screenshots). Your job is to bring that signal *into the product*, attached to the asset/bench model, so an operator never has to leave TestOps to answer "is this bench healthy, and why not."

---

## 1. Context you must respect

**Design system (already in place — reuse, do not reinvent):**
- Visual language: Linear. Near-black surfaces (`--bg #08090A`, panels `#0E0F11`), 1px low-opacity borders with subtle inset top-highlight, compact density, soft elevation.
- Accent: `#5E6AD2` (primary CTA / purple), lighter `#828BF5` for accent text/icons.
- Status palette: green `#68CC8C`, blue `#4EA7FC`, amber `#F2C94C`, red `#EB5757`, plus orange `#FC7840` as a minor data accent.
- Type: Inter throughout (tight tracking, weights ≤600); JetBrains Mono reserved for IDs, serials, timestamps, and raw technical output.
- Existing components to compose with: `panel`, `kpi`/`stat` cards, `chip` (status), `drawer` (right side-sheet), `modal`, `tbl`, `tabs`, `fchip` filters, `search-mini`, `toast`, `topology`, timeline (`tl`), gauges.

**Existing asset data model (extend, don't fork):**
`tag, name, serial, model, category, status (ready | deployed | investigating | archived), assignee, location, cost, value, audit{due, date}, customFields{tNumber, hashNumber, star, sample, swVersion, variant, market, type}`.

**Two host platforms exist in the lab (visible across the screenshots):**
- **RichOS test benches** — Linux DUT side (`DISTRO=mbient`, `IMAGE_BASENAME=apricot-image-ui`, `MACHINE=binz`), exposing `df -h`, coredumps, build info, and `testbench_*` metrics. Hosts named like `x146, x178, x205…`.
- **Windows workers** — the automation PC side, exposing Windows CPU utilization/queue length, memory, NIC throughput, and `FS [OS(C:)]` space. Hosts named like `x231`.

A single Test Bench commonly pairs **one RichOS unit + one Windows worker** plus supporting assets. Design for both platform types.

---

## 2. Primary user and jobs-to-be-done

**Primary user:** Test Manager / HW lab engineer (the current "A. Kovalenko" persona).

They need to:
- Register and maintain accurate HW asset records.
- Assemble assets into a named, purpose-built **test bench** and record how the pieces fit together.
- Scan all benches and instantly see which are UP, DOWN, or recently failed.
- Open one bench to learn its purpose, ownership, composition, and live health — and diagnose a failure (disk full, collector down, coredumps) without opening Grafana.

---

## 3. Scope

**In scope (this pass):**
- Asset create form + asset edit form (with states).
- Test Bench data model and relationships to assets.
- Create/edit-bench flow.
- Bench **list** view with status (heatmap + table presentations).
- Bench **detail** view with overview, composition, telemetry, and diagnostics.
- All meaningful states (up/down/degraded/maintenance, empty, loading, error, validation).

**Out of scope (state explicitly in the design so it isn't expected):**
- Real backend, authentication, RBAC.
- Authoring Grafana alert rules / notification policies.
- Functional RDP (link affordance only).
- Long-range historical analytics beyond demo-grade charts.
- Mobile layouts beyond graceful narrow-width behaviour already in the prototype.

---

## 4. Information architecture

- Add **Test Benches** to the left nav under the *Operate* group (place it directly above *Assets*, since benches are the operator's primary working object and assets are their building blocks).
- Keep **Assets** where it is. Establish bidirectional links: an asset's detail shows the bench(es) it belongs to; a bench's composition links back to each asset's detail.
- **Bench detail is a full screen**, not a drawer — telemetry density requires the space. Use a header + sub-tabs pattern. Reserve the right-side drawer for *quick* asset peeks launched from within a bench.
- Mirror Grafana's cross-navigation: from a bench, offer quick jumps equivalent to "RichOS overview / Workers overview / Worker details / RDP server link," reframed as in-product navigation plus one external "Open in Grafana" affordance.

---

## 5. Feature A — Asset create & edit

Turn the thin "Register equipment" action into a complete authoring experience, and make "Edit" actually edit.

**Form (one shared layout for create and edit; edit is the same form prefilled):** organize into clear sections that mirror the lab's real Snipe-IT fields —

- **Identity:** Asset Tag (auto-suggested next value on create, editable; on edit, read-only or warn-on-change), Serial, Model (select + "create new model" inline), Category (select + "create new category" inline), Status (Ready to Deploy / Deployed / Investigating / Archived).
- **Assignment:** Default Location (select), Requestable (toggle).
- **Custom fields:** T Number, Hash Number, Type, STAR, Sample, SW Version, Variant, Market.
- **Optional information:** Asset Name, Warranty (months), Expected Checkin Date, Next Audit Date.
- **Media/notes:** Image upload affordance, Notes.

**Interaction pattern:** Use a **right-side authoring sheet** (wider variant of the existing drawer) for both create and edit, so the user keeps the registry list in context. Within the existing read-only asset drawer, the **Edit** button switches the same panel into editable fields (inline edit mode) rather than navigating away.

**Specify for every field:** label, control type, required vs optional, default, placeholder/helper text, and validation. Define these states explicitly:
- Empty create state.
- Inline validation errors (required missing, bad date, non-unique Asset Tag → duplicate warning).
- Unsaved-changes guard on close/navigate.
- Save success (toast + return to list/detail with the row updated) and save failure (retry).
- Edit entry points: pencil icon in the registry row **and** the Edit button in the detail drawer both reach the same edit mode.

---

## 6. Feature B — Test Benches

### 6.1 Concept and data model

A **Test Bench** is a named, purpose-built rig assembled from assets, bound to one or more monitored hosts that emit telemetry. Define a `TestBench` entity:

- **Identity & intent:** `id` (e.g. `TB-178`), `name`, `description / purpose`, `owner/creator`, `createdAt`, `lab/location`.
- **Binding:** `hosts[]` — each `{hostId (e.g. x178), platform (RichOS | Windows worker), rdpLink}`.
- **Status:** `status (Up | Down | Degraded | Maintenance)`, `richosState`, `lastChange` (e.g. "Down < 1 hour"), `lastPing (s)`.
- **Build (RichOS):** `{distro, distroVersion, buildTrack, imageBasename, machine, buildNumber, buildUrl, gitCommit}`.
- **Composition:** `assets[]` — each `{assetTag, role/slot, where (rack position / connection / port), isPrimaryDUT, state}`.
- **Telemetry snapshot:** `{cpuPct, memPct, diskPct, mem{used,total,available}, upTimeline[], cpuSeries[], memSeries[], diskSeries[], networkSeries[], coredumps[], dfTable[]}`.

**Relationship rule to decide and document:** is an asset *exclusive* to one active bench, or shareable? Recommended default — an asset belongs to **at most one active bench**; assigning it to a bench performs (or offers) a checkout via the existing flow, and surfaces a **conflict warning** if it's already committed elsewhere. (See Open Questions.)

### 6.2 Create / edit a test bench

Entry: **New test bench** primary CTA on the Test Benches list. Use a guided side-sheet (or 3-step flow) — same flow, prefilled, for edit:

1. **Identity:** name, purpose/description, owner (default = current user), location, and host binding (select RichOS host and/or Windows worker, platform auto-detected from selection).
2. **Compose assets:** searchable multi-select from the asset registry; for each chosen asset assign a **role/slot** and **where** (rack/port/connection), and mark the **primary DUT**. Show a live composition summary. Validate: at least one asset; warn on assets already bound to another active bench; offer to checkout selected assets to this bench.
3. **Review & create:** summary of identity + composition + binding → create → success toast → navigate to the new bench's detail.

### 6.3 Test Bench list view

- **Header KPIs:** mirror Grafana's at-a-glance counters as `stat` cards — **Benches UP**, **DOWN**, **Degraded**, **Maintenance** (reference: "Test benches UP 20 / DOWN 16"). Clickable to filter.
- **Two presentations with a toggle:**
  - **(a) Status heatmap (default)** — compact tiles, one per bench, showing `hostId` + state, colored green (Up) / red (Down) / **orange** (recently down, "< 1 hour") / amber (Degraded) / grey-blue (Maintenance). This is a direct translation of screenshot 1's RichOS grid — keep the dense, scannable grid but restyle to the Linear palette and rounded tiles. Tile click → bench detail.
  - **(b) Table** — name, id/host, status chip, owner, # assets, last ping, location, last updated; row actions (open, edit, RDP).
- **Controls:** status filters (`fchip`), search (name / host / owner), host-group filter. Empty state ("No test benches yet — create one from your assets") and loading skeletons.

### 6.4 Test Bench detail view (the core deliverable)

Full-page screen: **header + sub-tabs**.

- **Header:** bench name; host id badge(s); **status pill** with RichOS state and last-change ("Down < 1 hour"); **Last ping** single-stat; primary actions — Edit, RDP server link, Open in Grafana (external), Refresh + **time-range selector** ("Last 6 hours", mirroring Grafana); breadcrumb `Test Benches › [name]`.

- **Tab 1 — Overview** (answers *what is this bench, who made it, for what*): purpose/description, owner/creator, created date, location, platform(s), build summary, and a quick-health row of **CPU / MEM / DISK gauges**, the **up/down timeline**, last ping, coredump count, and any active alerts.

- **Tab 2 — Composition** (answers *which assets, and where*): the bench's assets with role/slot and physical "where," each linking to the asset's detail and showing a per-asset state chip + one inline metric. Include an optional small **wiring/topology diagram** (reuse the topology component) of how the assets connect. Selecting an asset opens its quick drawer or filters the Telemetry tab to that asset.

- **Tab 3 — Telemetry / Health** (answers *states of these assets — graphs, metrics, charts*): the Grafana panel set, reimplemented in the Linear chart style —
  - **Usage gauges:** CPU %, MEM %, DISK % with thresholds (≈ <70 green, 70–90 amber, >90 red; e.g. DISK 99% → red).
  - **Up chart:** binary Up/Down timeline (green when up; flag the collector-down case, `testbench_collector_up = No`).
  - **MEM usage:** multi-series (used / total / available).
  - **CPU usage:** RichOS `cpu_usage_percent`, or Windows CPU utilization + queue length depending on platform.
  - **Disk usage** and **Network usage** (per-interface bits sent — Intel I219-V, TP-LINK USB, Realtek 1G/10G on Windows workers).
  - Honour the header's time-range + refresh controls.

- **Tab 4 — Build & Diagnostics** (RichOS): **Build info** panel (DISTRO, version, build track, image basename, machine, build number, build URL, git commit), **Disk `df -h`** table (filesystem / size / used / avail / use% / mount — highlight ≥90% rows like `/dev/root 99%`), and **Coredump info** list (`trigger_*_COREDUMP` entries) with inspect/download affordances.

### 6.5 Telemetry data source & integration

**All telemetry is sourced from Grafana via API** (confirmed working assumption). The benches' gauges, charts, up/down state, build/`df`/coredump panels, and the list heatmap are *fed by Grafana* — the prototype does not own this data. This resolves the "embed vs. native" source question, but leaves **one visual decision you must make explicit**, because the two paths look materially different on screen:

- **Option A — query Grafana for raw series, render with the app's own chart style (recommended).** Pull time-series through Grafana's datasource/query API (querying the underlying Prometheus the screenshots imply: `testbench_cpu_usage_percent`, `testbench_memory_used_bytes`, `testbench_collector_up`, `testbench_disk_free_bytes`, the Windows `FS [OS(C:)]` series, etc.) and draw them with the Linear chart components below. Keeps the product visually one piece; Grafana stays the data backend, not the UI.
- **Option B — embed Grafana's rendered panels** (panel / `d-solo` iframe or render API). Fastest to wire and always in sync with source dashboards, but you inherit Grafana's visual language inside a Linear product — design the frame, header, theming, loading, and the seam carefully.

Design the telemetry components so the **header, controls, and states are identical** under either option, so the rendering choice can change without a redesign.

**Host & time mapping — use the real Grafana parameters.** The source dashboards are parameterised by host: the screenshots show `…/d/pimrx57/test-bench-details?var-host=x178` and `var-host=x231`. Wire the bench's `hostId` to Grafana's `var-host` template variable, the header **time-range** to Grafana's `from`/`to`, and the **refresh** control to Grafana's refresh interval (so "Last 6 hours" / "Refresh 30s" are functional, not decorative). The per-panel map below should resolve to specific Grafana panel IDs / PromQL queries at build time.

| Grafana panel / query | TestOps component | Notes |
|---|---|---|
| RichOS up/down grid | Status heatmap tiles | Up=green, Down=red, recent-down=orange, Degraded=amber, Maintenance=grey-blue |
| UP/DOWN counters | `stat` KPI cards | Clickable filters |
| CPU/MEM/DISK gauges | Radial gauge | Thresholded color; big number + label |
| MEM / CPU / Disk / Network charts | Line/area time-series | Linear axes, muted gridlines, legend, tooltip, shared time range |
| "Last ping: 36.6 s" | Single-stat tile | Green if recent; red if stale |
| Build info / df -h / coredumps | Monospace panels / table / list | Reserve JetBrains Mono; highlight thresholds |
| RDP server link | Secondary action button | Link affordance only |

Status must be conveyed by **icon/label + color**, never color alone.

---

## 7. States and edge cases to design

- **Down bench:** red status, **stale telemetry** marked "last seen …", root-cause hints (which asset/host failed, disk full, collector down, recent coredumps).
- **Degraded:** at least one asset down or a metric over threshold; amber status with the offending signal called out.
- **Maintenance:** manually set; suppresses alerting; visually distinct.
- **Collector down** (`testbench_collector_up = No`): telemetry panels show an explicit "no data / collector offline" empty state rather than blank charts.
- **Grafana API states:** query in-flight (skeleton), query failure / timeout (per-panel error with retry, not a dead chart), partial data (some series missing), no data for the selected time range, and auth/token expiry (re-auth affordance). These are now first-class states, since every chart depends on a live API call.
- **Conflict:** asset already bound to another active bench during composition.
- **Empty:** no benches; bench with no assets; asset in no bench.
- **Loading / error:** skeletons for list, grid, and charts; retry on telemetry fetch failure.
- **Create/edit validation:** duplicate bench name, duplicate host binding, missing assets.

---

## 8. Visual & interaction guidelines

- Stay strictly within the existing Linear tokens, type scale, and components; introduce **one** consistent chart style (axis, gridline, legend, tooltip) that matches the rest of the app.
- Reuse stat cards, filter chips, drawer, modal, toasts, tabs, table, and topology rather than new primitives.
- Keep motion subtle (existing transition timings).
- Accessibility: status color + label, visible focus, keyboard reachability, sufficient contrast on the heatmap tiles.

---

## 9. Deliverables

1. Updated left nav with **Test Benches**.
2. **Asset create + edit** authoring sheet with all field, validation, and save states.
3. **Test bench create/edit** guided flow.
4. **Bench list** — heatmap + table presentations, KPIs, filters, empty/loading.
5. **Bench detail** — Overview / Composition / Telemetry / Build & Diagnostics, with the telemetry component set.
6. Component specs for **gauge, time-series chart, up/down timeline, status heatmap tile, status pill**.
7. Target: extend the **existing single-file prototype** (dark Linear build) so the flows are clickable end-to-end, matching the current implementation conventions.

---

## 10. Acceptance criteria (definition of done)

- A user can create an asset and edit any existing asset, including custom fields, with validation and a save confirmation.
- A user can create a test bench by selecting assets, assigning each a role and physical location, and binding it to one or more hosts.
- The benches list shows every bench with an accurate Up/Down/Degraded/Maintenance status, scannable as a heatmap and as a table, with working filters and counts.
- Clicking a bench opens a detail view that states its purpose, creator, creation date, and location; lists its assets and where each sits; and shows live CPU/MEM/DISK, up/down, memory, disk, network, build info, `df -h`, and coredumps.
- Down/degraded/collector-offline states are visually unmistakable and point to a likely cause.
- Everything reads as the same product as the current Linear-styled prototype.

---