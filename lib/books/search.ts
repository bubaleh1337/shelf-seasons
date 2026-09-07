import type { BookSearchResult } from "./types";
import type { Locale } from "../shelf-seasons";

export type RankedBookSearchResult = BookSearchResult & {
  language: string | null;
};

const normalize = (value: string) =>
  value
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\p{P}\p{S}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const usesCyrillic = (value: string) => /\p{Script=Cyrillic}/u.test(value);

function scoreResult(
  query: string,
  locale: Locale,
  result: RankedBookSearchResult,
) {
  const wanted = normalize(query);
  const title = normalize(result.title);
  const tokens = wanted.split(" ").filter((token) => token.length > 1);
  let score = 0;

  if (title === wanted) score += 200;
  else if (title.includes(wanted)) score += 140;
  else if (tokens.length && tokens.every((token) => title.includes(token))) {
    score += 100;
  } else {
    score += tokens.filter((token) => title.includes(token)).length * 12;
  }

  if (usesCyrillic(query) === usesCyrillic(result.title)) score += 30;
  if (result.language === locale || (locale === "ru" && result.language === "rus") || (locale === "en" && result.language === "eng")) score += 20;
  if (result.coverUrl) score += 12;
  return score;
}

export function rankAndDedupeResults(
  query: string,
  locale: Locale,
  results: RankedBookSearchResult[],
) {
  const unique = new Map<string, RankedBookSearchResult>();
  results.forEach((result) => {
    const key = `${result.provider}:${result.providerId}`;
    if (!unique.has(key)) unique.set(key, result);
  });

  return [...unique.values()]
    .sort(
      (left, right) =>
        scoreResult(query, locale, right) - scoreResult(query, locale, left),
    )
    .slice(0, 12)
    .map((result) => ({
      provider: result.provider,
      providerId: result.providerId,
      title: result.title,
      authors: result.authors,
      description: result.description,
      coverUrl: result.coverUrl,
      isbn: result.isbn,
      publishedYear: result.publishedYear,
      pageCount: result.pageCount,
      language: result.language,
    }));
}

export function providerLanguageToReadingLanguage(language: string | null | undefined) {
  if (language === "ru" || language === "rus") return "ru" as const;
  if (language === "en" || language === "eng") return "en" as const;
  return "other" as const;
}
