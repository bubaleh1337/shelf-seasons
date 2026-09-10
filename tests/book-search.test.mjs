import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { knownAlternateTitle, providerLanguageToReadingLanguage, rankAndDedupeResults } from "../lib/books/search.ts";

const result = (providerId, title, language, coverUrl = null) => ({
  provider: "google_books",
  providerId,
  title,
  authors: ["Stephen King"],
  description: null,
  coverUrl,
  isbn: null,
  publishedYear: null,
  pageCount: null,
  language,
});

test("Russian title matches rank ahead of an English original", () => {
  const ranked = rankAndDedupeResults("Бесплодные земли", "ru", [
    result("english", "The Waste Lands", "en", "https://example.com/en.jpg"),
    result("russian", "Бесплодные земли", "ru"),
  ]);
  assert.equal(ranked[0].providerId, "russian");
});

test("provider duplicates are removed and edition language is exposed", () => {
  const ranked = rankAndDedupeResults("Убийства и кексики", "ru", [
    result("same", "Убийства и кексики", "ru"),
    result("same", "Убийства и кексики", "ru"),
  ]);
  assert.equal(ranked.length, 1);
  assert.equal(ranked[0].language, "ru");
});

test("provider languages map to reading language choices", () => {
  assert.equal(providerLanguageToReadingLanguage("rus"), "ru");
  assert.equal(providerLanguageToReadingLanguage("en"), "en");
  assert.equal(providerLanguageToReadingLanguage("de"), "other");
});

test("common Russian translated titles have a fast provider fallback", () => {
  assert.equal(knownAlternateTitle("Игра престолов"), "A Game of Thrones");
  assert.equal(knownAlternateTitle("  ИГРА ПРЕСТОЛОВ!  "), "A Game of Thrones");
  assert.equal(knownAlternateTitle("Хоббит"), "The Hobbit");
  assert.equal(knownAlternateTitle("Ведьмак"), "The Witcher");
});

test("book search survives server-side quota infrastructure failures", async () => {
  const [dialog, browserSearch, limiter, route, config] = await Promise.all([
    readFile(new URL("../components/library/book-dialog.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/books/browser-search.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/security/rate-limit.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/books/search/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../next.config.ts", import.meta.url), "utf8"),
  ]);
  assert.match(dialog, /searchBooksInBrowser/);
  assert.match(dialog, /Promise\.all/);
  assert.match(browserSearch, /www\.googleapis\.com\/books/);
  assert.match(browserSearch, /openlibrary\.org\/search\.json/);
  assert.match(limiter, /continueOnInfrastructureError/);
  assert.match(route, /continueOnInfrastructureError: true/);
  assert.match(config, /connect-src[^\n]*www\.googleapis\.com[^\n]*openlibrary\.org/);
});

test("provider fallbacks stay inside the production request budget", async () => {
  const route = await readFile(new URL("../app/api/books/search/route.ts", import.meta.url), "utf8");
  assert.match(route, /knownAlternateTitle\(query\)/);
  assert.match(route, /Promise\.allSettled/);
  assert.match(route, /AbortSignal\.timeout\(4_000\)/);
  assert.match(route, /AbortSignal\.timeout\(2_000\)/);
  assert.doesNotMatch(route, /AbortSignal\.timeout\(8_000\)/);
});
