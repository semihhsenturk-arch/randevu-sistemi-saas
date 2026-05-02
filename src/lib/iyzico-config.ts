export const PLAN_PRICES = {
  starter: { monthly: 999, yearly: 9590, name: "Starter" },
  professional: { monthly: 1999, yearly: 19190, name: "Professional" },
  advanced: { monthly: 2999, yearly: 28790, name: "Advanced" },
} as const;

export type PlanType = keyof typeof PLAN_PRICES;
export type BillingCycle = "monthly" | "yearly";
