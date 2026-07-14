const INSTRUMENT_COLORS = [
  "#F0B6B8",
  "#C9B6DF",
  "#A9D9EA",
  "#B2E2C1",
  "#F3D999",
  "#F1C5DF",
  "#B9D0E3",
  "#D4E9B4",
  "#F4B7A8",
  "#C8D7AE",
  "#D7C4A8",
  "#B7C9E2",
];

export function getInstrumentColor(instrumentName: string): string {
  let hash = 0;
  for (let i = 0; i < instrumentName.length; i++) {
    hash = (hash << 5) - hash + instrumentName.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % INSTRUMENT_COLORS.length;
  return INSTRUMENT_COLORS[index];
}

export function getUniqueInstrumentColors(
  instrumentNames: string[],
): { name: string; color: string }[] {
  const unique = Array.from(new Set(instrumentNames)).sort((a, b) =>
    a.localeCompare(b, "ko"),
  );
  return unique.map((name) => ({ name, color: getInstrumentColor(name) }));
}

const COLUMNS = 14;

export function getInitialPosition(index: number): { x: number; y: number } {
  const x = 22 + (index % COLUMNS) * 82;
  const y = 20 + Math.floor(index / COLUMNS) * 52;
  return { x, y };
}

export { INSTRUMENT_COLORS };
