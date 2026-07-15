import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/ComingSoon";

export const metadata: Metadata = {
  title: "Showcase — DevBrief",
  description: "Pre-analyzed briefs for well-known open-source repositories.",
};

export default function ShowcasePage() {
  return (
    <ComingSoon
      title="Showcase gallery"
      blurb="Instant, pre-computed briefs for famous open-source repositories — so you can see the full experience without spending a single token. Landing here soon."
    />
  );
}
