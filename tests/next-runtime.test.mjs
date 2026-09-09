import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import test, { after, before } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const port = 42000 + (process.pid % 1000);
const origin = `http://127.0.0.1:${port}`;
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");

let server;
let serverOutput = "";

async function request(route) {
  return fetch(`${origin}${route}`, {
    headers: { accept: "text/html" },
    signal: AbortSignal.timeout(10_000),
  });
}

before(async () => {
  const devEnvironment = {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: "1",
    NEXT_PUBLIC_APP_URL: "",
    NEXT_PUBLIC_SUPABASE_URL: "",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
  };
  server = spawn(
    process.execPath,
    [nextBin, "dev", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: root,
      env: devEnvironment,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  server.stdout.on("data", (chunk) => {
    serverOutput += chunk.toString();
  });
  server.stderr.on("data", (chunk) => {
    serverOutput += chunk.toString();
  });

  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Next.js development server exited early.\n${serverOutput}`);
    }

    try {
      const response = await request("/ru/app");
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Next.js development server did not become ready.\n${serverOutput}`);
});

after(async () => {
  if (!server || server.exitCode !== null) return;
  server.kill();
  await Promise.race([
    new Promise((resolve) => server.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);
});

test("standard Next.js dev server renders every primary bilingual route", async () => {
  const routes = [
    ["/en/app", "Good afternoon, Katya"],
    ["/en/app/library", "Library"],
    ["/en/app/calendar", "Calendar"],
    ["/en/app/series", "Series"],
    ["/en/app/recaps", "Recaps"],
    ["/en/app/settings", "Settings"],
    ["/ru/app", "Добрый день, Катя"],
    ["/ru/app/library", "Библиотека"],
    ["/ru/app/calendar", "Календарь"],
    ["/ru/app/series", "Серии"],
    ["/ru/app/recaps", "Итоги"],
    ["/ru/app/settings", "Настройки"],
    ["/en/offline", "You’re offline"],
    ["/ru/offline", "Сейчас нет подключения"],
    ["/en/sign-in", "Connect Supabase to enable accounts"],
    ["/ru/sign-in", "Подключи Supabase, чтобы включить аккаунты"],
  ];

  for (const [route, expected] of routes) {
    const response = await request(route);
    assert.equal(response.status, 200, `${route}\n${serverOutput}`);
    assert.match(await response.text(), new RegExp(expected), route);
  }
});

test("development page loads generated CSS, client scripts and the book cover", async () => {
  const response = await request("/ru/app");
  assert.equal(response.status, 200, serverOutput);
  const html = await response.text();

  assert.match(html, /role="progressbar"/);
  assert.match(html, /aria-valuenow="62"/);

  const stylesheetUrls = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map(
    (match) => match[1],
  );
  assert.ok(stylesheetUrls.length > 0, "the page must include a generated stylesheet");

  for (const href of stylesheetUrls) {
    const stylesheet = await fetch(new URL(href, origin), { signal: AbortSignal.timeout(10_000) });
    assert.equal(stylesheet.status, 200, href);
    assert.match(stylesheet.headers.get("content-type") ?? "", /^text\/css\b/i, href);
    assert.match(await stylesheet.text(), /\.shelf-(app|sidebar)/, href);
  }

  const scriptUrls = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((match) => match[1]);
  assert.ok(scriptUrls.length > 0, "the page must include client scripts");
  for (const src of scriptUrls) {
    const script = await fetch(new URL(src, origin), { signal: AbortSignal.timeout(10_000) });
    assert.equal(script.status, 200, src);
    assert.match(script.headers.get("content-type") ?? "", /javascript/i, src);
  }

  assert.match(html, /src="\/glass-orchard\.webp"/);
  assert.doesNotMatch(html, /\/_next\/image/);
  const cover = await fetch(`${origin}/glass-orchard.webp`, { signal: AbortSignal.timeout(10_000) });
  assert.equal(cover.status, 200);
  assert.match(cover.headers.get("content-type") ?? "", /^image\/webp\b/i);
  assert.ok((await cover.arrayBuffer()).byteLength > 100_000);
});
