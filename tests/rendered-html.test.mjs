import assert from "node:assert/strict";
import test from "node:test";

test("renders the localized Shelf Seasons application", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/ru/app", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.match(html, /Shelf Seasons/);
  assert.match(html, /Добрый день, Катя/);
  assert.match(html, /Отметить чтение/);
});

test("renders every primary bilingual route", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("routes", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const routes = [
    ["/en/app/library", "Library"],
    ["/en/app/calendar", "Calendar"],
    ["/en/app/series", "Series"],
    ["/en/app/recaps", "Recaps"],
    ["/en/app/settings", "Settings"],
    ["/ru/app/library", "Библиотека"],
    ["/ru/app/calendar", "Календарь"],
    ["/ru/app/series", "Серии"],
    ["/ru/app/recaps", "Итоги"],
    ["/ru/app/settings", "Настройки"],
    ["/en/offline", "You’re offline"],
    ["/ru/offline", "Сейчас нет подключения"],
  ];

  for (const [route, expected] of routes) {
    const response = await worker.fetch(
      new Request(`http://localhost${route}`, { headers: { accept: "text/html" } }),
      { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
      { waitUntil() {}, passThroughOnException() {} },
    );
    assert.equal(response.status, 200, route);
    assert.match(await response.text(), new RegExp(expected), route);
  }
});
