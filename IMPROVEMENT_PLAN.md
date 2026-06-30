✅ DONE (fully, or sufficiently for the demo)

#10 — Light/Dark mode
Status: Done. (100%)
CSS variables for both themes, toggle in the sidebar (moon/sun). Works across the entire app.

#9 — Asset licenses
Status: Done. (100%)
The Assets section has a "Licenses" tab: software name, vendor, total/assigned seats, expiry date, center assignment, color indicators for validity period (expired/expiring soon). There's an "Add license" button (toast placeholder).

#5 — Test Team Management
Status: Done (100%).
Full CRUD: team cards, builder modal for creating/editing, assigning engineers with roles (Lead/Engineer/Tester/Reviewer/Support), linking to a Test Center, availability indicators. The only thing missing is linking a team to a specific Bench (currently only to a Center).



----------------------------------


🟡 PARTIALLY DONE

#1 — Test Center as an object
Status: ~70% done.

✅ There's a 5-step wizard for creating a Center (name, city, country, address → assign benches → assign assets → assign people → summary)
✅ Detail view with map, list of benches, assets, team
❌ Editing an existing Center is missing (creation only)
❌ Deleting a Center — none
❌ The "beds" field at the Center level isn't broken out (beds live at the bench level)

#2 — Geographic map
Status: ~60% done.

✅ MapView.tsx implemented via react-simple-maps — world map with pins for each Test Center
✅ Pins show availability%, utilization%, number of campaigns, status (green/yellow/red), tooltip on hover
❌ Interactivity is limited: there's no navigation to a detail view when clicking a pin (or it's implemented via toast)
❌ Only 3 hardcoded centers, coordinates are static

#3 — Multi-center aggregated dashboard
Status: ~50% done.

✅ The Dashboard has a center filter (All Centers / Munich / Stuttgart / Warsaw) with aggregated KPIs
✅ "All Centers" mode shows the combined picture
❌ No multi-select on the Dashboard — you can select only one center OR all; you can't select "Munich + Warsaw" at the same time
❌ No side-by-side comparison of centers

#4 — Test Center-level KPI view
Status: ~55% done.

✅ The Test Center detail view exists: bench health status, asset composition, people, teams
✅ Bench utilization is displayed
❌ No aggregated "cost vs. efficiency" KPI at the center level
❌ No Health Score as a numeric metric
❌ Drill-down from KPI into a list of problem objects — weak

#7 — Asset reassignment between centers
Status: ~50% done.

✅ Assets has a reassignTag — a modal for choosing a new Test Center for an asset
✅ The UI shows the current location and allows selecting a new one
❌ Movement history isn't tracked
❌ No bulk reassignment (one at a time only)
❌ Benches don't move between centers

#8 — Bidirectional API
Status: ~20% done (UI placeholder).

✅ SyncModal.tsx — a modal for importing assets from an external system with progress and a result ("3 imported, 2 updated, 2 conflicts")
✅ "Sync" button in Assets with a simulated process
❌ No real backend/API
❌ No export back to Grafana/Jira
❌ No per-customer source configuration

#12 — AI-driven campaign simulation
Status: ~30% done (UI without logic).

✅ AI Chat implemented with suggestions and scripted responses about cost, risk, availability, predictions
✅ Visually convincing for a demo
❌ No real campaign simulation — all responses are hardcoded
❌ No input of simulation parameters (which center, which resources, time range)
❌ No calculation of cost, timeline, or team recommendations

#13 — Role-based views
Status: ~40% done.

✅ Demo panel at the bottom of the sidebar: Manager / HW Eng / Engineer switcher
✅ Dashboard hides the heatmap + detailed views for the Manager role
✅ BenchDetail hides the Telemetry and Build & Diagnostics tabs for Manager
❌ The Engineer role doesn't provide a noticeably different experience from HW Eng
❌ Users & Audit, Assets, Campaigns — not adapted for roles
❌ No permission separation (what you can do, not just what you can see)



----------------------------------



❌ NOT DONE

#6 — Cross-center resource sharing
Status: Not implemented.
There's no mechanism for "an engineer from Munich uses equipment in Warsaw." No UI for requesting/granting resources between centers.

#11 — Custom branding / white labeling
Status: Not implemented.
Logo and name are hardcoded ("TestOps PLATFORM", "SPYROSOFT GROUP"). No brand settings in the Admin section.
