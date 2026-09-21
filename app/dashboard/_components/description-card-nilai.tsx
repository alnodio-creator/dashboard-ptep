"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowUpRight,
  ChartNoAxesCombined,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { ReactNode } from "react";

export function DescriptionCardTotalNilai({
  label,
  totalValue,
  value,
  logo = <ChartNoAxesCombined className="size-5" />,
}: {
  label: string;
  totalValue: number | string;
  value?: number | string;
  logo?: ReactNode;
}) {
  return (
    <Card className="group relative h-full overflow-hidden border-border/50 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <CardContent className="relative p-5">
        {/* Decorative Background */}
        <div className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-blue-500/5 transition-transform duration-500 group-hover:scale-125" />

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
                TOTAL
              </Badge>
            </div>
          </div>

          {/* Icon */}
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-blue-200/60 bg-blue-50 text-blue-600 shadow-sm dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
            {logo}
          </div>
        </div>

        {/* Main Value */}
        <div className="relative mt-4">
          <p className="text-3xl font-bold tracking-tight text-foreground">
            {totalValue}
          </p>

          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ChartNoAxesCombined className="size-3.5 text-blue-500" />
            <span>Total nilai tanah</span>
          </div>
        </div>

        {/* Bottom Information */}
        <div className="relative mt-5 flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-background shadow-sm">
              <TrendingUp className="size-3.5 text-blue-500" />
            </div>

            <div className="leading-tight">
              <p className="text-[11px] font-medium text-muted-foreground">
                Pertumbuhan
              </p>

              <p className="text-xs font-semibold text-foreground">
                {Number(value).toFixed(2) ?? 0}%
              </p>
            </div>
          </div>

          <Badge
            variant="outline"
            className="border-blue-200 bg-blue-50 font-medium text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400"
          >
            <ArrowUpRight className="mr-1 size-3" />
            Total
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
