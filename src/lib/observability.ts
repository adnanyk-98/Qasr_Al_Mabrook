export function reportServerError(scope: string, error: unknown, context?: Record<string, string>) {
  const errorType = error instanceof Error ? error.name : "UnknownError";
  console.error(JSON.stringify({
    level: "error",
    scope,
    errorType,
    context,
    timestamp: new Date().toISOString(),
  }));
}