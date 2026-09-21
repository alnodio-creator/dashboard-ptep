"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Layers3, MapPinned, TrendingUp } from "lucide-react";
import { ReactNode } from "react";

export function DescriptionCardZona({
  label,
  totalValue,
  value,
  logo = <Building2 className="size-5" />,
}: {
  label: string;
  totalValue: number | string;
  value?: number;
  logo?: ReactNode;
}) {
  const positive = value !== undefined && value >= 0;

  return (
    <Card className="group relative h-full overflow-hidden border-border/50 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <CardContent className="relative p-5">
        {/* Decorative background */}
        <div className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-violet-500/5 transition-transform duration-500 group-hover:scale-125" />

        {/* Header */}
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex min-h-[48px] flex-1 flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                {label}
              </span>

              <Badge
                variant="secondary"
                className="rounded-md px-2 py-0.5 text-[10px] font-medium"
              >
                ZNT
              </Badge>
            </div>
          </div>

          {/* Icon */}
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-violet-200/60 bg-violet-50 text-violet-600 shadow-sm dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-400">
            {logo}
          </div>
        </div>

        {/* Main Value */}
        <div className="relative mt-4">
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold tracking-tight text-foreground">
              {totalValue}
            </p>

            <span className="mb-1 text-sm font-medium text-muted-foreground">
              Zona
            </span>
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Layers3 className="size-3.5" />
            <span>Total zona yang terdata</span>
          </div>
        </div>

        {/* Bottom Information */}
        <div className="relative mt-5 flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-background shadow-sm">
              <MapPinned className="size-3.5 text-violet-500" />
            </div>

            <div className="leading-tight">
              <p className="text-[11px] font-medium text-muted-foreground">
                Data Wilayah
              </p>
              <p className="text-xs font-semibold text-foreground">
                Zona Nilai Tanah
              </p>
            </div>
          </div>

          {value !== undefined && (
            <Badge
              variant="outline"
              className={
                positive
                  ? "border-emerald-200 bg-emerald-50 font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
                  : "border-rose-200 bg-rose-50 font-medium text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400"
              }
            >
              <TrendingUp className="mr-1 size-3" />
              {positive ? "+" : ""}
              {value.toFixed(1)}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
