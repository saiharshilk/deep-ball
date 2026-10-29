// Per-browser preferences only. Match history and stats live on the server (GET /api/me).

const SETTINGS_KEY = "deepball:settings:v1";
const MERCH_DISMISSED_KEY = "deepball:merch_dismissed:v1";

export interface UserSettings {
  soundEnabled: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
}

export function getSettings(): UserSettings {
  try {
    if (typeof window === "undefined") {
      return { soundEnabled: false, reducedMotion: false, highContrast: false };
    }
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return { soundEnabled: false, reducedMotion: false, highContrast: false };
    }
    const parsed = JSON.parse(raw);
    return {
      soundEnabled: Boolean(parsed.soundEnabled),
      reducedMotion: Boolean(parsed.reducedMotion),
      highContrast: Boolean(parsed.highContrast),
    };
  } catch {
    return { soundEnabled: false, reducedMotion: false, highContrast: false };
  }
}

export function saveSettings(next: UserSettings): void {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      document.documentElement.classList.toggle("reduced-motion", next.reducedMotion);
      document.documentElement.classList.toggle("high-contrast", next.highContrast);
    }
  } catch {
    // Ignore
  }
}

export function isMerchDismissed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(MERCH_DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
}

export function dismissMerchSurvey(vote?: "up" | "down"): void {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MERCH_DISMISSED_KEY, "true");
      if (vote) {
        window.localStorage.setItem("deepball:merch_vote:v1", vote);
      }
    }
  } catch {
    // Ignore
  }
}
