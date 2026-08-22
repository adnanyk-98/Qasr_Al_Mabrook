import "dotenv/config";

const host = process.env.DEV_HOST ?? "http://localhost:3000";
const slugs = [
  "5-5m-measuring-tape-green",
  "adivasi-oil",
  "cloth-piece",
  "fancy-suit",
  "pajama",
];

async function checkUrl(url: string) {
  const res = await fetch(url);
  const body = await res.text();
  const hasR2 = (body.match(/https:\/\/media\.qasralmabrook\.com/g) || []).length;
  const hasLocal = (body.match(/src="\/(catalogue)\//g) || []).length;

  return {
    status: res.status,
    hasR2,
    hasLocal,
    bodySnippet: body.slice(0, 400),
  };
}

async function run() {
  console.log("Checking product pages...");

  for (const slug of slugs) {
    const url = `${host}/en/products/${slug}`;
    try {
      const result = await checkUrl(url);
      console.log(`\n${slug}: status=${result.status} r2_count=${result.hasR2} local_count=${result.hasLocal}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error fetching ${url}:`, message);
    }
  }

  console.log("\nChecking homepage...");
  try {
    const result = await checkUrl(`${host}/en`);
    console.log(`/en: status=${result.status} r2_count=${result.hasR2} local_count=${result.hasLocal}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error fetching /en:", message);
  }
}

run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

export {};
