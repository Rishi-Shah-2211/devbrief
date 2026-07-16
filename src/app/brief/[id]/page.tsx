import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { BriefView } from "@/components/BriefView";
import { briefs } from "@/db/schema";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

async function loadBrief(id: string) {
  const db = getDb();
  if (!db) return null;
  const rows = await db.select().from(briefs).where(eq(briefs.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const row = await loadBrief((await params).id).catch(() => null);
  return {
    title: row ? `${row.repo} — DevBrief` : "Brief — DevBrief",
    description: row?.description ?? "A shared DevBrief onboarding brief.",
  };
}

export default async function BriefPage({ params }: { params: Promise<{ id: string }> }) {
  const row = await loadBrief((await params).id).catch(() => null);
  if (!row) notFound();

  return (
    <main className="mx-auto w-full max-w-[1440px] px-6 py-16 sm:py-20">
      <div className="mb-6 flex items-center justify-between text-sm">
        <span className="text-[var(--color-faint)]">
          Shared brief · {row.createdAt.toISOString().slice(0, 10)}
        </span>
        <Link href="/analyze" className="text-[var(--color-wine)] hover:underline">
          Analyze your own repo →
        </Link>
      </div>
      <BriefView
        result={{
          repo: row.repo,
          description: row.description,
          brief: row.brief,
          tokensUsed: row.tokensUsed,
          analytics: row.analytics,
        }}
      />
    </main>
  );
}
