"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

type Vote = "YES" | "NO";

type Stats = {
  total: number;
  yesCount: number;
  noCount: number;
};

const NO_BUTTON_WIDTH = 122;
const NO_BUTTON_HEIGHT = 52;

export function ValentineCard() {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [noPosition, setNoPosition] = useState({ x: 0, y: 0 });
  const [response, setResponse] = useState<Vote | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [stats, setStats] = useState<Stats | null>(null);

  const yesPercent = useMemo(() => {
    if (!stats || stats.total === 0) {
      return 0;
    }
    return Math.round((stats.yesCount / stats.total) * 100);
  }, [stats]);

  const getRandomPosition = useCallback(() => {
    const frame = frameRef.current;
    if (!frame) return { x: 0, y: 0 };

    const maxX = Math.max(0, frame.clientWidth - NO_BUTTON_WIDTH);
    const maxY = Math.max(0, frame.clientHeight - NO_BUTTON_HEIGHT);

    return {
      x: Math.random() * maxX - frame.clientWidth / 2 + NO_BUTTON_WIDTH / 2,
      y: Math.random() * maxY - frame.clientHeight / 2 + NO_BUTTON_HEIGHT / 2,
    };
  }, []);

  const moveNoButton = useCallback(() => {
    setNoPosition(getRandomPosition());
  }, [getRandomPosition]);

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/responses", { cache: "no-store" });
    if (!res.ok) {
      throw new Error("Failed to load stats");
    }
    const data = (await res.json()) as Stats;
    setStats(data);
  }, []);

  const saveVote = useCallback(
    async (answer: Vote) => {
      setResponse(answer);
      setStatus("saving");
      try {
        const res = await fetch("/api/responses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer }),
        });

        if (!res.ok) {
          throw new Error("Save failed");
        }

        setStatus("saved");
        await loadStats();
      } catch {
        setStatus("error");
      }
    },
    [loadStats]
  );

  useEffect(() => {
    moveNoButton();
    void loadStats();
  }, [moveNoButton, loadStats]);

  return (
    <section className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/35 bg-white/65 p-8 shadow-2xl shadow-pink-500/20 backdrop-blur-md sm:p-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(236,72,153,0.22),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(244,63,94,0.2),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(190,24,93,0.12),transparent_35%)]" />
      <div className="relative flex flex-col items-center text-center">
        <motion.h1
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-serif text-4xl text-rose-900 sm:text-5xl"
        >
          Will you be my Valentine?
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mt-4 max-w-xl text-sm leading-relaxed text-rose-900/80 sm:text-base"
        >
          Try to click &ldquo;No&rdquo; if you can. The button escapes your cursor.
          Real responses are stored and counted live.
        </motion.p>

        <div
          ref={frameRef}
          className="relative mt-10 h-64 w-full max-w-xl rounded-2xl border border-rose-300/70 bg-white/55"
          onMouseMove={(event) => {
            if (response) return;
            const frame = frameRef.current;
            if (!frame) return;
            const rect = frame.getBoundingClientRect();
            const noCenterX = rect.left + rect.width / 2 + noPosition.x;
            const noCenterY = rect.top + rect.height / 2 + noPosition.y;
            const distance = Math.hypot(event.clientX - noCenterX, event.clientY - noCenterY);

            if (distance < 95) {
              moveNoButton();
            }
          }}
        >
          <button
            type="button"
            onClick={() => void saveVote("YES")}
            disabled={Boolean(response)}
            className="absolute left-1/2 top-1/2 h-[52px] w-[122px] -translate-x-[150%] -translate-y-1/2 rounded-full bg-rose-600 px-5 font-semibold text-white shadow-lg transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-80"
          >
            Yes
          </button>

          <motion.button
            type="button"
            animate={noPosition}
            transition={{ type: "spring", stiffness: 380, damping: 24 }}
            onMouseEnter={moveNoButton}
            onClick={() => void saveVote("NO")}
            disabled={Boolean(response)}
            className="absolute left-1/2 top-1/2 h-[52px] w-[122px] -translate-x-[50%] -translate-y-1/2 rounded-full border border-rose-500 bg-white px-5 font-semibold text-rose-700 shadow transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-80"
          >
            No
          </motion.button>
        </div>

        <div className="mt-8 min-h-14 text-rose-950">
          {status === "saved" && response === "YES" && (
            <p className="font-semibold">Perfect. I knew it.</p>
          )}
          {status === "saved" && response === "NO" && (
            <p className="font-semibold">You actually caught it. Respect.</p>
          )}
          {status === "saving" && <p>Saving your response...</p>}
          {status === "error" && (
            <p>Could not save your response. Check `DATABASE_URL` and retry.</p>
          )}
        </div>

        {stats && (
          <div className="mt-4 w-full max-w-md rounded-2xl border border-rose-200 bg-white/75 p-4 text-left shadow-sm">
            <p className="text-sm font-semibold text-rose-900">Live Results</p>
            <p className="mt-2 text-sm text-rose-900/85">
              {stats.yesCount} yes / {stats.noCount} no ({stats.total} total)
            </p>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-rose-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${yesPercent}%` }}
                className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-500"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
