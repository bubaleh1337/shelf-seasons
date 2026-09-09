import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig, isSupabaseConfigured } from "./config";
import type { Database } from "./database.types";

export async function updateSession(request: NextRequest, requestHeaders = new Headers(request.headers)) {
  if (!isSupabaseConfigured) return NextResponse.next({ request: { headers: requestHeaders } });

  const { supabaseUrl, supabasePublishableKey } = getSupabaseConfig();
  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  await supabase.auth.getClaims();
  return response;
}
