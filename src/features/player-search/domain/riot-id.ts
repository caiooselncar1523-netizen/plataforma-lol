export type RiotId = {
  gameName: string;
  tagLine: string;
};

export function parseRiotId(value: string | null): RiotId | null {
  if (!value) return null;

  const parts = value.trim().split("#");
  if (parts.length !== 2) return null;

  const gameName = parts[0]?.trim();
  const tagLine = parts[1]?.trim();
  if (
    !gameName ||
    !tagLine ||
    gameName.length > 16 ||
    tagLine.length > 5 ||
    /[\u0000-\u001f\u007f]/.test(gameName) ||
    /[\u0000-\u001f\u007f]/.test(tagLine)
  ) {
    return null;
  }

  return { gameName, tagLine };
}
