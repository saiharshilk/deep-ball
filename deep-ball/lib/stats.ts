// Per-browser preferences only. Match history and stats live on the server (GET /api/me).

const SETTINGS_KEY = "deepball:settings:v1";

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
