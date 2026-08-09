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
          workflows, and people. It scores AI opportunities against evidence you
          can click through to the source text, and models ROI in deterministic
          code — the model proposes hours and headcount, never dollars.
        </p>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          The demo runs a fictional engagement end to end: seven opportunities
          scored by <code className="font-mono">claude-opus-5</code> over 26
          document chunks, each score traceable to its source, each ROI figure
          recalculating as you edit its assumptions.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/opportunities" className={buttonVariants({ size: "lg" })}>
            Explore the Meridian demo →
          </Link>
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Engagement dashboard
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
