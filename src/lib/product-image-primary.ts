export function resolvePrimaryProductImageId({
  currentPrimaryImageId,
  candidateImageId,
  isPrimaryChecked,
}: {
  currentPrimaryImageId: string | null;
  candidateImageId: string | null;
  isPrimaryChecked: boolean;
}) {
  if (candidateImageId && isPrimaryChecked) {
    return candidateImageId;
  }

  return currentPrimaryImageId;
}
