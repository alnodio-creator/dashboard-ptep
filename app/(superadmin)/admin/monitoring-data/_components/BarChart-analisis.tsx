"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { TypeMonitoringAnomaliData } from "@/constants/useForm";
import { formatRupiah } from "@/constants/auth-constants";

type BarCharAnalisisProps = {
  data: TypeMonitoringAnomaliData[];
  isLoading?: boolean;
};

export default function BarCharAnalisis({
  data,
  isLoading = false,
}: BarCharAnalisisProps) {
  const chartData = [...data]
    .sort((a, b) => {
      if (!a.validsampai) return 1;
      if (!b.validsampai) return -1;

      return (
        new Date(a.validsampai).getTime() - new Date(b.validsampai).getTime()
      );
    })
    .map((item) => ({
      tanggal: item.validsampai
        ? new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }).format(new Date(item.validsampai))
        : "Masih Aktif",

      total: item.total_nilai_tanah ?? 0,
    }));

  return (
    <div className="w-full rounded-xl border bg-background p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Pertumbuhan Nilai Tanah</h3>

        <p className="text-sm text-muted-foreground">
          Perkembangan total nilai tanah berdasarkan masa berlaku peta
        </p>
      </div>

      <div className="h-[400px] w-full">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />

              <p className="text-sm text-muted-foreground">
                Memuat data grafik...
              </p>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Tidak ada data untuk ditampilkan
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 30,
                bottom: 30,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="tanggal"
                tick={{ fontSize: 12 }}
                angle={-30}
                textAnchor="end"
                height={70}
              />

              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatRupiah(Number(value))}
              />

              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                  backgroundColor: "hsl(var(--background))",
                }}
                formatter={(value) => [
                  formatRupiah(Number(value)),
                  "Total Nilai Tanah",
                ]}
                labelFormatter={(label) => `Valid Sampai: ${label}`}
              />

              <Line
                type="monotone"
                dataKey="total"
                name="Total Nilai Tanah"
                strokeWidth={3}
                dot={{
                  r: 6,
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 9,
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
