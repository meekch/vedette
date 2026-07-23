import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

// Public landing page (marketing route group). Phase 1: a thin, honest
// explanation of the product with an entry point into the workspace.
// Auth controls (sign in / sign up) are wired in when Clerk is installed.
export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-full max-w-5xl flex-col px-6">
      <header className="flex items-center justify-between py-6">
        <span className="text-lg font-semibold tracking-tight">Vedette</span>
        <nav className="flex items-center gap-2">
          {/* Clerk sign-in / sign-up controls slot in here (Phase 1, step 2). */}
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Open workspace
          </Link>
        </nav>
      </header>

      <section className="flex flex-1 flex-col justify-center py-16">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          AI Transformation Intelligence
        </p>
        <h1 className="mt-4 max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          See where AI creates measurable value — with the evidence to prove it.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Vedette is deployed forward into an organization&rsquo;s documents,
          workflows, and people. It runs guided discovery, scores AI
          opportunities against visible evidence, models ROI you can inspect,
          and produces executive-ready deliverables — never from thin air.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/dashboard" className={buttonVariants({ size: "lg" })}>
            Enter the demo workspace
          </Link>
          <Link
            href="/documents"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Browse the knowledge base
          </Link>
        </div>
      </section>

      <footer className="border-t py-6 text-sm text-muted-foreground">
        Demo engagement: Meridian Field Services (fictional). Built for Forward
        Deployed Engineers and the executives they present to.
      </footer>
    </main>
  );
}
