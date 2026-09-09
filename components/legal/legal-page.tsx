import Link from "next/link";
import { BookOpen } from "lucide-react";
import { legalCopy } from "@/lib/legal/copy";
import type { Locale } from "@/lib/shelf-seasons";

export function LegalPage({ locale, document }: { locale: Locale; document: "privacy" | "terms" }) {
  const c = legalCopy[locale];
  const content = c[document];

  return (
    <main className="legal-page" lang={locale}>
      <article className="legal-card">
        <Link href={`/${locale}/sign-in`} className="auth-brand legal-brand">
          <span className="brand-mark" aria-hidden="true"><BookOpen /></span>
          <span>Shelf Seasons</span>
        </Link>
        <p className="eyebrow">{content.eyebrow}</p>
        <h1>{content.title}</h1>
        <p className="legal-updated">{content.updated}</p>
        <p className="legal-intro">{content.intro}</p>
        {content.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {"items" in section && <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>}
          </section>
        ))}
        <nav className="legal-nav" aria-label={content.title}>
          <Link href={`/${locale}/privacy`}>{c.privacyLink}</Link>
          <Link href={`/${locale}/terms`}>{c.termsLink}</Link>
          <Link href={`/${locale}/sign-in`}>{c.back}</Link>
        </nav>
      </article>
    </main>
  );
}
