import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { resolve } from "node:path";

import { chromium, type Browser, type BrowserContext, type Page } from "playwright";

const host = "127.0.0.1";

async function findAvailablePort(): Promise<number> {
  const server = createServer();
  server.listen(0, host);
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const port = address.port;
  await new Promise<void>((resolveClose, reject) =>
    server.close((error) => (error ? reject(error) : resolveClose())),
  );
  return port;
}

async function waitForApplication(
  url: string,
  server: ReturnType<typeof spawn>,
): Promise<void> {
  const deadline = Date.now() + 60_000;
  let lastError: unknown;

  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Next.js server exited with code ${server.exitCode}.`);
    }

    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = new Error(`Application readiness returned HTTP ${response.status}.`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  }

  throw new Error(`Next.js server did not become ready: ${String(lastError)}`);
}

async function assertPreference(page: Page, expected: "accepted" | "rejected") {
  const cookie = await page.evaluate(() => document.cookie);
  assert.match(cookie, new RegExp(`qam-analytics-consent=${expected}`));
  await page
    .getByRole("button", {
      name: /Cookie preferences|تفضيلات ملفات تعريف الارتباط/,
    })
    .waitFor();
}

async function assertNoClarityCookies(page: Page) {
  const cookie = await page.evaluate(() => document.cookie);
  assert.doesNotMatch(cookie, /(?:^|;\s*)_cl(?:ck|sk)=/i);
}

async function main() {
  const port = await findAvailablePort();
  const baseUrl = `http://${host}:${port}`;
  const nextCli = resolve("node_modules/next/dist/bin/next");
  const server = spawn(
    process.execPath,
    [nextCli, "start", "--hostname", host, "--port", String(port)],
    {
      env: { ...process.env, NODE_ENV: "production" },
      stdio: "inherit",
    },
  );

  let browser: Browser | undefined;
  let context: BrowserContext | undefined;

  try {
    await waitForApplication(`${baseUrl}/en/about-us`, server);
    browser = await chromium.launch();
    context = await browser.newContext();

    const clarityRequests: string[] = [];
    const blockedGoogleRequests: string[] = [];
    const applicationFailures: string[] = [];
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const page = await context.newPage();

    await page.addInitScript(() => {
      const w = window as Window & {
        __qamClarityCalls?: unknown[][];
        __qamAnalyticsEvents?: unknown[];
        clarity?: (...args: unknown[]) => void;
      };
      w.__qamClarityCalls = [];
      w.__qamAnalyticsEvents = [];
      w.clarity = (...args) => w.__qamClarityCalls?.push(args);
      window.addEventListener("qam:analytics", (event) => {
        w.__qamAnalyticsEvents?.push((event as CustomEvent).detail);
      });
    });

    await page.route(
      /https:\/\/(?:www\.)?(?:googletagmanager\.com|google-analytics\.com)\//,
      async (route) => {
        const url = route.request().url();
        blockedGoogleRequests.push(url);
        await route.abort("blockedbyclient");
      },
    );
    await page.route("https://www.clarity.ms/**", async (route) => {
      clarityRequests.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: "window.__qamClarityScriptLoads=(window.__qamClarityScriptLoads||0)+1;",
      });
    });

    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("requestfailed", (request) => {
      if (request.url().startsWith(`${baseUrl}/`)) {
        applicationFailures.push(
          `${request.method()} ${request.url()}: ${request.failure()?.errorText}`,
        );
      }
    });
    page.on("response", (response) => {
      if (response.url().startsWith(`${baseUrl}/`) && response.status() >= 400) {
        applicationFailures.push(
          `${response.status()} ${response.request().method()} ${response.url()}`,
        );
      }
    });

    const response = await page.goto(`${baseUrl}/en/about-us`, {
      waitUntil: "domcontentloaded",
    });
    assert.equal(response?.status(), 200);
    await page.waitForLoadState("networkidle");
    assert.equal(await page.locator("html").getAttribute("lang"), "en");
    await page.getByRole("heading", { name: "Your privacy choices" }).waitFor();
    assert.doesNotMatch(
      await page.evaluate(() => document.cookie),
      /(?:^|;\s*)qam-analytics-consent=/,
    );
    await assertNoClarityCookies(page);
    assert.deepEqual(blockedGoogleRequests, []);
    assert.equal(
      await page.evaluate(
        () =>
          [...document.scripts].filter((script) =>
            /googletagmanager|google-analytics|clarity\.ms/i.test(script.src),
          ).length,
      ),
      0,
    );

    const accept = page.getByRole("button", { name: "Accept optional analytics" });
    const reject = page.getByRole("button", { name: "Reject optional analytics" });
    const [acceptBox, rejectBox] = await Promise.all([
      accept.boundingBox(),
      reject.boundingBox(),
    ]);
    assert.ok(acceptBox && rejectBox);
    assert.ok(acceptBox.height >= 44 && rejectBox.height >= 44);

    await reject.click();
    await assertPreference(page, "rejected");
    await page.waitForLoadState("networkidle");
    await assertNoClarityCookies(page);
    const firstRejectionCalls = await page.evaluate(
      () =>
        (window as Window & { __qamClarityCalls?: unknown[][] }).__qamClarityCalls ??
        [],
    );
    assert.ok(
      firstRejectionCalls.some(
        (call) =>
          call[0] === "consentv2" &&
          (call[1] as { analytics_Storage?: string } | undefined)?.analytics_Storage ===
            "denied",
      ),
    );
    assert.deepEqual(blockedGoogleRequests, []);
    await page.reload({ waitUntil: "networkidle" });
    await assertPreference(page, "rejected");
    assert.deepEqual(blockedGoogleRequests, []);

    await page.getByTestId("locale-switcher").click();
    await page.waitForURL("**/ar/about-us");
    assert.equal(await page.locator("html").getAttribute("lang"), "ar");
    await page.getByRole("button", { name: "تفضيلات ملفات تعريف الارتباط" }).waitFor();
    assert.deepEqual(blockedGoogleRequests, []);

    await page.getByRole("button", { name: "تفضيلات ملفات تعريف الارتباط" }).click();
    await page.getByRole("heading", { name: "خيارات الخصوصية" }).waitFor();
    await page
      .getByRole("button", { name: "الموافقة على التحليلات الاختيارية" })
      .click();
    await assertPreference(page, "accepted");
    await page.waitForLoadState("networkidle");
    await assertNoClarityCookies(page);

    const acceptedClarityCalls = await page.evaluate(
      () =>
        (window as Window & { __qamClarityCalls?: unknown[][] }).__qamClarityCalls ??
        [],
    );
    assert.ok(
      acceptedClarityCalls.some(
        (call) =>
          call[0] === "consentv2" &&
          (call[1] as { ad_Storage?: string; analytics_Storage?: string } | undefined)
            ?.ad_Storage === "denied" &&
          (call[1] as { analytics_Storage?: string } | undefined)?.analytics_Storage ===
            "granted",
      ),
      "Acceptance must grant Clarity analytics storage while denying ad storage.",
    );
    assert.equal(
      await page.evaluate(
        () =>
          [...document.scripts].filter((script) =>
            /googletagmanager|google-analytics|clarity\.ms/i.test(script.src),
          ).length,
      ),
      0,
      "Localhost must not initialize any analytics loader.",
    );
    assert.deepEqual(blockedGoogleRequests, []);

    const requestQuote = page.locator('a[href="/ar/request-quote"]').first();
    await requestQuote.evaluate((element) => {
      element.addEventListener("click", (event) => event.preventDefault(), {
        capture: true,
        once: true,
      });
    });
    await requestQuote.click();
    await page.waitForLoadState("networkidle");
    const acceptedEvents = await page.evaluate(
      () =>
        (window as Window & { __qamAnalyticsEvents?: unknown[] })
          .__qamAnalyticsEvents ?? [],
    );
    assert.ok(acceptedEvents.length > 0);
    const browserClarityEvents = await page.evaluate(
      () =>
        (window as Window & { __qamClarityCalls?: unknown[][] }).__qamClarityCalls ??
        [],
    );
    assert.ok(
      browserClarityEvents.some(
        (call) => call[0] === "event" && call[1] === "product_request_quote",
      ),
      "Accepted application events must reach the Clarity event API.",
    );

    await page.reload({ waitUntil: "networkidle" });
    await assertPreference(page, "accepted");
    await page.getByTestId("locale-switcher").click();
    await page.waitForURL("**/en/about-us");
    await assertPreference(page, "accepted");
    assert.equal(
      await page.evaluate(
        () =>
          [...document.scripts].filter((script) =>
            /googletagmanager|google-analytics|clarity\.ms/i.test(script.src),
          ).length,
      ),
      0,
      "No analytics loader is allowed on the local noncanonical host.",
    );

    await page.getByRole("button", { name: "Cookie preferences" }).click();
    await page.getByRole("button", { name: "Reject optional analytics" }).click();
    await assertPreference(page, "rejected");
    await page.evaluate(() => {
      (window as Window & { __qamAnalyticsEvents?: unknown[] }).__qamAnalyticsEvents =
        [];
    });
    await assertNoClarityCookies(page);
    const revokedClarityCalls = await page.evaluate(
      () =>
        (window as Window & { __qamClarityCalls?: unknown[][] }).__qamClarityCalls ??
        [],
    );
    assert.ok(
      revokedClarityCalls.some(
        (call) =>
          call[0] === "consentv2" &&
          (call[1] as { ad_Storage?: string; analytics_Storage?: string } | undefined)
            ?.analytics_Storage === "denied",
      ),
    );
    assert.ok(
      revokedClarityCalls.some((call) => call[0] === "consent" && call[1] === false),
      "Revocation must issue Clarity's documented cookie-erasure command.",
    );

    const rejectedRequestQuote = page.locator('a[href="/en/request-quote"]').first();
    await rejectedRequestQuote.evaluate((element) => {
      element.addEventListener("click", (event) => event.preventDefault(), {
        capture: true,
        once: true,
      });
    });
    await rejectedRequestQuote.click();
    await page.waitForLoadState("networkidle");
    const eventsAfterRevocation = await page.evaluate(
      () =>
        (window as Window & { __qamAnalyticsEvents?: unknown[] })
          .__qamAnalyticsEvents ?? [],
    );
    assert.deepEqual(eventsAfterRevocation, []);
    assert.deepEqual(blockedGoogleRequests, []);
    assert.deepEqual(clarityRequests, []);
    assert.deepEqual(applicationFailures, []);
    assert.deepEqual(pageErrors, []);
    assert.deepEqual(consoleErrors, []);

    console.log(
      JSON.stringify({
        result: "PASS",
        baseUrl,
        mockedClarityRequests: clarityRequests,
        blockedGoogleAnalyticsRequests: blockedGoogleRequests,
        applicationFailures,
        consoleErrors,
        pageErrors,
      }),
    );
  } finally {
    await context?.close();
    await browser?.close();
    server.kill();
    await Promise.race([
      once(server, "exit"),
      new Promise((resolveDelay) => setTimeout(resolveDelay, 5_000)),
    ]);
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
