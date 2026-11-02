export type ArcadeId = "invaders" | "blasters";

export interface ArcadeScore {
  name: string;
  score: number;
  wave: number;
}

const KEY: Record<ArcadeId, string> = {
  invaders: "carpet-alien-invaders",
  blasters: "carpet-space-blasters",
};

const SEED: Record<ArcadeId, ArcadeScore[]> = {
  invaders: [
    { name: "ZURG", score: 18600, wave: 9 },
    { name: "REX", score: 12440, wave: 7 },
    { name: "HAMM", score: 9810, wave: 6 },
    { name: "SPUD", score: 7200, wave: 5 },
    { name: "SQUE", score: 4550, wave: 4 },
    { name: "PEEP", score: 2100, wave: 2 },
  ],
  blasters: [
    { name: "BUZZ", score: 15200, wave: 8 },
    { name: "AL", score: 11110, wave: 6 },
    { name: "SID", score: 8440, wave: 5 },
    { name: "LENO", score: 6100, wave: 4 },
    { name: "DUCK", score: 3900, wave: 3 },
    { name: "DOT", score: 1800, wave: 2 },
  ],
};

function sortBoard(rows: ArcadeScore[]) {
  return [...rows].sort((a, b) => b.score - a.score || b.wave - a.wave).slice(0, 8);
}

export function loadArcadeScores(game: ArcadeId): ArcadeScore[] {
  if (typeof window === "undefined") return SEED[game];
  try {
    const raw = window.localStorage.getItem(KEY[game]);
    if (!raw) return SEED[game];
    const parsed = JSON.parse(raw) as ArcadeScore[];
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED[game];
    return sortBoard(parsed);
  } catch {
    return SEED[game];
  }
}

export function recordArcadeScore(game: ArcadeId, entry: ArcadeScore): ArcadeScore[] {
  const next = sortBoard([entry, ...loadArcadeScores(game)]);
  try {
    window.localStorage.setItem(KEY[game], JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
  return next;
}
