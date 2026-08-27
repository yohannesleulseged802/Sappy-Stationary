export type Role = "owner" | "manager" | "staff";

const PERMS: Record<Role, string[]> = {
  owner: ["*"],
  manager: ["sales", "inventory", "inventory.edit", "reports", "credits", "expenses", "purchases", "users.view", "activity"],
  staff: ["sales", "inventory", "inventory.add", "credits", "expenses", "activity"],
};

export function can(role: string, action: string): boolean {
  const p = PERMS[(role as Role)] || PERMS.staff;
  return p.includes("*") || p.includes(action);
}

export const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  manager: "Manager",
  staff: "Staff",
};

export const ROLE_HINT: Record<string, string> = {
  owner: "Everything: users, promotion, resets, master code, all modules.",
  manager: "All modules + edit/delete stock + reports. Cannot manage users or resets.",
  staff: "Sales, add stock, credits and expenses. No deletes, no reports.",
};