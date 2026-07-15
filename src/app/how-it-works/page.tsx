import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/ComingSoon";

export const metadata: Metadata = {
  title: "How it works — DevBrief",
  description: "The engineering behind DevBrief's multi-agent orchestration.",
};

export default function HowItWorksPage() {
  return (
    <ComingSoon
      title="How it works"
      blurb="A deep dive into the orchestration engine — parallel agents, the critic feedback loop, cost-aware model routing, and grounded citations. Full write-up coming soon."
    />
  );
}
