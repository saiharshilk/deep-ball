"use client";

import React, { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { getSettings, saveSettings } from "@/lib/stats";
import { playCountdownTick } from "@/lib/sound";

interface SoundToggleProps {
  onChange?: (enabled: boolean) => void;
}

export function SoundToggle({ onChange }: SoundToggleProps) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const s = getSettings();
    setEnabled(s.soundEnabled);
    document.documentElement.classList.toggle("reduced-motion", s.reducedMotion);
    document.documentElement.classList.toggle("high-contrast", s.highContrast);

    const handleStorage = () => {
      const updated = getSettings();
      setEnabled(updated.soundEnabled);
    };
    window.addEventListener("deepball-settings-change", handleStorage);
    return () => window.removeEventListener("deepball-settings-change", handleStorage);
  }, []);

  const toggleSound = () => {
    const current = getSettings();
    const next = { ...current, soundEnabled: !current.soundEnabled };
    saveSettings(next);
    setEnabled(next.soundEnabled);
    window.dispatchEvent(new Event("deepball-settings-change"));
    if (next.soundEnabled) {
      playCountdownTick(true);
    }
    onChange?.(next.soundEnabled);
  };

  return (
    <button
      type="button"
      onClick={toggleSound}
      aria-label={enabled ? "Mute sound effects" : "Unmute sound effects"}
      aria-pressed={enabled}
      className="arcade-btn pixel-box w-10 h-10 flex items-center justify-center text-[var(--chalk)] hover:border-[var(--ball)] cursor-pointer"
    >
      {enabled ? (
        <Volume2 className="w-5 h-5 text-[var(--ball)]" />
      ) : (
        <VolumeX className="w-5 h-5 text-[var(--chalk)]/70" />
      )}
    </button>
  );
}
