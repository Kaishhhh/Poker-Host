"use client";

import { useState, useEffect, useRef } from "react";
import { getRemainingSeconds, formatTime } from "@/lib/clock";

interface UseClockParams {
  levelStartedAt: number | null;
  isPaused: boolean;
  pausedSecondsRemaining: number | null;
  durationMinutes: number;
  serverTime?: number;
  onExpire?: () => void;
}

export function useClock({
  levelStartedAt,
  isPaused,
  pausedSecondsRemaining,
  durationMinutes,
  serverTime,
  onExpire,
}: UseClockParams) {
  // Compute client clock offset to correct for device clock skew
  const offsetMs = serverTime ? serverTime - Date.now() : 0;

  function computeRemaining(): number {
    return getRemainingSeconds({
      levelStartedAt: levelStartedAt !== null ? BigInt(levelStartedAt - offsetMs) : null,
      isPaused,
      pausedSecondsRemaining,
      durationMinutes,
    });
  }

  const [remaining, setRemaining] = useState(computeRemaining);
  const expiredRef = useRef(false);

  useEffect(() => {
    expiredRef.current = false;
    setRemaining(computeRemaining());
  }, [levelStartedAt, isPaused, pausedSecondsRemaining, durationMinutes, serverTime]);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const r = computeRemaining();
      setRemaining(r);

      if (r <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpire?.();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [levelStartedAt, isPaused, pausedSecondsRemaining, durationMinutes, serverTime, onExpire]);

  return {
    remaining,
    display: formatTime(remaining),
    isExpired: remaining <= 0,
    isWarning: remaining <= 60 && remaining > 0,
  };
}
