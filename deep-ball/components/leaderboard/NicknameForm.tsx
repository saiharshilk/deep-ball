"use client";

import React, { useState } from "react";
import { setNickname } from "@/lib/api";
import { PlayerName } from "@/lib/types";

interface NicknameFormProps {
  current: PlayerName | null;
  onSaved: (name: PlayerName) => void;
  compact?: boolean;
}

/** Pick or change the leaderboard nickname. No account: it's tied to this browser's player cookie. */
export function NicknameForm({ current, onSaved, compact }: NicknameFormProps) {
  const [value, setValue] = useState(current?.nickname ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      onSaved(await setNickname(value));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save, try again");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-1.5">
      {!compact && (
        <label htmlFor="nickname" className="font-vt text-base text-[var(--cream)]">
          {current ? "Change your leaderboard name" : "Pick a name for the leaderboard"}
        </label>
      )}
      <div className="flex gap-2">
        <input
          id="nickname"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={16}
          minLength={3}
          autoComplete="nickname"
          placeholder="Nickname"
          aria-label="Leaderboard nickname"
          className="flex-1 min-w-0 bg-[#0B1220] border-2 border-[#2C3E66] px-2 py-1.5 font-vt text-lg text-[var(--chalk)] placeholder:text-[var(--net)] focus:border-[var(--ball)] outline-none"
        />
        <button
          type="submit"
          disabled={saving || value.trim().length < 3}
          className="arcade-btn px-3 bg-[var(--navy)] border-2 border-[var(--ball)] font-display text-[9px] text-[var(--ball)] tracking-wider disabled:opacity-40 cursor-pointer"
        >
          {saving ? "…" : "SAVE"}
        </button>
      </div>
      {error ? (
        <p className="font-vt text-sm text-[var(--clay)]" role="alert">{error}</p>
      ) : (
        <p className="font-vt text-sm text-[var(--net)]">3-16 characters. A #tag is added so names can repeat.</p>
      )}
    </form>
  );
}
