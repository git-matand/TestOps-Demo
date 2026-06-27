import { createContext, useContext } from "react";
import type { Role } from "./App";
import { can, canControlHardware, type Capability } from "./permissions";

export const RoleContext = createContext<Role>("manager");

export function useRole() {
  const role = useContext(RoleContext);
  return {
    role,
    can: (cap: Capability) => can(role, cap),
    canControlHardware: canControlHardware(role),
  };
}
