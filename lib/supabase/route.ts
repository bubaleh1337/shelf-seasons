import "server-only";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSupabaseConfig } from "./config";
import type { Database } from "./database.types";

type PendingCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

export function createRouteClient(request: NextRequest) {
  const { supabaseUrl, supabasePublishableKey } = getSupabaseConfig();
  let currentCookies = request.cookies.getAll().map(({ name, value }) => ({
    name,
    value,
  }));
  let pendingCookies: PendingCookie[] = [];

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookies: {
        getAll: () => currentCookies,
        setAll: (cookiesToSet) => {
          const nextPending = new Map(
            pendingCookies.map((cookie) => [cookie.name, cookie]),
          );
          cookiesToSet.forEach((cookie) => nextPending.set(cookie.name, cookie));
          pendingCookies = [...nextPending.values()];
          const updates = new Map(
            cookiesToSet.map(({ name, value }) => [name, value]),
          );
          currentCookies = [
            ...currentCookies.filter(({ name }) => !updates.has(name)),
            ...cookiesToSet.map(({ name, value }) => ({ name, value })),
          ];
        },
      },
    },
  );

  function redirect(url: string | URL) {
    const response = NextResponse.redirect(url);
    pendingCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
    return response;
  }

  return { supabase, redirect };
}
