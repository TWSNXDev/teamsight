import Link from "next/link";
import { BarChart3, MessageCircle, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DemoCta } from "@/components/demo-cta";

const features = [
  {
    icon: Users,
    title: "Real-time collaboration",
    description:
      "Everyone on the team sees additions, edits, and deletes the instant they happen — no refresh needed.",
  },
  {
    icon: MessageCircle,
    title: "AI-powered insights",
    description:
      "Generate a plain-language summary of recent sales, or ask follow-up questions in a live chat grounded in your real data.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access",
    description:
      "Admins see everything, managers see their team, viewers look but don't touch — enforced on every request.",
  },
  {
    icon: BarChart3,
    title: "Reports, exported",
    description:
      "Turn any view into a branded PDF report in one click, ready to share with stakeholders.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border/70">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
              T
            </span>
            Teamsight
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              nativeButton={false}
              render={<Link href="/login">Sign in</Link>}
            />
            <Button nativeButton={false} render={<Link href="/register">Get started</Link>} />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-28">
          <span className="mx-auto mb-6 inline-flex w-fit items-center rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            Real-time sales analytics
          </span>
          <h1 className="mx-auto max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            One shared view of your sales, updated the moment it changes.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Teamsight keeps your sales team on the same page — literally. Log deals, watch
            teammates update the board live, and let AI explain what&apos;s driving the numbers.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="/register">Get started free</Link>}
            />
            <DemoCta />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description }) => (
              <Card key={title}>
                <CardContent className="flex flex-col gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70 py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
          Built for sales teams who need one source of truth.
        </div>
      </footer>
    </div>
  );
}
