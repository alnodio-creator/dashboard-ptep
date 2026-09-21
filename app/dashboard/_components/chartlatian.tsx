"use client";

import { Cell, Pie, PieChart, Sector } from "recharts";
import type { PieSectorShapeProps } from "recharts/types/polar/Pie";
import { BarChart3, Layers3, Trophy } from "lucide-react";

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
} from "@/components/ui/chart";

import { chartConfig } from "@/constants/auth-constants";

/* =========================================================
   ZONE COLORS
========================================================= */

const ZONE_COLORS: Record<string, string> = {
  Residential: "#eab308",
  Commercial: "#ef4444",
  Industrial: "#f97316",
  Rural: "#22c55e",
  Other: "#3b82f6",
  Lainnya: "#8b5cf6",
};

/* =========================================================
   TYPE
========================================================= */

type ChartDataItem = {
  JumlahZonaSekarang: number;
  JumlahZonaSebelumnya: number;
  TahunSebelumnya: number;
  TahunSekarang: number;
  gunalahan: string;
  kenaikan: number;
};

/* =========================================================
   COMPONENT
========================================================= */

export function ChartPieDonutActive({
  data,
  Title,
  Tahun,
}: {
  data: ChartDataItem[];
  Title: string;
  Tahun: number;
}) {
  /* Total zona */
  const totalZona = data.reduce(
    (total, item) => total + item.JumlahZonaSekarang,
    0,
  );

  /* Kategori dengan jumlah zona terbesar */
  const activeIndex = data.reduce(
    (maxIndex, item, index, arr) =>
      item.JumlahZonaSekarang > arr[maxIndex].JumlahZonaSekarang
        ? index
        : maxIndex,
    0,
  );

  console.log(activeIndex);

  const activeItem = data[activeIndex];

  return (
    <Card className="overflow-hidden rounded-2xl border-border/50 bg-card shadow-sm transition-all duration-300 hover:shadow-md">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <CardHeader className="border-b border-border/50 px-5 py-4 lg:px-6">
        <div className="flex items-center justify-between gap-4">
          {/* Title */}
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
              <Layers3 className="size-5" />
            </div>

            <div className="min-w-0">
              <CardTitle className="truncate text-base font-bold tracking-tight">
                {Title}
              </CardTitle>

              <CardDescription className="mt-0.5 text-xs font-medium">
                Distribusi jumlah zona tahun {Tahun}
              </CardDescription>
            </div>
          </div>

          {/* Year badge */}
          <div className="hidden shrink-0 items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 py-1.5 sm:flex">
            <BarChart3 className="size-3.5 text-blue-600 dark:text-blue-400" />

            <span className="text-xs font-semibold text-muted-foreground">
              {Tahun}
            </span>
          </div>
        </div>
      </CardHeader>

      {/* =====================================================
          CHART
      ===================================================== */}

      <CardContent className="px-5 pb-3 pt-5">
        <div className="relative mx-auto w-full max-w-85">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square w-full"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />

              <Pie
                data={data}
                dataKey="JumlahZonaSekarang"
                nameKey="gunalahan"
                innerRadius={72}
                outerRadius={112}
                paddingAngle={3}
                cornerRadius={5}
                strokeWidth={3}
                stroke="hsl(var(--background))"
                shape={({
                  index,
                  outerRadius = 0,
                  ...props
                }: PieSectorShapeProps) =>
                  index === activeIndex ? (
                    <Sector {...props} outerRadius={outerRadius + 8} />
                  ) : (
                    <Sector {...props} outerRadius={outerRadius} />
                  )
                }
              >
                {data.map((entry) => (
                  <Cell
                    key={`cell-${entry.gunalahan}`}
                    fill={ZONE_COLORS[entry.gunalahan] ?? "#94a3b8"}
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>

          {/* =================================================
              CENTER CONTENT
          ================================================= */}

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <div className="mb-1 flex size-9 items-center justify-center rounded-full bg-muted/60">
              <Layers3 className="size-4 text-muted-foreground" />
            </div>

            <p className="text-3xl font-bold tracking-tight">
              {totalZona.toLocaleString("id-ID")}
            </p>

            <p className="text-xs font-medium text-muted-foreground">
              Total Zona
            </p>
          </div>
        </div>

        {/* =================================================
            TOP CATEGORY
        ================================================= */}

        {activeItem && (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: `${ZONE_COLORS[activeItem.gunalahan] ?? "#94a3b8"}20`,
                  color: ZONE_COLORS[activeItem.gunalahan] ?? "#94a3b8",
                }}
              >
                <Trophy className="size-4" />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-medium text-muted-foreground">
                  Zona terbanyak
                </p>

                <p className="truncate text-sm font-bold">
                  {activeItem.gunalahan}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm font-bold tabular-nums">
                {activeItem.JumlahZonaSekarang.toLocaleString("id-ID")}
              </p>

              <p className="text-[11px] text-muted-foreground">zona</p>
            </div>
          </div>
        )}
      </CardContent>

      {/* =====================================================
          LEGEND
      ===================================================== */}

      <CardFooter className="flex-col gap-1 border-t border-border/50 bg-muted/10 px-5 py-4 lg:px-6">
        <div className="mb-2 flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <BarChart3 className="size-3.5" />
            </div>

            <span className="text-xs font-semibold">Distribusi Zona</span>
          </div>

          <span className="text-[11px] font-medium text-muted-foreground">
            {data.length} kategori
          </span>
        </div>

        {data.map((item) => {
          const color = ZONE_COLORS[item.gunalahan] ?? "#94a3b8";

          const percentage =
            totalZona > 0 ? (item.JumlahZonaSekarang / totalZona) * 100 : 0;

          return (
            <div
              key={item.gunalahan}
              className="
                flex
                w-full
                items-center
                justify-between
                rounded-lg
                px-2
                py-2
                transition-all
                duration-200
                hover:bg-muted/50
              "
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="size-2.5 shrink-0 rounded-full ring-2 ring-background"
                  style={{
                    backgroundColor: color,
                  }}
                />

                <span className="truncate text-sm font-medium">
                  {item.gunalahan}
                </span>
              </div>

              <div className="ml-4 flex shrink-0 items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground">
                  {percentage.toFixed(1)}%
                </span>

                <span className="min-w-16 text-right text-sm font-bold tabular-nums">
                  {item.JumlahZonaSekarang.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          );
        })}
      </CardFooter>
    </Card>
  );
}
