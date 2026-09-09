import "server-only";

import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type RateLimitBucket = "book-search" | "book-write" | "cover-repair";

export async function rateLimitResponse(
  supabase: SupabaseClient<Database>,
  bucket: RateLimitBucket,
  maxRequests: number,
  windowSeconds: number,
) {
  const { data, error } = await supabase.rpc("consume_rate_limit", {
    p_bucket: bucket,
    p_max_requests: maxRequests,
    p_window_seconds: windowSeconds,
  });

  if (error || !data?.[0]) {
    return NextResponse.json(
      { error: "rate_limit_unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "60" } },
    );
  }

  const result = data[0];
  if (result.allowed) return null;

  return NextResponse.json(
    { error: "too_many_requests" },
    {
      status: 429,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": String(Math.max(1, result.retry_after_seconds)),
      },
    },
  );
}
