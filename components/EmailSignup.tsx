"use client";

import { useRef, useState } from "react";

type Status = "idle" | "loading" | "ok" | "error";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setStatus("error");
      setMessage("Bitte eine gültige E-Mail-Adresse eingeben.");
      return;
    }

    // parallele Submits abbrechen
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
        signal: ctrl.signal,
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };

      if (!res.ok) {
        throw new Error(data?.error ?? "Anmeldung fehlgeschlagen.");
      }

      setStatus("ok");
      setMessage(data.message ?? "Danke! Wir melden uns zum Launch.");
      setEmail("");
    } catch (err: unknown) {
      // Abbruch durch erneuten Klick?
      if (
        err &&
        typeof err === "object" &&
        "name" in err &&
        (err as { name?: string }).name === "AbortError"
      ) {
        return;
      }
      const msg =
        err instanceof Error
          ? err.message
          : "Unerwarteter Fehler. Bitte später erneut versuchen.";
      setStatus("error");
      setMessage(msg);
    } finally {
      abortRef.current = null;
    }
  }

  const isLoading = status === "loading";
  const isInvalid = email !== "" && !EMAIL_RE.test(email.trim());

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col sm:flex-row gap-3 sm:items-center">
      <label htmlFor="email" className="sr-only">
        E-Mail-Adresse
      </label>

      <input
        id="email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        aria-invalid={isInvalid || undefined}
        aria-describedby="email-help"
        placeholder="deine.email@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full sm:w-80 rounded-button border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
      />

      <button
        type="submit"
        disabled={isLoading || isInvalid || email.trim() === ""}
        className="inline-flex items-center justify-center rounded-button bg-gray-900 text-white px-5 py-3 font-medium disabled:opacity-70"
      >
        {isLoading ? "Sende…" : "Early-Access sichern"}
      </button>

      <p id="email-help" className="sr-only">
        Gib deine E-Mail-Adresse ein, um benachrichtigt zu werden.
      </p>

      {message && (
        <p className={`text-sm mt-1 ${status === "ok" ? "text-green-700" : "text-red-700"}`}>
          {message}
        </p>
      )}
    </form>
  );
}
