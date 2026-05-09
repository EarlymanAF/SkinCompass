// ⚠️ DEV ONLY — Diese Seite existiert nur in development.
import { signIn } from "@/auth";
import { redirect } from "next/navigation";

const DEV_STEAM_ID = "76561198082406752";

async function devLoginAction() {
  "use server";
  if (process.env.NODE_ENV !== "development") {
    redirect("/");
  }
  await signIn("dev-steam", { steamId: DEV_STEAM_ID, redirectTo: "/inventory" });
}

export default function DevLoginPage() {
  if (process.env.NODE_ENV !== "development") {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-sm rounded-2xl border border-amber-300 bg-amber-50 p-8 shadow-lg">
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-amber-600">
          ⚠️ Development Only
        </p>
        <h1 className="mb-4 text-xl font-bold text-gray-900">Dev Steam Login</h1>
        <p className="mb-6 text-sm text-gray-600">
          Loggt als{" "}
          <span className="font-mono font-semibold">{DEV_STEAM_ID}</span> ein — ohne Steam-Redirect.
        </p>
        <form action={devLoginAction}>
          <button
            type="submit"
            className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-700"
          >
            Als Rethul einloggen →
          </button>
        </form>
      </div>
    </main>
  );
}
