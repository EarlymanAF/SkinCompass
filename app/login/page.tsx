"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  if (value === "/login" || value.startsWith("/api/auth")) {
    return "/";
  }
  return value;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const nextPath = getSafeNextPath(searchParams.get("next"));

  async function handleSignIn() {
    setIsLoading(true);
    await signIn("steam", { callbackUrl: nextPath });
    setIsLoading(false);
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-180px)] w-full max-w-md items-center px-6 py-10">
      <section className="w-full rounded-[24px] border border-border bg-surface p-8 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">SkinCompass</p>
        <h1 className="mt-3 text-2xl font-semibold text-foreground">Mit Steam anmelden</h1>
        <p className="mt-2 text-sm text-secondary">
          Logge dich mit deinem Steam Account ein, um dein Dashboard, Inventar und Einstellungen zu
          nutzen.
        </p>

        <button
          type="button"
          onClick={handleSignIn}
          disabled={isLoading}
          className="mt-6 w-full rounded-button bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
        >
          {isLoading ? "Weiterleitung..." : "Mit Steam anmelden"}
        </button>

        <p className="mt-4 text-xs text-muted">
          Du wirst zu Steam weitergeleitet und danach wieder sicher zu SkinCompass zurückgebracht.
        </p>

        <div className="mt-6 border-t border-border pt-4 text-xs text-muted">
          <Link href="/landing" className="font-medium text-foreground hover:underline">
            Zur öffentlichen Landing Page
          </Link>
        </div>
      </section>
    </main>
  );
}

function LoginFallback() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-180px)] w-full max-w-md items-center px-6 py-10">
      <section className="w-full rounded-[24px] border border-border bg-surface p-8 shadow-card">
        <p className="text-sm text-secondary">Lade Anmeldung...</p>
      </section>
    </main>
  );
}
