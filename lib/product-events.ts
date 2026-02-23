import { createClient } from "@supabase/supabase-js";
import {
  PRODUCT_EVENT_NAMES,
  type ProductEvent,
  type ProductEventName,
  type ProductEventProps,
} from "@/lib/types";

const EVENT_NAME_SET = new Set<ProductEventName>(PRODUCT_EVENT_NAMES);
const MAX_TEXT_LENGTH = 160;
const MAX_PROP_KEY_LENGTH = 64;
const MAX_PROP_VALUE_LENGTH = 240;
const MAX_PROPS_BYTES = 8_000;

type ProductEventInsert = {
  event_name: ProductEventName;
  session_id: string | null;
  user_id: string | null;
  page: string | null;
  props: ProductEventProps;
  created_at?: string;
};

type ProductEventInput = {
  eventName?: unknown;
  sessionId?: unknown;
  userId?: unknown;
  page?: unknown;
  props?: unknown;
  createdAt?: unknown;
};

function asTrimmedText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized) return null;
  return normalized.slice(0, maxLength);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeProps(raw: unknown): ProductEventProps {
  if (!isObject(raw)) return {};

  const props: ProductEventProps = {};
  for (const [keyRaw, value] of Object.entries(raw)) {
    const key = keyRaw.trim().slice(0, MAX_PROP_KEY_LENGTH);
    if (!key) continue;

    if (typeof value === "string") {
      props[key] = value.slice(0, MAX_PROP_VALUE_LENGTH);
      continue;
    }

    if (typeof value === "number") {
      if (!Number.isFinite(value)) continue;
      props[key] = value;
      continue;
    }

    if (typeof value === "boolean" || value === null) {
      props[key] = value;
    }
  }

  const encoded = JSON.stringify(props);
  if (encoded.length > MAX_PROPS_BYTES) {
    return { truncated: true };
  }

  return props;
}

function normalizeCreatedAt(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const timestamp = value.trim();
  if (!timestamp) return null;
  const parsed = new Date(timestamp);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function isProductEventName(value: string): value is ProductEventName {
  return EVENT_NAME_SET.has(value as ProductEventName);
}

export function normalizeProductEvent(input: unknown): ProductEvent | null {
  if (!isObject(input)) return null;

  const source = input as ProductEventInput;
  if (typeof source.eventName !== "string") return null;
  if (!isProductEventName(source.eventName)) return null;

  const normalized: ProductEvent = {
    eventName: source.eventName,
    sessionId: asTrimmedText(source.sessionId, MAX_TEXT_LENGTH),
    userId: asTrimmedText(source.userId, MAX_TEXT_LENGTH),
    page: asTrimmedText(source.page, MAX_TEXT_LENGTH),
    props: sanitizeProps(source.props),
    createdAt: normalizeCreatedAt(source.createdAt),
  };

  return normalized;
}

function toInsertPayload(event: ProductEvent): ProductEventInsert {
  const payload: ProductEventInsert = {
    event_name: event.eventName,
    session_id: asTrimmedText(event.sessionId, MAX_TEXT_LENGTH),
    user_id: asTrimmedText(event.userId, MAX_TEXT_LENGTH),
    page: asTrimmedText(event.page, MAX_TEXT_LENGTH),
    props: sanitizeProps(event.props),
  };

  const createdAt = normalizeCreatedAt(event.createdAt);
  if (createdAt) {
    payload.created_at = createdAt;
  }

  return payload;
}

function getEventsClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE URL oder serverseitiger Key fehlen für Product Events.");
  }

  return createClient(url, key);
}

export async function insertProductEvent(event: ProductEvent): Promise<void> {
  const supabase = getEventsClient();
  const payload = toInsertPayload(event);

  const { error } = await supabase.from("product_events").insert(payload);
  if (error) {
    throw new Error(`Product event insert failed: ${error.message}`);
  }
}

export async function insertProductEventSafe(event: ProductEvent): Promise<void> {
  try {
    await insertProductEvent(event);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Product event tracking failed:", message);
  }
}
