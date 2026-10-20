import { useMemo } from "react";
import { Kegiatan } from "../types/type";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatRupiah } from "@/constants/auth-constants";
import { formatNumber } from "@/data/land-values";

export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;

  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

export function MonitoringChart({
  data,
  title,
}: {
  data: Kegiatan[];
  title: string;
}) {
  const chartData = useMemo(() => {
    const grouped = new Map<
      string,
      { sumber: string; jumlah: number; anggaran: number }
    >();

    data.forEach((item) => {
      const sumber = item.nama_anggaran?.trim() || "Belum Diisi";

      const current = grouped.get(sumber) ?? {
        sumber,
        jumlah: 0,
        anggaran: 0,
      };

      current.jumlah += 1;
      current.anggaran += toNumber(item.anggaran);

      grouped.set(sumber, current);
    });

    return Array.from(grouped.values()).sort((a, b) => b.anggaran - a.anggaran);
  }, [data]);

  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="p-5">
        <div className="mb-5">
          <h3 className="font-bold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Perbandingan anggaran dan jumlah berkas menurut sumber anggaran
          </p>
        </div>

        <div className="h-[320px] w-full">
          {chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Tidak ada data untuk ditampilkan
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />

                <XAxis dataKey="sumber" tick={{ fontSize: 12 }} interval={0} />

                <YAxis
                  yAxisId="anggaran"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) =>
                    new Intl.NumberFormat("id-ID", {
                      notation: "compact",
                      maximumFractionDigits: 1,
                    }).format(Number(value))
                  }
                />

                <YAxis
                  yAxisId="jumlah"
                  orientation="right"
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                />

                <Tooltip
                  formatter={(value, name) => {
                    const numericValue = Number(value);

                    if (name === "Total Anggaran") {
                      return [formatRupiah(numericValue), name];
                    }

                    return [formatNumber(numericValue), name];
                  }}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--background))",
                  }}
                />

                <Legend />

                <Bar
                  yAxisId="anggaran"
                  dataKey="anggaran"
                  name="Total Anggaran"
                  fill="#2563eb"
                  radius={[5, 5, 0, 0]}
                />

                <Bar
                  yAxisId="jumlah"
                  dataKey="jumlah"
                  name="Jumlah Berkas"
                  fill="#10b981"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
