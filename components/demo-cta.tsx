"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth-client";

const DEMO_EMAIL = "viewer.north@teamsight.dev";
const DEMO_PASSWORD = "password123";

export function DemoCta() {
  const [loading, setLoading] = useState(false);

  async function handleDemo() {
    setLoading(true);
    const { error } = await signIn.email({ email: DEMO_EMAIL, password: DEMO_PASSWORD });

    if (error) {
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <Button variant="outline" size="lg" onClick={handleDemo} disabled={loading}>
      {loading ? "Loading demo..." : "Try live demo"}
    </Button>
  );
}
