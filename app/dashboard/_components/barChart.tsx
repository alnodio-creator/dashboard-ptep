"use client";

import { BarChart3, Layers3, Trophy, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatRupiah } from "@/constants/auth-constants";

/* =========================================================
   TYPE
========================================================= */

type ChartDataItem = {
  gunalahan: string;

  TahunSebelumnya: number;
  TahunSekarang: number;

  JumlahZonaSebelumnya: number;
  JumlahZonaSekarang: number;

  kenaikan: number;
};

/* =========================================================
   CHART CONFIG
========================================================= */

const chartConfig = {
  TahunSebelumnya: {
    label: "Tahun Sebelumnya",
    color: "#cbd5e1",
  },
  TahunSekarang: {
    label: "Tahun Sekarang",
    color: "#3b82f6",
  },
} satisfies ChartConfig;

/* =========================================================
   COMPONENT
========================================================= */

export function ChartBarMultiple({
  data,
  Title,
  Tahun,
}: {
  data: ChartDataItem[];
  Title: string;
  Tahun: number;
}) {
  /* =======================================================
     TOTAL JUMLAH ZONA
  ======================================================= */

  const totalSekarang = data.reduce(
    (total, item) => total + item.TahunSekarang,
    0,
  );

  const totalSebelumnya = data.reduce(
    (total, item) => total + item.TahunSebelumnya,
    0,
  );

  /* =======================================================
     KATEGORI TERBESAR TAHUN SEKARANG
  ======================================================= */

  const activeItem = data.reduce<ChartDataItem | null>((max, item) => {
    if (!max) return item;

    return item.TahunSekarang > max.TahunSekarang ? item : max;
  }, null);

  /* =======================================================
     PERTUMBUHAN TOTAL ZONA
  ======================================================= */

  const pertumbuhan =
    totalSebelumnya === 0
      ? totalSekarang > 0
        ? 100
        : 0
      : ((totalSekarang - totalSebelumnya) / totalSebelumnya) * 100;

  return (
    <Card className="overflow-hidden rounded-2xl border-border/50 bg-card shadow-sm transition-all duration-300 hover:shadow-md">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <CardHeader className="border-b border-border/50 px-5 py-4 lg:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <BarChart3 className="size-5" />
            </div>

            <div className="min-w-0">
              <CardTitle className="truncate text-base font-bold tracking-tight">
                {Title}
              </CardTitle>

              <CardDescription className="mt-0.5 text-xs font-medium">
                Perbandingan Total Nilai Tanah berdasarkan tahun
              </CardDescription>
            </div>
          </div>

          <div className="hidden shrink-0 items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 py-1.5 sm:flex">
            <Layers3 className="size-3.5 text-blue-600 dark:text-blue-400" />

            <span className="text-xs font-semibold text-muted-foreground">
              {Tahun - 1} — {Tahun}
            </span>
          </div>
        </div>
      </CardHeader>

      {/* =====================================================
          CHART
      ===================================================== */}

      <CardContent className="px-5 pb-4 pt-5 lg:px-6">
        <ChartContainer config={chartConfig} className="h-75 w-full">
          <BarChart
            accessibilityLayer
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: -15,
              bottom: 5,
            }}
            barCategoryGap="20%"
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />

            {/* =================================================
                X AXIS
            ================================================= */}

            <XAxis
              dataKey="gunalahan"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              interval={0}
              tickFormatter={(value) =>
                value.length > 12 ? `${value.slice(0, 12)}...` : value
              }
            />

            {/* =================================================
                Y AXIS
            ================================================= */}

            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={40}
              allowDecimals={false}
            />

            {/* =================================================
                TOOLTIP
            ================================================= */}

            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />

            {/* =================================================
                TAHUN SEBELUMNYA
            ================================================= */}

            <Bar
              dataKey="TahunSebelumnya"
              fill="var(--color-TahunSebelumnya)"
              radius={[4, 4, 0, 0]}
            />

            {/* =================================================
                TAHUN SEKARANG
            ================================================= */}

            <Bar
              dataKey="TahunSekarang"
              fill="var(--color-TahunSekarang)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>

        {/* ===================================================
            TOTAL COMPARISON
        =================================================== */}

        <div className="mt-4 grid grid-cols-2 gap-3">
          {/* Tahun sebelumnya */}

          <div className="rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
            <p className="text-[11px] font-medium text-muted-foreground">
              Total {Tahun - 1}
            </p>

            <p className="mt-1 text-lg font-bold tabular-nums">
              {totalSebelumnya.toLocaleString("id-ID")}
            </p>
          </div>

          {/* Tahun sekarang */}

          <div className="rounded-xl border border-blue-200/60 bg-blue-50/50 px-4 py-3 dark:border-blue-500/20 dark:bg-blue-500/5">
            <p className="text-[11px] font-medium text-muted-foreground">
              Total {Tahun}
            </p>

            <p className="mt-1 text-lg font-bold tabular-nums text-blue-600 dark:text-blue-400">
              {totalSekarang.toLocaleString("id-ID")}
            </p>
          </div>
        </div>
      </CardContent>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <CardFooter className="flex-col gap-3 border-t border-border/50 bg-muted/10 px-5 py-4 lg:px-6">
        {/* Growth */}

        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <TrendingUp className="size-3.5" />
            </div>

            <span className="text-xs font-semibold">Perubahan Total Zona</span>
          </div>

          <span
            className={`text-sm font-bold tabular-nums ${
              pertumbuhan >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {pertumbuhan >= 0 ? "+" : ""}
            {pertumbuhan.toFixed(1)}%
          </span>
        </div>

        {/* Top Category */}

        {activeItem && (
          <div className="flex w-full items-center justify-between rounded-xl border border-border/50 bg-background/60 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                <Trophy className="size-4" />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-medium text-muted-foreground">
                  Total Nilai tahun {Tahun}
                </p>

                <p className="truncate text-sm font-bold">
                  {activeItem.gunalahan}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm font-bold tabular-nums">
                {formatRupiah(activeItem.TahunSekarang)}
              </p>

              <p className="text-[11px] text-muted-foreground">Rupiah</p>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
