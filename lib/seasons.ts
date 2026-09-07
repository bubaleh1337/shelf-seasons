export const seasons = ["spring", "summer", "autumn", "winter"] as const;

export type BookSeason = (typeof seasons)[number];

export function seasonFromDateKey(dateKey: string): BookSeason {
  const month = Number(dateKey.slice(5, 7));
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

export function seasonSymbol(season: BookSeason) {
  return season === "spring" ? "✿" : season === "summer" ? "☀" : season === "autumn" ? "🍂" : "❄";
}
