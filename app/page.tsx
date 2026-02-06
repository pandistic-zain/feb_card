import { ValentineCard } from "@/components/valentine-card";

export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-5 sm:p-10">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,#ffdce9_0%,#ffb7d7_30%,#ffc8d9_55%,#ffe1ec_100%)]" />
      <div className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full bg-rose-300/60 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-14 h-80 w-80 rounded-full bg-pink-200/70 blur-3xl" />
      <ValentineCard />
    </main>
  );
}
