import { BarChart3, Users, Sparkles } from "lucide-react";

const features = [
  { icon: Users, text: "See every teammate's changes the instant they happen" },
  { icon: Sparkles, text: "Ask an AI assistant to explain what's driving your numbers" },
  { icon: BarChart3, text: "Role-based access keeps each team's data in the right hands" },
];

export function AuthBranding() {
  return (
    <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, color-mix(in oklch, var(--primary-foreground) 18%, transparent) 0%, transparent 55%), radial-gradient(circle at 85% 85%, color-mix(in oklch, var(--primary-foreground) 14%, transparent) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 flex items-center gap-2 text-lg font-semibold tracking-tight">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/15 font-bold">
          T
        </span>
        Teamsight
      </div>

      <div className="relative z-10 flex flex-col gap-8">
        <h1 className="max-w-sm text-3xl leading-tight font-semibold text-balance">
          One shared view of your sales, updated the moment it changes.
        </h1>
        <ul className="flex flex-col gap-4">
          {features.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3 text-sm text-primary-foreground/85">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary-foreground/15">
                <Icon className="h-3.5 w-3.5" />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>

      <p className="relative z-10 text-xs text-primary-foreground/60">
        Built for sales teams who need one source of truth.
      </p>
    </div>
  );
}
