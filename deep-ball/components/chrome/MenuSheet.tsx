"use client";

import React, { useEffect, useState } from "react";
import { Menu, Lock, CheckCircle2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Link from "next/link";
import { HowToPlay } from "./HowToPlay";
import { getSettings, saveSettings, UserSettings } from "@/lib/stats";
import { getMyProfile } from "@/lib/api";
import { PlayerProfile } from "@/lib/types";
import { TIERS } from "@/lib/tiers";

type TabKey = "howto" | "stats" | "matches" | "about" | "settings";

export function MenuSheet() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("howto");
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings>({
    soundEnabled: false,
    reducedMotion: false,
    highContrast: false,
  });

  useEffect(() => {
    if (open) {
      getMyProfile().then(setProfile).catch(() => {});
      setSettings(getSettings());
    }
  }, [open]);

  const stats = profile?.stats ?? {
    streak: 0,
    bestStreak: 0,
    matchesPlayed: 0,
    averageFt: 0,
    bestMatchFt: 0,
    bestMatchNumber: 0,
    grandSlams: 0,
  };
  const history = profile?.history ?? [];

  const toggleSetting = (key: keyof UserSettings) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    saveSettings(next);
    window.dispatchEvent(new Event("deepball-settings-change"));
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Open game menu"
        className="arcade-btn pixel-box w-10 h-10 flex items-center justify-center text-[var(--chalk)] hover:border-[var(--ball)] cursor-pointer"
      >
        <Menu className="w-5 h-5" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[340px] sm:w-[400px] bg-[var(--navy)] border-r-4 border-[var(--chalk)] text-[var(--chalk)] p-0 flex flex-col z-50"
      >
        <SheetHeader className="p-4 border-b-2 border-[#2A3B63] bg-[#0B1220]">
          <SheetTitle className="font-display text-sm text-[var(--ball)] tracking-wider flex items-center justify-between">
            <span>DEEP BALL · CLUBHOUSE</span>
          </SheetTitle>
          {/* Navigation Tabs */}
          <div className="grid grid-cols-5 gap-1 pt-2">
            {(
              [
                { id: "howto", label: "RULES" },
                { id: "stats", label: "STATS" },
                { id: "matches", label: "PAST" },
                { id: "settings", label: "SETUP" },
                { id: "about", label: "INFO" },
              ] as { id: TabKey; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`arcade-btn py-1.5 px-1 font-display text-[9px] border cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[var(--ball)] text-[#0B1220] border-[var(--chalk)]"
                    : "bg-[var(--navy)] text-[var(--chalk)] border-[#2A3B63]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === "howto" && (
            <div>
              <h3 className="font-display text-xs text-[var(--cream)] mb-3">
                HOW TO PLAY
              </h3>
              <HowToPlay />
            </div>
          )}

          {activeTab === "stats" && (
            <div className="space-y-4">
              <h3 className="font-display text-xs text-[var(--cream)]">
                YOUR CAREER STATS
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-[#0B1220] border-2 border-[#2A3B63] p-3">
                  <div className="font-vt text-xs text-[var(--net)]">STREAK</div>
                  <div className="font-display text-lg text-[var(--ball)] mt-1">
                    {`${stats.streak}d`}
                  </div>
                </div>
                <div className="bg-[#0B1220] border-2 border-[#2A3B63] p-3">
                  <div className="font-vt text-xs text-[var(--net)]">BEST STREAK</div>
                  <div className="font-display text-lg text-[var(--chalk)] mt-1">
                    {`${stats.bestStreak}d`}
                  </div>
                </div>
                <div className="bg-[#0B1220] border-2 border-[#2A3B63] p-3">
                  <div className="font-vt text-xs text-[var(--net)]">MATCHES</div>
                  <div className="font-display text-lg text-[var(--chalk)] mt-1">
                    {stats.matchesPlayed}
                  </div>
                </div>
                <div className="bg-[#0B1220] border-2 border-[#2A3B63] p-3">
                  <div className="font-vt text-xs text-[var(--net)]">AVERAGE</div>
                  <div className="font-display text-lg text-[#3FD0C9] mt-1">
                    {`${stats.averageFt} ft`}
                  </div>
                </div>
                <div className="bg-[#0B1220] border-2 border-[#2A3B63] p-3">
                  <div className="font-vt text-xs text-[var(--net)]">BEST MATCH</div>
                  <div className="font-display text-sm text-[var(--clay)] mt-1">
                    {`${stats.bestMatchFt} ft (#${stats.bestMatchNumber})`}
                  </div>
                </div>
                <div className="bg-[#0B1220] border-2 border-[#2A3B63] p-3">
                  <div className="font-vt text-xs text-[var(--net)]">GRAND SLAMS</div>
                  <div className="font-display text-lg text-[#FF6B3D] mt-1">
                    {stats.grandSlams}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "matches" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xs text-[var(--cream)]">
                  PAST MATCHES ARCHIVE
                </h3>
                <Link
                  href="/archive"
                  onClick={() => setOpen(false)}
                  className="font-display text-[9px] text-[var(--ball)] hover:underline"
                >
                  CALENDAR ▶
                </Link>
              </div>
              {history.length === 0 && (
                <p className="font-vt text-base text-[var(--net)]">No matches yet. Hit SERVE to play today's.</p>
              )}
              {history.map((record) => {
                const num = record.matchNumber;
                const isLocked = record.isToday && !record.played;

                return (
                  <Link
                    key={num}
                    href={record.isToday ? "/play" : `/play?date=${record.matchId}`}
                    onClick={() => setOpen(false)}
                    className="bg-[#0B1220] border-2 border-[#2A3B63] hover:border-[var(--ball)] p-3 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-display text-xs text-[var(--ball)]">
                          {`MATCH #${num}`}
                        </span>
                        <span className="ml-2 font-vt text-sm text-[var(--net)]">
                          {record.isToday ? `${record.dateLabel} (TODAY)` : record.dateLabel}
                        </span>
                      </div>
                      {isLocked ? (
                        <span className="inline-flex items-center gap-1 font-vt text-xs text-[var(--clay)]">
                          <Lock className="w-3.5 h-3.5" /> IN PLAY
                        </span>
                      ) : record.played ? (
                        <span className="inline-flex items-center gap-1 font-display text-xs text-[#3FD0C9]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {`${record.distance} FT`}
                        </span>
                      ) : (
                        <span className="font-display text-[9px] text-[var(--clay)]">PLAY ▶</span>
                      )}
                    </div>

                    {record.tiers && (
                      <div className="flex items-center gap-1.5 pt-1">
                        {record.tiers.map((t, idx) => (
                          <div
                            key={idx}
                            className="w-3.5 h-3.5 border border-black"
                            style={{ backgroundColor: TIERS[t]?.color || "#3A4560" }}
                            title={TIERS[t]?.label}
                          />
                        ))}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-3">
              <h3 className="font-display text-xs text-[var(--cream)]">
                CABINET SETTINGS
              </h3>

              {(
                [
                  {
                    key: "soundEnabled",
                    title: "8-BIT AUDIO SYNTH",
                    desc: "Web Audio racket pock, crowd noise & tier fanfares",
                  },
                  {
                    key: "reducedMotion",
                    title: "REDUCED MOTION",
                    desc: "Disable marquees, camera shake & make scroll instant",
                  },
                  {
                    key: "highContrast",
                    title: "HIGH CONTRAST CRT",
                    desc: "Sharper chalk lines and reduced scanline opacity",
                  },
                ] as { key: keyof UserSettings; title: string; desc: string }[]
              ).map((item) => (
                <div
                  key={item.key}
                  className="bg-[#0B1220] border-2 border-[#2A3B63] p-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-display text-[10px] text-[var(--chalk)]">
                      {item.title}
                    </div>
                    <div className="font-vt text-sm text-[var(--net)] mt-0.5">
                      {item.desc}
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings[item.key]}
                    onClick={() => toggleSetting(item.key)}
                    className={`arcade-btn px-3 py-1.5 font-display text-[10px] border-2 cursor-pointer ${
                      settings[item.key]
                        ? "bg-[var(--ball)] text-[#0B1220] border-[var(--chalk)]"
                        : "bg-[var(--navy)] text-[var(--net)] border-[#2A3B63]"
                    }`}
                  >
                    {settings[item.key] ? "ON" : "OFF"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === "about" && (
            <div className="space-y-3 font-vt text-base text-[var(--chalk)]">
              <h3 className="font-display text-xs text-[var(--cream)]">
                ABOUT DEEP BALL
              </h3>
              <p>
                <strong className="text-[var(--ball)]">
                  DEEP BALL — Tennis Edition
                </strong>{" "}
                is a daily retro stadium trivia game where obscure tennis knowledge launches the ball deeper into the night sky.
              </p>
              <p className="text-[var(--net)]">
                Inspired by 1984 arcade cabinets and late-night fifth sets under the floodlights.
              </p>
              <div className="bg-[#0B1220] border border-[#2A3B63] p-3 font-vt text-sm text-[var(--cream)]">
                {"CABINET ROM REV 1.04 · 1984-2026 DEEPBALL.GAME"}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
