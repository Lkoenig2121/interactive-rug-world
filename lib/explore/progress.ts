export const EXPLORE_STORAGE_KEY = "carpet-explore-progress";

export interface ExploreProgress {
  stars: string[];
  /** Best ring-course time in seconds. */
  ringBest: number | null;
  bossDefeated: boolean;
  eventsDone: number;
  /** Toy friends found, and the ones already brought home to the shelf in Andy's room. */
  friends: string[];
  friendsHome: string[];
}

export const EMPTY_PROGRESS: ExploreProgress = { stars: [], ringBest: null, bossDefeated: false, eventsDone: 0, friends: [], friendsHome: [] };

const strings = (v: unknown) => (Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : []);

export function loadProgress(): ExploreProgress {
  if (typeof window === "undefined") return EMPTY_PROGRESS;
  try {
    const raw = window.localStorage.getItem(EXPLORE_STORAGE_KEY);
    if (!raw) return EMPTY_PROGRESS;
    const p = JSON.parse(raw) as Partial<ExploreProgress>;
    return {
      stars: strings(p.stars),
      ringBest: typeof p.ringBest === "number" ? p.ringBest : null,
      bossDefeated: p.bossDefeated === true,
      eventsDone: typeof p.eventsDone === "number" ? p.eventsDone : 0,
      friends: strings(p.friends),
      friendsHome: strings(p.friendsHome),
    };
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function saveProgress(p: ExploreProgress) {
  try {
    window.localStorage.setItem(EXPLORE_STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}
