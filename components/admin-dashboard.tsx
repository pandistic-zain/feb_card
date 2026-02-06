"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";

type RespondentItem = {
  email: string;
  name: string;
  askedBy: string | null;
  selfieData: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { responses: number };
};

type DashboardData = {
  totalRespondents: number;
  totalSubmissions: number;
  respondents: RespondentItem[];
};

type Props = {
  slug: string;
};

export function AdminDashboard({ slug }: Props) {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{
    email: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/admin/responses", {
          cache: "no-store",
        });
        if (response.status === 401) {
          router.push(`/${slug}`);
          return;
        }
        if (!response.ok) {
          throw new Error("Failed to load dashboard.");
        }
        const payload = (await response.json()) as DashboardData;
        setData(payload);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Dashboard loading failed.",
        );
      }
    };
    void load();
  }, [router, slug]);

  const tiles = useMemo(() => data?.respondents ?? [], [data]);

  const deleteRespondent = async (email: string, name: string) => {
    const key = `${email}-${name}`;
    if (deletingKey) return;

    setDeletingKey(key);
    setError(null);
    try {
      const response = await fetch("/api/admin/responses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      if (response.status === 401) {
        router.push(`/${slug}`);
        return;
      }
      if (!response.ok) {
        throw new Error("Delete failed.");
      }

      setData((current) => {
        if (!current) return current;
        const nextRespondents = current.respondents.filter(
          (item) => !(item.email === email && item.name === name),
        );
        const removed = current.respondents.length - nextRespondents.length;
        const removedSubmissions =
          current.respondents.find(
            (item) => item.email === email && item.name === name,
          )?._count.responses ?? 0;
        return {
          ...current,
          totalRespondents: Math.max(0, current.totalRespondents - removed),
          totalSubmissions: Math.max(
            0,
            current.totalSubmissions - removedSubmissions,
          ),
          respondents: nextRespondents,
        };
      });
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Delete failed.",
      );
    } finally {
      setDeletingKey(null);
    }
  };

  const requestDeleteConfirm = (email: string, name: string) => {
    if (deletingKey) return;
    setConfirmTarget({ email, name });
  };

  const closeConfirm = () => setConfirmTarget(null);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push(`/${slug}`);
    router.refresh();
  };

  return (
    <main className="min-h-screen w-screen overflow-x-hidden bg-[radial-gradient(circle_at_10%_10%,#ffd8c2_0%,transparent_30%),radial-gradient(circle_at_85%_20%,#ffc7dc_0%,transparent_34%),linear-gradient(130deg,#fff0cc_0%,#ffe7f1_55%,#ffdee7_100%)] px-5 py-8 sm:px-10">
      <section className="mx-auto w-full max-w-6xl border border-white/75 bg-white/55 p-7 shadow-[0_35px_95px_-55px_rgba(136,19,55,0.75)] backdrop-blur-xl sm:p-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-black uppercase tracking-[0.08em] text-rose-950 sm:text-5xl">
            Response Dashboard
          </h1>
          <motion.button
            type="button"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => void handleLogout()}
            className="rounded-full border border-rose-800/65 bg-white/90 px-6 py-2 text-sm font-black uppercase tracking-[0.15em] text-rose-900"
          >
            Logout
          </motion.button>
        </header>

        {error ? (
          <p className="mt-4 text-sm font-semibold text-red-700">{error}</p>
        ) : null}

        {data ? (
          <section className="mt-7">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-rose-900/70">
              Total fills {data.totalRespondents} | Total submissions{" "}
              {data.totalSubmissions}
            </p>

            <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {tiles.map((respondent) => (
                <motion.article
                  key={`${respondent.email}-${respondent.name}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ duration: 0.25 }}
                  className="relative overflow-hidden border border-rose-200/70 bg-white/70 shadow-[0_22px_65px_-40px_rgba(136,19,55,0.65)] backdrop-blur-xl"
                >
                  <section className="relative aspect-4/3 w-full overflow-hidden bg-[radial-gradient(circle_at_20%_15%,rgba(190,24,93,0.18)_0%,transparent_46%),radial-gradient(circle_at_85%_75%,rgba(249,115,22,0.14)_0%,transparent_50%),linear-gradient(135deg,rgba(255,255,255,0.35)_0%,rgba(255,245,250,0.25)_100%)]">
                    {respondent.selfieData ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={respondent.selfieData}
                        alt={`${respondent.name} selfie`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <section className="grid h-full w-full place-items-center text-xs font-black uppercase tracking-[0.22em] text-rose-900/60">
                        no selfie
                      </section>
                    )}
                    <section className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.05)_0%,transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.0)_0%,rgba(255,245,250,0.16)_68%,rgba(255,245,250,0.55)_100%)]" />
                    <section className="absolute left-4 top-4 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/70 bg-white/65 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-rose-950 shadow-lg shadow-rose-900/10 backdrop-blur-md">
                        answered {respondent._count.responses}
                      </span>
                    </section>
                    <section className="absolute right-4 top-4">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          requestDeleteConfirm(
                            respondent.email,
                            respondent.name,
                          )
                        }
                        disabled={deletingKey !== null}
                        className="rounded-full border border-rose-800/45 bg-white/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-rose-900 shadow-lg shadow-rose-900/10 backdrop-blur-md disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingKey ===
                        `${respondent.email}-${respondent.name}`
                          ? "deleting"
                          : "delete"}
                      </motion.button>
                    </section>
                  </section>

                  <section className="border-t border-white/70 bg-white/60 p-5">
                    <header className="flex flex-wrap items-start justify-between gap-3">
                      <h2 className="text-xl font-black uppercase tracking-[0.06em] text-rose-950">
                        {respondent.name}
                      </h2>
                      {respondent.askedBy ? (
                        <span className="rounded-full border border-rose-200/70 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-rose-950 shadow-lg shadow-rose-900/10 backdrop-blur-md">
                          asked by {respondent.askedBy}
                        </span>
                      ) : null}
                    </header>
                    <p className="mt-1 text-sm font-semibold text-rose-900/75">
                      {respondent.email}
                    </p>
                    <time className="mt-4 block text-xs font-bold uppercase tracking-[0.2em] text-rose-900/60">
                      updated {new Date(respondent.updatedAt).toLocaleString()}
                    </time>
                  </section>
                </motion.article>
              ))}
            </section>
          </section>
        ) : (
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-rose-900/70">
            Loading responses...
          </p>
        )}
      </section>

      <AnimatePresence>
        {confirmTarget ? (
          <>
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-80 bg-white/20 backdrop-blur-md"
              onClick={closeConfirm}
            />
            <motion.dialog
              open
              initial={{ opacity: 0, scale: 0.94, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed left-1/2 top-1/2 z-81 w-[min(94vw,640px)] -translate-x-1/2 -translate-y-1/2 border border-white/80 bg-white/85 p-7 shadow-[0_35px_100px_-40px_rgba(136,19,55,0.75)] backdrop-blur-2xl"
            >
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-rose-900/65">
                Confirm Delete
              </p>
              <h2 className="mt-2 text-3xl font-black uppercase tracking-[0.08em] text-rose-950 sm:text-4xl">
                Delete this user?
              </h2>
              <p className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-rose-900/70">
                This will delete all stored data for {confirmTarget.name} (
                {confirmTarget.email}).
              </p>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.22em] text-rose-900/55">
                cannot be undone
              </p>
              <section className="mt-6 flex flex-wrap items-center gap-3">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    const { email, name } = confirmTarget;
                    closeConfirm();
                    void deleteRespondent(email, name);
                  }}
                  disabled={deletingKey !== null}
                  className="rounded-full bg-rose-700 px-6 py-2 text-sm font-black uppercase tracking-[0.14em] text-white shadow-xl shadow-rose-900/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  delete forever
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={closeConfirm}
                  className="rounded-full border border-rose-800/55 bg-white/80 px-6 py-2 text-xs font-black uppercase tracking-[0.16em] text-rose-900"
                >
                  cancel
                </motion.button>
              </section>
            </motion.dialog>
          </>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
