export function identifyGoogleBooksRequest(url: URL) {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY?.trim();
  if (apiKey) url.searchParams.set("key", apiKey);
  return url;
}
