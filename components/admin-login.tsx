"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type Props = {
  slug: string;
};

export function AdminLogin({ slug }: Props) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        setError("Invalid credentials.");
        return;
      }

      router.push(`/${slug}/dashboard`);
      router.refresh();
    } catch {
      setError("Login request failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen w-screen place-items-center overflow-hidden bg-[radial-gradient(circle_at_20%_15%,#ffdabf_0%,transparent_32%),radial-gradient(circle_at_80%_20%,#ffcadf_0%,transparent_36%),linear-gradient(125deg,#fff4d4_0%,#ffeaf3_52%,#ffe2ea_100%)] px-5 py-10 sm:px-10">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-3xl border border-white/75 bg-white/55 p-8 shadow-[0_40px_100px_-55px_rgba(136,19,55,0.75)] backdrop-blur-xl sm:p-12"
      >
        <fieldset>
          <legend className="text-xs font-bold uppercase tracking-[0.34em] text-rose-900/65">Hidden Gate</legend>
          <h1 className="mt-3 text-4xl font-black uppercase leading-tight tracking-[0.04em] text-rose-950 sm:text-6xl">Type creds then hit Enter</h1>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-rose-900/70">Press Enter or use Continue.</p>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Admin username"
            autoComplete="username"
            className="mt-8 w-full border-b-2 border-rose-500/60 bg-transparent py-3 text-2xl font-semibold text-rose-950 outline-none placeholder:text-rose-400"
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Admin password"
            type="password"
            autoComplete="current-password"
            className="mt-4 w-full border-b-2 border-rose-500/60 bg-transparent py-3 text-2xl font-semibold text-rose-950 outline-none placeholder:text-rose-400"
          />
          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={!isLoading ? { scale: 1.04, y: -1 } : undefined}
            whileTap={!isLoading ? { scale: 0.96 } : undefined}
            className="mt-8 rounded-full bg-[linear-gradient(90deg,#9f1239,#be123c,#ea580c)] px-8 py-3 text-sm font-black uppercase tracking-[0.16em] text-white shadow-2xl shadow-rose-900/35 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue
          </motion.button>
          {isLoading ? <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-rose-900/70">Authenticating...</p> : null}
          {error ? <p className="mt-3 text-sm font-semibold text-red-700">{error}</p> : null}
        </fieldset>
      </motion.form>
    </main>
  );
}
