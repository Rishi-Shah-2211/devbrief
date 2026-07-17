import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";

/** Marketing pages keep the editorial header and colophon footer. */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
