export type Stage = "new" | "assigned" | "quote_sent" | "deposit_paid" | "site_survey" | "installation" | "completed";

export const STAGES: { id: Stage; label: string; description: string }[] = [
  { id: "new", label: "Signed up", description: "We're matching you with a solar expert." },
  { id: "assigned", label: "Expert assigned", description: "Your expert is reviewing your calculation." },
  { id: "quote_sent", label: "Quote ready", description: "Review your quote and pay the deposit to book installation." },
  { id: "deposit_paid", label: "Deposit paid", description: "Payment confirmed. We're scheduling your site survey." },
  { id: "site_survey", label: "Site survey", description: "Our engineers confirm the roof, wiring and mounting plan." },
  { id: "installation", label: "Installation", description: "Your system is being installed and tested." },
  { id: "completed", label: "Completed", description: "Your system is live. Welcome to uninterrupted power." },
];

export const stageIndex = (s: Stage) => STAGES.findIndex((x) => x.id === s);
export const stageLabel = (s: Stage) => STAGES[stageIndex(s)].label;

// Stages a rep may move a customer to by hand. `deposit_paid` is only ever set by the payment webhook.
export const REP_NEXT_STAGE: Partial<Record<Stage, Stage>> = {
  deposit_paid: "site_survey",
  site_survey: "installation",
  installation: "completed",
};
