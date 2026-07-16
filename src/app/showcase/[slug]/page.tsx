import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BriefView } from "@/components/BriefView";
import { getShowcaseEntry, SHOWCASE } from "@/lib/showcase";

export function generateStaticParams() {
  return SHOWCASE.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const entry = getShowcaseEntry((await params).slug);
  return {
    title: entry ? `${entry.repo} — DevBrief` : "Showcase — DevBrief",
    description: entry?.description ?? undefined,
  };
}

export default async function ShowcaseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const entry = getShowcaseEntry((await params).slug);
  if (!entry) notFound();

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
      <Link href="/showcase" className="text-sm text-[var(--color-faint)] hover:text-[var(--color-text)]">
        ← Showcase
      </Link>
      <div className="mt-6">
        <BriefView
          result={{
            repo: entry.repo,
            description: entry.description,
            brief: entry.brief,
            tokensUsed: entry.tokensUsed,
            analytics: entry.analytics,
          }}
        />
      </div>
    </main>
  );
}
