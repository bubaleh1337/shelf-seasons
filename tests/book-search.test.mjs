import assert from "node:assert/strict";
import test from "node:test";
import { providerLanguageToReadingLanguage, rankAndDedupeResults } from "../lib/books/search.ts";

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
