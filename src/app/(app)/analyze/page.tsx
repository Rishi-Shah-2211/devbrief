import type { Metadata } from "next";
import { DevBriefApp } from "@/components/DevBriefApp";

export const metadata: Metadata = {
  title: "Analyze — DevBrief",
  description: "Paste a public GitHub repository and watch AI agents build an onboarding brief.",
};

export default function AnalyzePage() {
  return <DevBriefApp />;
}
