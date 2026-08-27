export type BaselineAdoptionState = {
  deploymentStage: string | undefined;
  confirmation: string | undefined;
  baselineVerified: boolean;
  homepageDealsExists: boolean;
  migrationHistoryExists: boolean;
};

export function validateBaselineAdoptionState(state: BaselineAdoptionState) {
  const errors: string[] = [];
  if (state.deploymentStage !== "staging") errors.push("DEPLOYMENT_STAGE must be staging.");
  if (state.confirmation !== "ADOPT_BASELINE_0003") errors.push("MIGRATION_CONFIRMATION must be ADOPT_BASELINE_0003.");
  if (!state.baselineVerified) errors.push("read-only baseline verification failed.");
  if (state.homepageDealsExists) errors.push("homepage_deals already exists.");
  if (state.migrationHistoryExists) errors.push("migration history already exists.");
  return { ok: errors.length === 0, errors };
}
