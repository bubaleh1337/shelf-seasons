"use client";

import Link from "next/link";
import { Layers3, Sparkles, Settings, ChevronRight } from "lucide-react";
import { appCopy } from "@/lib/app-copy";
import type { Locale } from "@/lib/shelf-seasons";

export function MorePage({ locale }: { locale: Locale }) {
  const c = appCopy[locale];
  return <section className="clubs-page">
    <div className="clubs-heading"><div><h1>{c.more}</h1><p>{c.moreLead}</p></div></div>
    <nav className="club-more-list" aria-label={c.more}>
      {([
        { href: "series", title: c.series, Icon: Layers3 },
        { href: "recaps", title: c.recaps, Icon: Sparkles },
        { href: "settings", title: c.settings, Icon: Settings },
      ] as const).map(({ href, title, Icon }) => <Link key={href} href={`/${locale}/app/${href}`}><Icon /><span>{title}</span><ChevronRight /></Link>)}
    </nav>
  </section>;
}
