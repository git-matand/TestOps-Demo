import type { Role } from "./App";

// ─── Capability model (IMPROVEMENT_PLAN #13) ──────────────────────────────────
// 3 roles only — no separate Admin (Manager covers admin functions).
export type Capability =
  | "bench.telemetry.view"
  | "bench.firmware.flash"
  | "bench.maintenance"
  | "asset.checkout"
  | "asset.register"
  | "asset.transfer"
  | "campaign.edit"
  | "team.manage"
  | "center.manage"
  | "sharing.approve"
  | "sharing.request"
  | "integration.manage"
  | "admin.view";

const MANAGER: Capability[] = [
  "bench.telemetry.view", // read-only (view, no control buttons)
  "campaign.edit",
  "team.manage",
  "center.manage",
  "sharing.approve",
  "sharing.request",
  "integration.manage",
  "admin.view",
];

const HW_ENGINEER: Capability[] = [
  "bench.telemetry.view",
  "bench.firmware.flash",
  "bench.maintenance",
  "asset.checkout",
  "asset.register",
  "asset.transfer",
  "sharing.approve",
  "sharing.request",
];

const ENGINEER: Capability[] = [
  "bench.telemetry.view", // read-only
  "asset.checkout",
  "campaign.edit",
  "sharing.request",
];

const CAN: Record<Role, Set<Capability>> = {
  "manager": new Set(MANAGER),
  "hw-engineer": new Set(HW_ENGINEER),
  "engineer": new Set(ENGINEER),
};

export function can(role: Role, cap: Capability): boolean {
  return CAN[role].has(cap);
}

// Some capabilities mean "view but not control" for certain roles.
// Manager/Engineer can VIEW telemetry but cannot operate hardware.
export function canControlHardware(role: Role): boolean {
  return can(role, "bench.firmware.flash");
}

export const ROLE_LABELS: Record<Role, string> = {
  "manager": "Manager",
  "hw-engineer": "HW Engineer",
  "engineer": "Test Engineer",
};

// Short label for the "edit access" badge in the topbar.
export const ROLE_ACCESS_BADGE: Record<Role, string> = {
  "manager": "Oversight & approvals",
  "hw-engineer": "Hardware control",
  "engineer": "Test execution",
};
