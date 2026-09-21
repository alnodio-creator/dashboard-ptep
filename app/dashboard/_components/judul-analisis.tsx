import { CircleHelp } from "lucide-react";

export function JudulAnalisis({ nama }: { nama?: string }) {
  return (
    <div className="relative mb-8 overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur-sm lg:p-8 dark:border-slate-800 dark:bg-slate-900/70">
      <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-sky-100/50 blur-3xl dark:bg-sky-900/20" />

      <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
            Land Value Analytics
          </div>

          <h2 className="max-w-3xl text-balance text-xl font-semibold tracking-tight text-slate-900 lg:text-3xl dark:text-white">
            Analisis Nilai Tanah di {nama}
          </h2>

          <p className="mt-3 max-w-2xl text-pretty leading-6 text-slate-500 dark:text-slate-400">
            Explore changes in assessed land value across major property zones
            for the selected local government area.
          </p>
        </div>

        <div className="flex w-fit items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-3 py-2 text-xs font-medium text-emerald-700 backdrop-blur-sm dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
          Gambaran Perhitungan
          <CircleHelp className="size-3.5" />
        </div>
      </div>
    </div>
  );
}
