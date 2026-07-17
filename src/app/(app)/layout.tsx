import { AppShell } from "@/components/site/AppShell";

/** Product pages live inside the console shell. */
export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
