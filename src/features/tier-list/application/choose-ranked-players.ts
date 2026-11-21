export function chooseRankedPlayers<Bucket extends string>(
  playersByBucket: ReadonlyMap<Bucket, readonly string[]>,
  bucketOrder: readonly Bucket[],
  maximum: number,
  lastSampledAtByPuuid: ReadonlyMap<string, Date>,
): Array<{ puuid: string; eloBucket: Bucket }> {
  const candidatesByBucket = new Map(
    bucketOrder.map((bucket) => [
      bucket,
      [...(playersByBucket.get(bucket) ?? [])].sort((left, right) => {
        const leftSampledAt = lastSampledAtByPuuid.get(left);
        const rightSampledAt = lastSampledAtByPuuid.get(right);
        if (!leftSampledAt) return rightSampledAt ? -1 : 0;
        if (!rightSampledAt) return 1;
        return leftSampledAt.getTime() - rightSampledAt.getTime();
      }),
    ]),
  );
  const selected: Array<{ puuid: string; eloBucket: Bucket }> = [];
  const selectedPuuids = new Set<string>();
  const offsets = new Map<Bucket, number>();

  while (selected.length < maximum) {
    let addedInRound = false;
    for (const bucket of bucketOrder) {
      if (selected.length >= maximum) break;
      const candidates = candidatesByBucket.get(bucket) ?? [];
      let offset = offsets.get(bucket) ?? 0;
      while (offset < candidates.length) {
        const puuid = candidates[offset];
        offset += 1;
        if (!puuid || selectedPuuids.has(puuid)) continue;
        selected.push({ puuid, eloBucket: bucket });
        selectedPuuids.add(puuid);
        addedInRound = true;
        break;
      }
      offsets.set(bucket, offset);
    }
    if (!addedInRound) break;
  }

  return selected;
}
