import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const locale = request.nextUrl.pathname.split("/")[1];
  requestHeaders.set("x-shelf-locale", locale === "en" ? "en" : "ru");

  if (request.nextUrl.pathname.startsWith("/auth/")) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }
  return updateSession(request, requestHeaders);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
