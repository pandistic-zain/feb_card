"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { WebcamPixelGrid } from "@/components/ui/webcam-pixel-grid";
import { PinkLampOverlay } from "@/components/ui/pink-lamp-overlay";

type Answer = "YES" | "NO";

type Question = {
  key: string;
  text: string;
};

type SonarToast = {
  id: number;
  text: string;
};

const FUNNY_TOASTS = [
  "Reconsider... YES is warmer.",
  "That NO looks tired. Try YES.",
  "Plot twist: YES is the correct answer.",
  "NO keeps running. YES is right there.",
  "Nice try. Click YES and be brave.",
  "Be honest... you meant YES.",
  "NO said: not today. Pick YES.",
  "Stop chasing NO. Choose YES.",
];

const QUESTIONS: Question[] = [
  { key: "q1", text: "Be honest, who's your favorite person and why is it me?" },
  { key: "q2", text: "Would you choose me in every timeline?" },
  { key: "q3", text: "Seems like you are free on 14 Feb?" },
  { key: "q4", text: "Will you take me out for roti on 14 Feb, and pay the bill?" },
];

const YES_TEASE_LINES = [
  "I knew it. Predictable in the best way.",
  "Called it. You never stand a chance against charm.",
  "Exactly. Your yes was loading since question one.",
  "Nice. That was the correct life decision.",
];

const PICKUP_LINES = [
  "Are you Wi-Fi? Because I am feeling a strong connection... click YES.",
  "Are you made of stars? Because my timeline still picks you.",
  "Is your calendar free on 14 Feb, or should I start convincing harder?",
  "Roti date chemistry check: say YES and let destiny cook.",
];

const FINAL_LETTER_LINES = [
  "You survived my dramatic questionnaire and still gave enough yeses to keep my ego healthy.",
  "You complain, roll your eyes, call me extra, and still keep showing up. Suspiciously loyal behavior.",
  "Official notice: on 14 Feb I expect premium roti, premium attitude, and premium payment from you.",
  "I will bring charm, chaos, and unreasonable confidence. You bring the bill. Balanced partnership.",
  "If this is not romance, it is at least high-quality comedy with excellent chemistry.",
  "This is your reminder that saying yes to me is usually your smartest decision of the day.",
];

export function InteractiveExperience() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [askedBy, setAskedBy] = useState("");
  const [selfieData, setSelfieData] = useState<string | null>(null);
  const [selfieCaptureTried, setSelfieCaptureTried] = useState(false);
  const [started, setStarted] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalProgress, setModalProgress] = useState(0);
  const [yesTeaseLine, setYesTeaseLine] = useState(YES_TEASE_LINES[0]);
  const [done, setDone] = useState(false);
  const [finalProgress, setFinalProgress] = useState(0);
  const [finalLetterLines, setFinalLetterLines] = useState(FINAL_LETTER_LINES.slice(0, 4));
  const [cameraNudgeOpen, setCameraNudgeOpen] = useState(true);
  const [cameraNudgeProgress, setCameraNudgeProgress] = useState(0);
  const [cameraEnabled, setCameraEnabled] = useState(false);

  const [noActivated, setNoActivated] = useState(false);
  const [dodgeTick, setDodgeTick] = useState(0);
  const [runaway, setRunaway] = useState(false);
  const [noTilt, setNoTilt] = useState(0);
  const [noPosition, setNoPosition] = useState(() => {
    if (typeof window === "undefined") {
      return { x: 0, y: 0 };
    }
    return { x: window.innerWidth * 0.5 + 140, y: window.innerHeight * 0.55 };
  });
  const [isHoveringYes, setIsHoveringYes] = useState(false);
  const [toasts, setToasts] = useState<SonarToast[]>([]);
  const MODAL_DURATION_MS = 5000;
  const FINAL_DURATION_MS = 10000;
  const CAMERA_NUDGE_DURATION_MS = 5000;

  const NO_HALF_WIDTH = 90;
  const NO_HALF_HEIGHT = 28;

  const clampNoTopLeft = (x: number, y: number) => {
    const minX = 8;
    const maxX = Math.max(8, window.innerWidth - 8 - NO_HALF_WIDTH * 2);
    const minY = 8;
    const maxY = Math.max(8, window.innerHeight - 8 - NO_HALF_HEIGHT * 2);
    return {
      x: Math.min(Math.max(x, minX), maxX),
      y: Math.min(Math.max(y, minY), maxY),
    };
  };

  useEffect(() => {
    const initial = clampNoTopLeft(window.innerWidth * 0.5 + 140, window.innerHeight * 0.55);
    setNoPosition(initial);

    const onResize = () => {
      setNoPosition((current) => clampNoTopLeft(current.x, current.y));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!done) return;

    setFinalProgress(0);
    const start = performance.now();
    const frameDelay = 50;
    const timer = window.setInterval(() => {
      const elapsed = performance.now() - start;
      const pct = Math.min((elapsed / FINAL_DURATION_MS) * 100, 100);
      setFinalProgress(pct);
      if (elapsed >= FINAL_DURATION_MS) {
        window.clearInterval(timer);
        window.location.href = "/";
      }
    }, frameDelay);

    return () => window.clearInterval(timer);
  }, [done]);

  useEffect(() => {
    if (!cameraNudgeOpen) return;
    setCameraNudgeProgress(0);
    const start = performance.now();
    const frameDelay = 40;
    const timer = window.setInterval(() => {
      const elapsed = performance.now() - start;
      const pct = Math.min((elapsed / CAMERA_NUDGE_DURATION_MS) * 100, 100);
      setCameraNudgeProgress(pct);
      if (elapsed >= CAMERA_NUDGE_DURATION_MS) {
        window.clearInterval(timer);
        setCameraNudgeOpen(false);
      }
    }, frameDelay);
    return () => window.clearInterval(timer);
  }, [cameraNudgeOpen]);

  const currentQuestion = QUESTIONS[questionIndex];
  const progress = useMemo(() => Math.round((questionIndex / QUESTIONS.length) * 100), [questionIndex]);
  const currentPickupLine = PICKUP_LINES[questionIndex % PICKUP_LINES.length];
  const canContinue = Boolean(name.trim() && email.trim() && askedBy.trim());

  const pushToast = (text: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current.slice(-2), { id, text }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 2000);
  };

  const pushFunnyToast = () => {
    const pick = FUNNY_TOASTS[Math.floor(Math.random() * FUNNY_TOASTS.length)];
    pushToast(pick);
  };

  const enableCameraBackground = () => {
    setCameraEnabled(true);
    setCameraNudgeOpen(false);
    pushToast("Camera mode enabled");
  };

  const captureFrontSelfie = async () => {
    try {
      console.debug("[selfie] requesting getUserMedia(facingMode=user)");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });

      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();

      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;

      // Wait for the user to be "stable" on screen before capturing.
      // We treat stability as low frame-to-frame pixel difference for a short window.
      const stableMs = 650;
      const maxWaitMs = 4500;
      const probeW = 96;
      const probeH = 72;
      const probeCanvas = document.createElement("canvas");
      probeCanvas.width = probeW;
      probeCanvas.height = probeH;
      const probeCtx = probeCanvas.getContext("2d", { willReadFrequently: true });
      let lastFrame: Uint8ClampedArray | null = null;
      let stableSince = performance.now();
      const startWait = performance.now();

      if (probeCtx) {
        while (performance.now() - startWait < maxWaitMs) {
          probeCtx.drawImage(video, 0, 0, probeW, probeH);
          const data = probeCtx.getImageData(0, 0, probeW, probeH).data;

          if (lastFrame) {
            // Sample every Nth pixel for speed.
            let sum = 0;
            const step = 16;
            for (let i = 0; i < data.length; i += step) {
              sum += Math.abs(data[i] - lastFrame[i]);
            }
            const avg = sum / (data.length / step);
            const motionThreshold = 6.2;
            if (avg > motionThreshold) {
              stableSince = performance.now();
            }
            if (performance.now() - stableSince >= stableMs) {
              break;
            }
          }

          lastFrame = new Uint8ClampedArray(data);
          await new Promise((resolve) => window.setTimeout(resolve, 110));
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        stream.getTracks().forEach((track) => track.stop());
        console.debug("[selfie] canvas context missing");
        return null;
      }
      context.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.72);
      stream.getTracks().forEach((track) => track.stop());
      console.debug("[selfie] captured", { width, height, bytes: dataUrl.length });
      return dataUrl;
    } catch {
      console.debug("[selfie] capture failed (permission denied or no camera)");
      return null;
    }
  };

  const handleStart = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !askedBy.trim()) {
      setError("Name, email, and requester are required.");
      pushToast("Fill all fields");
      return;
    }
    setError(null);
    setStarted(true);
    pushToast("Identity captured");

    if (!selfieCaptureTried) {
      setSelfieCaptureTried(true);
      void captureFrontSelfie().then((image) => {
        if (image) {
          setSelfieData(image);
          pushToast("Camera snapshot captured");
        } else {
          pushToast("No selfie captured");
        }
      });
    }
  };

  const resetEscapeState = () => {
    setNoActivated(false);
    setDodgeTick(0);
    setRunaway(false);
    setNoTilt(0);
    setNoPosition(clampNoTopLeft(window.innerWidth * 0.5 + 140, window.innerHeight * 0.55));
    setIsHoveringYes(false);
  };

  const shuffleLines = () => {
    const pool = [...FINAL_LETTER_LINES];
    for (let index = pool.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [pool[index], pool[swap]] = [pool[swap], pool[index]];
    }
    return pool.slice(0, 4);
  };

  const goToNext = () => {
    setQuestionIndex((current) => {
      const next = current + 1;
      if (next >= QUESTIONS.length) {
        setFinalLetterLines(shuffleLines());
        setDone(true);
        return current;
      }
      return next;
    });
    resetEscapeState();
  };

  const attemptDodgeFromPointer = (
    pointerX: number,
    pointerY: number,
    originTopLeft?: { x: number; y: number }
  ) => {
    if (isHoveringYes) return;
    const base = originTopLeft ?? noPosition;
    const currentCenterX = base.x + NO_HALF_WIDTH;
    const currentCenterY = base.y + NO_HALF_HEIGHT;

    const deltaX = currentCenterX - pointerX;
    const deltaY = currentCenterY - pointerY;
    const distance = Math.hypot(deltaX, deltaY);
    const dangerRadius = 170;
    if (distance > dangerRadius) return;

    const normalizedX = distance === 0 ? (Math.random() > 0.5 ? 1 : -1) : deltaX / distance;
    const normalizedY = distance === 0 ? (Math.random() > 0.5 ? 1 : -1) : deltaY / distance;
    const jump = 170 + Math.random() * 75;
    const jitterX = (Math.random() - 0.5) * 55;
    const jitterY = (Math.random() - 0.5) * 55;

    const nextCenterX = currentCenterX + normalizedX * jump + jitterX;
    const nextCenterY = currentCenterY + normalizedY * jump + jitterY;

    const rawTopLeft = { x: nextCenterX - NO_HALF_WIDTH, y: nextCenterY - NO_HALF_HEIGHT };
    let nextTopLeft = clampNoTopLeft(rawTopLeft.x, rawTopLeft.y);

    // If we got clamped to an edge/corner, force an inward re-jump to avoid sticking.
    const hitXWall = Math.abs(nextTopLeft.x - rawTopLeft.x) > 0.1;
    const hitYWall = Math.abs(nextTopLeft.y - rawTopLeft.y) > 0.1;
    if (hitXWall || hitYWall) {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const fromEdgeX = centerX - (nextTopLeft.x + NO_HALF_WIDTH);
      const fromEdgeY = centerY - (nextTopLeft.y + NO_HALF_HEIGHT);
      const inwardLen = Math.hypot(fromEdgeX, fromEdgeY) || 1;
      const inwardX = fromEdgeX / inwardLen;
      const inwardY = fromEdgeY / inwardLen;
      const inwardJump = 130 + Math.random() * 90;
      const inwardRawX = nextTopLeft.x + inwardX * inwardJump + (Math.random() - 0.5) * 36;
      const inwardRawY = nextTopLeft.y + inwardY * inwardJump + (Math.random() - 0.5) * 36;
      nextTopLeft = clampNoTopLeft(inwardRawX, inwardRawY);
    }

    setNoPosition(nextTopLeft);
    setNoTilt(normalizedX > 0 ? 6 : -6);

    setRunaway(true);
    setDodgeTick((value) => value + 1);
    pushFunnyToast();
  };

  const saveAnswer = async (answer: Answer) => {
    if (!currentQuestion || isSaving) return;
    setIsSaving(true);
    setError(null);

    let snapshot = selfieData;
    if (!snapshot && !selfieCaptureTried) {
      setSelfieCaptureTried(true);
      snapshot = await captureFrontSelfie();
      if (snapshot) {
        setSelfieData(snapshot);
      } else {
        pushToast("No selfie captured");
      }
    }

    if (answer === "YES") {
      pushToast("YES locked");
      setYesTeaseLine(YES_TEASE_LINES[Math.floor(Math.random() * YES_TEASE_LINES.length)]);
      setModalOpen(true);
      setModalProgress(0);
      const frameDelay = 40;
      const start = performance.now();
      const timer = window.setInterval(() => {
        const elapsed = performance.now() - start;
        const pct = Math.min((elapsed / MODAL_DURATION_MS) * 100, 100);
        setModalProgress(pct);
        if (elapsed >= MODAL_DURATION_MS) {
          window.clearInterval(timer);
          setModalOpen(false);
          goToNext();
        }
      }, frameDelay);
    }
    try {
      const response = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          askedBy: askedBy.trim(),
          selfieData: snapshot ?? undefined,
          questionKey: currentQuestion.key,
          questionText: currentQuestion.text,
          answer,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to save response.");
      }

      if (answer !== "YES") {
        pushToast("NO stored");
        goToNext();
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not save response.");
      pushToast("Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main
      className="relative min-h-screen w-screen overflow-hidden bg-[radial-gradient(circle_at_10%_10%,#ffc39f_0%,transparent_26%),radial-gradient(circle_at_78%_16%,#ffb7d8_0%,transparent_34%),radial-gradient(circle_at_80%_80%,#ffdd9d_0%,transparent_30%),radial-gradient(circle_at_18%_85%,#fbb7c4_0%,transparent_34%),linear-gradient(130deg,#fff0c4_0%,#ffe2ef_48%,#ffd8e4_100%)]"
      onMouseMove={(event) => {
        if (!noActivated) return;
        if (isHoveringYes) return;
        attemptDodgeFromPointer(event.clientX, event.clientY);
      }}
    >
      <section className="pointer-events-none absolute inset-0 z-0 opacity-60">
        <WebcamPixelGrid
          className="h-full w-full"
          autoStart={cameraEnabled}
          gridCols={56}
          gridRows={42}
          maxElevation={10}
          motionSensitivity={0.35}
          colorMode="webcam"
          backgroundColor="transparent"
          darken={0.08}
          borderOpacity={0.02}
        />
      </section>
      <motion.span
        aria-hidden
        animate={{ x: [0, 30, -18, 0], y: [0, -24, 12, 0], rotate: [0, 12, -9, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -top-16 right-[16%] z-10 h-64 w-64 rounded-full bg-rose-300/35 blur-3xl"
      />
      <motion.span
        aria-hidden
        animate={{ x: [0, -28, 16, 0], y: [0, 18, -12, 0], rotate: [0, -9, 9, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -bottom-20 left-[10%] z-10 h-72 w-72 rounded-full bg-orange-300/35 blur-3xl"
      />

      <AnimatePresence mode="wait">
        {!started ? (
          <motion.form
            key="start"
            onSubmit={handleStart}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="relative z-20 grid min-h-screen w-full place-items-center px-5 py-10 sm:px-10"
          >
            <fieldset className="relative w-full max-w-5xl border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.52),rgba(255,244,250,0.46))] p-8 shadow-[0_45px_120px_-50px_rgba(136,19,55,0.55)] backdrop-blur-xl sm:p-14">
              <PinkLampOverlay className="opacity-70" />
              <p className="text-sm font-black uppercase tracking-[0.22em] text-rose-900/70">Initial Identity</p>
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="mt-3 text-5xl font-black uppercase leading-[0.95] tracking-[0.03em] text-rose-950 sm:text-7xl"
              >
                Enter name and email
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.45 }}
                className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-rose-900/70 sm:text-base"
              >
                Press Enter or use Continue.
              </motion.p>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                autoComplete="name"
                className="mt-10 w-full border-b-2 border-rose-500/70 bg-white/40 py-4 text-3xl font-semibold text-rose-950 outline-none transition focus:bg-white/60 placeholder:text-rose-400 sm:text-[2rem]"
              />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@email.com"
                autoComplete="email"
                inputMode="email"
                className="mt-4 w-full border-b-2 border-rose-500/70 bg-white/40 py-4 text-3xl font-semibold text-rose-950 outline-none transition focus:bg-white/60 placeholder:text-rose-400 sm:text-[2rem]"
              />
              <input
                value={askedBy}
                onChange={(event) => setAskedBy(event.target.value)}
                placeholder="Who is asking you to fill this form?"
                className="mt-4 w-full border-b-2 border-rose-500/70 bg-white/40 py-4 text-3xl font-semibold text-rose-950 outline-none transition focus:bg-white/60 placeholder:text-rose-400 sm:text-[2rem]"
              />
              <motion.button
                type="submit"
                disabled={!canContinue}
                whileHover={canContinue ? { scale: 1.05, y: -2 } : undefined}
                whileTap={canContinue ? { scale: 0.95 } : undefined}
                animate={
                  canContinue
                    ? { boxShadow: ["0 0 0 rgba(190,24,93,0.2)", "0 0 32px rgba(190,24,93,0.4)", "0 0 0 rgba(190,24,93,0.2)"] }
                    : undefined
                }
                transition={{ boxShadow: { duration: 1.8, repeat: Infinity, ease: "easeInOut" } }}
                className="mt-8 rounded-full bg-[linear-gradient(90deg,#9f1239,#be123c,#ea580c)] px-9 py-3 text-base font-black uppercase tracking-[0.14em] text-white shadow-2xl shadow-rose-900/35 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue
              </motion.button>
              {error ? <p className="mt-4 text-sm font-semibold text-red-700">{error}</p> : null}
            </fieldset>
          </motion.form>
        ) : done ? (
          <motion.section
            key="done"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="relative z-20 grid min-h-screen w-full place-items-center px-5 py-10 sm:px-10"
          >
            <article className="relative w-full max-w-4xl border border-white/70 bg-white/55 p-10 text-center shadow-[0_35px_90px_-45px_rgba(136,19,55,0.6)] backdrop-blur-xl sm:p-14">
              <PinkLampOverlay className="opacity-65" />
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-rose-900/65">To My Favorite Problem</p>
              <h2 className="mt-3 text-4xl font-black uppercase tracking-[0.08em] text-rose-950 sm:text-6xl">A Small Letter For You</h2>
              <section className="mx-auto mt-6 max-w-3xl space-y-3 text-left text-base font-semibold leading-8 text-rose-900/80 sm:text-lg">
                <p>Dear {name},</p>
                {finalLetterLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </section>
              <p className="mt-6 text-right text-sm font-black uppercase tracking-[0.22em] text-rose-900/70">
                Yours in trouble, me
              </p>
              <section className="mt-6 h-3 w-full overflow-hidden rounded-full bg-rose-100/90">
                <motion.section
                  initial={{ width: "0%" }}
                  animate={{ width: `${finalProgress}%` }}
                  transition={{ duration: 0.15, ease: "linear" }}
                  className="h-full rounded-full bg-[linear-gradient(90deg,#be185d,#f97316,#f59e0b)]"
                />
              </section>
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-rose-900/60">
                returning home in {Math.max(0, Math.ceil((100 - finalProgress) / 10))}s
              </p>
            </article>
          </motion.section>
        ) : (
          <motion.section
            key={currentQuestion.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="relative z-20 grid min-h-screen w-full place-items-center px-5 py-10 sm:px-10"
          >
            <article className="relative w-full max-w-5xl border border-white/80 bg-white/55 p-8 shadow-[0_35px_100px_-40px_rgba(136,19,55,0.65)] backdrop-blur-2xl sm:p-12">
              <PinkLampOverlay className="opacity-65" />
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-rose-900/65">Question {questionIndex + 1} of {QUESTIONS.length}</p>
              <h2 className="mt-4 text-4xl font-black uppercase leading-tight tracking-[0.04em] text-rose-950 sm:text-7xl">{currentQuestion.text}</h2>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-rose-900/70">{currentPickupLine}</p>

              <motion.button
                type="button"
                whileHover={{ scale: 1.08, rotate: -1 }}
                whileTap={{ scale: 0.94 }}
                animate={{ boxShadow: ["0 0 0 rgba(190,24,93,0.15)", "0 0 34px rgba(190,24,93,0.45)", "0 0 0 rgba(190,24,93,0.15)"] }}
                transition={{ boxShadow: { duration: 1.8, repeat: Infinity, ease: "easeInOut" } }}
                onClick={() => void saveAnswer("YES")}
                disabled={isSaving}
                className="mt-8 rounded-full bg-rose-700 px-8 py-3 text-lg font-black uppercase tracking-[0.12em] text-white shadow-2xl shadow-rose-800/35"
              >
                YES
              </motion.button>

              <motion.button
                type="button"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: noActivated ? 0 : 1, y: 0 }}
                transition={{ duration: 0.3 }}
                onMouseEnter={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  const anchored = { x: rect.left, y: rect.top };
                  setNoPosition(anchored);
                  setNoActivated(true);
                  pushFunnyToast();
                  attemptDodgeFromPointer(event.clientX, event.clientY, anchored);
                }}
                onClick={() => void saveAnswer("NO")}
                disabled={isSaving}
                className="ml-4 mt-8 rounded-full border border-rose-800/60 bg-white/95 px-9 py-3 text-base font-black uppercase tracking-[0.14em] text-rose-900 shadow-xl"
              >
                NO
              </motion.button>

              <p className="mt-8 text-xs font-bold uppercase tracking-[0.28em] text-rose-900/60">Progress {progress}%</p>
              {error ? <p className="mt-3 text-sm font-semibold text-red-700">{error}</p> : null}
            </article>

            <motion.button
              type="button"
              animate={{
                x: noPosition.x,
                y: noPosition.y,
                rotate: runaway ? noTilt : 0,
                scale: runaway ? 1.02 : 1,
              }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
              transition={{
                x: { type: "spring", stiffness: 130, damping: 22, mass: 1.15 },
                y: { type: "spring", stiffness: 130, damping: 22, mass: 1.15 },
                rotate: { type: "spring", stiffness: 180, damping: 20, mass: 0.9 },
                scale: { type: "spring", stiffness: 220, damping: 24, mass: 0.85 },
              }}
              onMouseMove={(event) => {
                if (!noActivated) return;
                if (isHoveringYes) return;
                attemptDodgeFromPointer(event.clientX, event.clientY);
              }}
              onClick={() => void saveAnswer("NO")}
              disabled={isSaving}
              className={`${noActivated ? "fixed left-0 top-0 z-40" : "hidden"} rounded-full border border-rose-800/60 bg-white/95 px-9 py-3 text-base font-black uppercase tracking-[0.14em] text-rose-900 shadow-2xl backdrop-blur-md`}
            >
              NO
            </motion.button>

            {noActivated ? (
              <motion.p
                key={dodgeTick}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="pointer-events-none fixed bottom-8 right-8 z-30 text-xs font-bold uppercase tracking-[0.24em] text-rose-900/70"
              >
                no dodged {dodgeTick} times
              </motion.p>
            ) : null}
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cameraNudgeOpen ? (
          <>
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[58] bg-white/20 backdrop-blur-md"
            />
            <motion.dialog
              open
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.32, ease: "easeOut" }}
              className="fixed left-1/2 top-1/2 z-[59] w-[min(94vw,680px)] -translate-x-1/2 -translate-y-1/2 border border-white/80 bg-white/80 p-7 shadow-[0_35px_100px_-40px_rgba(136,19,55,0.75)] backdrop-blur-2xl"
            >
              <PinkLampOverlay className="opacity-70" />
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-rose-900/65">Dynamic Background</p>
              <h3 className="mt-2 text-3xl font-black uppercase tracking-[0.08em] text-rose-950 sm:text-4xl">Allow camera for live vibe</h3>
              <p className="mt-3 text-sm font-semibold uppercase tracking-[0.14em] text-rose-900/70">
                Enable camera to unlock reactive background motion and better feel.
              </p>
              <section className="mt-5 h-3 w-full overflow-hidden rounded-full bg-rose-100/90">
                <motion.section
                  initial={{ width: "0%" }}
                  animate={{ width: `${cameraNudgeProgress}%` }}
                  transition={{ duration: 0.15, ease: "linear" }}
                  className="h-full rounded-full bg-[linear-gradient(90deg,#be185d,#f97316,#f59e0b)]"
                />
              </section>
              <section className="mt-5 flex flex-wrap items-center gap-3">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={enableCameraBackground}
                  className="rounded-full bg-rose-700 px-6 py-2 text-sm font-black uppercase tracking-[0.12em] text-white shadow-xl shadow-rose-800/30"
                >
                  Enable camera
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setCameraNudgeOpen(false)}
                  className="rounded-full border border-rose-700/45 bg-white/70 px-5 py-2 text-xs font-bold uppercase tracking-[0.14em] text-rose-900"
                >
                  Maybe later
                </motion.button>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-900/60">
                  auto-closes in {Math.max(0, Math.ceil((100 - cameraNudgeProgress) / 20))}s
                </p>
              </section>
            </motion.dialog>
          </>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {toasts.length > 0 ? (
          <section className="pointer-events-none fixed right-5 top-5 z-[70] space-y-2">
            <AnimatePresence>
              {toasts.map((toast) => (
                <motion.article
                  key={toast.id}
                  initial={{ opacity: 0, x: 28, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.92 }}
                  className="relative overflow-hidden border border-rose-300/70 bg-white/85 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-rose-900 shadow-xl backdrop-blur-md"
                >
                  <motion.span
                    aria-hidden
                    className="absolute inset-0 rounded-full border border-rose-400/35"
                    animate={{ scale: [0.7, 1.55], opacity: [0.45, 0] }}
                    transition={{ duration: 1.1, ease: "easeOut" }}
                  />
                  <span className="relative z-10">{toast.text}</span>
                </motion.article>
              ))}
            </AnimatePresence>
          </section>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {modalOpen ? (
          <>
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-45 bg-white/20 backdrop-blur-md"
            />
            <motion.dialog
              open
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 18 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="fixed left-1/2 top-1/2 z-50 w-[min(94vw,640px)] -translate-x-1/2 -translate-y-1/2 border border-white/80 bg-white/78 p-7 shadow-[0_35px_100px_-45px_rgba(136,19,55,0.7)] backdrop-blur-2xl"
            >
              <PinkLampOverlay className="opacity-70" />
              <h3 className="text-3xl font-black uppercase tracking-[0.08em] text-rose-950 sm:text-4xl">YES captured</h3>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-rose-900/70">{yesTeaseLine}</p>
              <section className="mt-4 flex flex-wrap gap-2">
                <motion.span
                  animate={{ y: [0, -3, 0], rotate: [0, -4, 0] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                  className="rounded-full border border-rose-300/70 bg-white/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-rose-900"
                >
                  spark
                </motion.span>
                <motion.span
                  animate={{ y: [0, -3, 0], rotate: [0, 4, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
                  className="rounded-full border border-rose-300/70 bg-white/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-rose-900"
                >
                  wink
                </motion.span>
                <motion.span
                  animate={{ y: [0, -3, 0], rotate: [0, -3, 0] }}
                  transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                  className="rounded-full border border-rose-300/70 bg-white/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-rose-900"
                >
                  boom
                </motion.span>
              </section>
              <section className="mt-5 h-4 w-full overflow-hidden rounded-full bg-rose-100/90">
                <motion.section
                  initial={{ width: "0%" }}
                  animate={{ width: `${modalProgress}%` }}
                  transition={{ duration: 0.15, ease: "linear" }}
                  className="h-full rounded-full bg-[linear-gradient(90deg,#be185d,#f97316,#f59e0b)]"
                />
              </section>
              <p className="mt-3 text-right text-xs font-bold uppercase tracking-[0.28em] text-rose-900/60">
                {Math.round(modalProgress)}%
              </p>
            </motion.dialog>
          </>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
