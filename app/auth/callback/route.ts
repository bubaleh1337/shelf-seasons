import { NextRequest, NextResponse } from "next/server";
import { parseLocale, safeAppPath } from "@/lib/auth/redirect";

export function GET(request: NextRequest) {
  const locale = parseLocale(request.nextUrl.searchParams.get("locale"));
  const next = safeAppPath(request.nextUrl.searchParams.get("next"), locale);
  const completeUrl = new URL("/auth/complete", request.nextUrl.origin);
  completeUrl.searchParams.set("locale", locale);
  completeUrl.searchParams.set("next", next);

  const code = request.nextUrl.searchParams.get("code");
  const providerError = request.nextUrl.searchParams.get("error");
  if (code) completeUrl.searchParams.set("code", code);
  if (providerError) completeUrl.searchParams.set("error", providerError);

  return NextResponse.redirect(completeUrl);
}
