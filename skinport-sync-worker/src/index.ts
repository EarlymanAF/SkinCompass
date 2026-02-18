export interface Env {
  SUPABASE_FUNCTION_URL: string; // https://<ref>.functions.supabase.co/sync_skinport
  SUPABASE_SERVICE_ROLE_KEY: string; // Secret
  SKINPORT_SYNC_KV: KVNamespace;
  BATCH_LIMIT?: string; // optional: "200"
  MAX_BATCHES_PER_RUN?: string; // optional: "15"
}

type SyncResponse = {
  stage: string;
  message?: string;
  upserted_rows?: number;
  total_items?: number;
  processed_batch?: number;
  offset?: number;
  limit?: number;
  next_offset?: number | null;
  skipped_no_variant?: number;
  skipped_samples?: Array<{ name: string; version: string | null }>;
};

type BatchSummary = {
  started_offset: number;
  limit: number;
  maxBatches: number;
  batches_run: number;
  total_upserted: number;
  total_skipped: number;
  last_next_offset: number | null;
  total_items: number | null;
  errors: string[];
  finished: boolean;
  final_offset: number;
};

const KV_OFFSET_KEY = "skinport_sync_offset";
const KV_LAST_RESULT_KEY = "skinport_sync_last_result";

function toInt(v: string | undefined, fallback: number) {
  const n = Number.parseInt(v ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function isObjectRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function asSyncResponse(x: unknown): SyncResponse | null {
  if (!isObjectRecord(x)) return null;
  const stage = typeof x.stage === "string" ? x.stage : null;
  if (!stage) return null;
  // wir akzeptieren den Rest optional
  return x as SyncResponse;
}

async function callSupabaseSync(env: Env, limit: number, offset: number): Promise<SyncResponse> {
  const url = new URL(env.SUPABASE_FUNCTION_URL);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ source: "cloudflare-worker" }),
  });

  const text = await res.text();

  let parsed: unknown = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = null;
  }

  if (!res.ok) {
    const body = parsed ?? text.slice(0, 800);
    throw new Error(`Supabase sync call failed: status=${res.status} body=${JSON.stringify(body)}`);
  }

  const json = asSyncResponse(parsed);
  if (!json) {
    throw new Error(`Supabase sync returned unexpected JSON: ${text.slice(0, 800)}`);
  }

  return json;
}

async function sleep(ms: number) {
  await new Promise<void>((r) => setTimeout(r, ms));
}

async function runBatches(env: Env): Promise<BatchSummary> {
  const limit = toInt(env.BATCH_LIMIT, 200);
  const maxBatches = toInt(env.MAX_BATCHES_PER_RUN, 15);

  const stored = await env.SKINPORT_SYNC_KV.get(KV_OFFSET_KEY);
  let offset = stored ? Number.parseInt(stored, 10) : 0;
  if (!Number.isFinite(offset) || offset < 0) offset = 0;

  const summaryBase = {
    started_offset: offset,
    limit,
    maxBatches,
    batches_run: 0,
    total_upserted: 0,
    total_skipped: 0,
    last_next_offset: null as number | null,
    total_items: null as number | null,
    errors: [] as string[],
  };

  for (let i = 0; i < maxBatches; i++) {
    let data: SyncResponse;

    try {
      data = await callSupabaseSync(env, limit, offset);
    } catch (e) {
      summaryBase.errors.push(e instanceof Error ? e.message : String(e));
      await sleep(800);
      try {
        data = await callSupabaseSync(env, limit, offset);
      } catch (e2) {
        summaryBase.errors.push(e2 instanceof Error ? e2.message : String(e2));
        return { ...summaryBase, finished: false, final_offset: offset };
      }
    }

    summaryBase.batches_run++;
    summaryBase.total_upserted += data.upserted_rows ?? 0;
    summaryBase.total_skipped += data.skipped_no_variant ?? 0;
    summaryBase.total_items = data.total_items ?? summaryBase.total_items;

    const next = data.next_offset ?? null;
    summaryBase.last_next_offset = next;

    await env.SKINPORT_SYNC_KV.put(KV_LAST_RESULT_KEY, JSON.stringify(data), {
      expirationTtl: 60 * 60 * 24 * 7,
    });

    if (next === null) {
      await env.SKINPORT_SYNC_KV.put(KV_OFFSET_KEY, "0");
      return { ...summaryBase, finished: true, final_offset: 0 };
    }

    offset = next;
    await env.SKINPORT_SYNC_KV.put(KV_OFFSET_KEY, String(offset));

    await sleep(250);
  }

  return { ...summaryBase, finished: false, final_offset: offset };
}

const worker: ExportedHandler<Env> = {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (url.pathname === "/status") {
      const offset = (await env.SKINPORT_SYNC_KV.get(KV_OFFSET_KEY)) ?? "0";
      const last = await env.SKINPORT_SYNC_KV.get(KV_LAST_RESULT_KEY);
      return new Response(
        JSON.stringify(
          {
            offset: Number.parseInt(offset, 10) || 0,
            last_result: last ? JSON.parse(last) : null,
          },
          null,
          2
        ),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    if (url.pathname === "/run") {
      const result = await runBatches(env);
      return new Response(JSON.stringify(result, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },

  async scheduled(_event, env, ctx) {
    ctx.waitUntil(runBatches(env));
  },
};

export default worker;
