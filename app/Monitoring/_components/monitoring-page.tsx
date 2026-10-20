"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Activity,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Filter,
  MapPin,
  RefreshCw,
  Search,
  Wallet,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { SummaryCard } from "./summary-card";
import { FilterSelect } from "./filter-select";
import { MonitoringChart } from "./chart-monitoring";
import { formatRupiah } from "@/constants/auth-constants";
import { formatNumber } from "@/data/land-values";
import { MonitoringActivityTable } from "./MonitoringActivityTable";
import { basePath } from "@/constants/menu-sidebar";

// ======================================================
// TYPES
// ======================================================

type Kegiatan = {
  no_berkas: string | null;
  kode_kegiatan: string | null;
  nama: string | null;
  Kabupaten: string | null;
  nama_kegiatan: string | null;
  nama_tahapan: string | null;
  anggaran_tahun: number | null;
  anggaran: string | number | null;
  target_luasan: number | null;
  nama_anggaran: string | null;
  skala: string | null;
  nomor_kontrak: string | null;
  jenis_kontrak: string | null;
  nama_perusahaan: string | null;
  penanggung_jawab: string | null;
};

type ApiResponse = {
  success: boolean;
  total: number;
  data: Kegiatan[];
  message?: string;
};

type FilterState = {
  wilayah: string;
  tahun: string;
  sumber: string;
  tahapan: string;
};

const PAGE_SIZE = 10;

// ======================================================
// HELPERS
// ======================================================

export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;

  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

// ======================================================
// ACTIVITY SECTION
// ======================================================

function ActivitySection({
  title,
  description,
  data,
  type,
}: {
  title: string;
  description: string;
  data: Kegiatan[];
  type: "01" | "02";
}) {
  const totalAnggaran = data.reduce(
    (total, item) => total + toNumber(item.anggaran),
    0,
  );

  const totalLuasan = data.reduce(
    (total, item) => total + toNumber(item.target_luasan),
    0,
  );

  const totalSelesai = data.filter(
    (item) => normalize(item.nama_tahapan) === "selesai",
  ).length;

  const sumberAnggaran = useMemo(() => {
    const grouped = new Map<string, { jumlah: number; anggaran: number }>();

    data.forEach((item) => {
      const sumber = item.nama_anggaran?.trim() || "Belum Diisi";
      const current = grouped.get(sumber) ?? {
        jumlah: 0,
        anggaran: 0,
      };

      current.jumlah += 1;
      current.anggaran += toNumber(item.anggaran);

      grouped.set(sumber, current);
    });

    return Array.from(grouped.entries()).sort(
      (a, b) => b[1].anggaran - a[1].anggaran,
    );
  }, [data]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className={`flex size-12 items-center justify-center rounded-xl ${
              type === "01"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {type === "01" ? (
              <MapPin className="size-6" />
            ) : (
              <RefreshCw className="size-6" />
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold tracking-tight">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        <Badge variant="outline" className="w-fit px-3 py-1.5 text-sm">
          Kode kegiatan {type}
        </Badge>
      </div>

      {/* Kartu ringkasan kegiatan */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Berkas"
          value={data.length.toLocaleString("id-ID")}
          description="Jumlah kegiatan sesuai filter"
          icon={<FileSpreadsheet className="size-5" />}
          color="bg-blue-100 text-blue-700"
        />

        <SummaryCard
          title="Total Anggaran"
          value={formatRupiah(totalAnggaran)}
          description="Akumulasi anggaran kegiatan"
          icon={<Wallet className="size-5" />}
          color="bg-violet-100 text-violet-700"
        />

        <SummaryCard
          title="Target Luasan"
          value={`${formatNumber(totalLuasan)}`}
          description="Akumulasi target sesuai satuan sumber"
          icon={<Activity className="size-5" />}
          color="bg-amber-100 text-amber-700"
        />

        <SummaryCard
          title="Kegiatan Selesai"
          value={totalSelesai.toLocaleString("id-ID")}
          description={`${data.length ? ((totalSelesai / data.length) * 100).toFixed(1) : "0.0"}% dari total berkas`}
          icon={<CheckCircle2 className="size-5" />}
          color="bg-emerald-100 text-emerald-700"
        />
      </div>

      {/* Rincian sumber anggaran */}
      <div className="space-y-3">
        <h3 className="text-base font-bold">Rincian Sumber Anggaran</h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sumberAnggaran.length === 0 ? (
            <Card>
              <CardContent className="p-5 text-sm text-muted-foreground">
                Belum ada data sumber anggaran.
              </CardContent>
            </Card>
          ) : (
            sumberAnggaran.map(([sumber, detail]) => (
              <Card key={sumber} className="border-border/60 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant="outline">{sumber}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {detail.jumlah.toLocaleString("id-ID")} berkas
                    </span>
                  </div>

                  <p className="mt-3 text-xl font-bold tracking-tight">
                    {formatRupiah(detail.anggaran)}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Total anggaran {sumber}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <MonitoringChart
        data={data}
        title={`Grafik ${title} berdasarkan Sumber Anggaran`}
      />

      <MonitoringActivityTable data={data} title={`Detail ${title}`} />
    </section>
  );
}

// ======================================================
// MAIN PAGE
// ======================================================

export default function MonitoringPage() {
  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState<FilterState>({
    wilayah: "Semua",
    tahun: "Semua",
    sumber: "Semua",
    tahapan: "Semua",
  });

  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ApiResponse>({
    queryKey: ["Data_Kantah"],
    queryFn: async () => {
      const result = await fetch(`${basePath}/api/berkas-sipenta`);

      if (!result.ok) {
        throw new Error("Gagal mengambil data berkas SIPENTA");
      }

      const json: ApiResponse = await result.json();

      if (!json.success) {
        throw new Error(json.message || "API mengembalikan status gagal");
      }

      return json;
    },
  });

  const data = response?.data ?? [];

  const wilayahOptions = useMemo(
    () =>
      Array.from(
        new Set(data.map((item) => item.nama).filter((v): v is string => !!v)),
      ).sort((a, b) => a.localeCompare(b, "id")),
    [data],
  );

  const tahunOptions = useMemo(
    () =>
      Array.from(
        new Set(
          data
            .map((item) => item.anggaran_tahun)
            .filter((v): v is number => v !== null),
        ),
      )
        .sort((a, b) => b - a)
        .map(String),
    [data],
  );

  const sumberOptions = useMemo(
    () =>
      Array.from(
        new Set(
          data
            .map((item) => item.nama_anggaran?.trim())
            .filter((v): v is string => !!v),
        ),
      ).sort((a, b) => a.localeCompare(b, "id")),
    [data],
  );

  const tahapanOptions = useMemo(
    () =>
      Array.from(
        new Set(
          data
            .map((item) => item.nama_tahapan?.trim())
            .filter((v): v is string => !!v),
        ),
      ).sort((a, b) => a.localeCompare(b, "id")),
    [data],
  );

  const filteredData = useMemo(() => {
    const keyword = normalize(search);

    return data.filter((item) => {
      const matchesSearch =
        !keyword ||
        [
          item.no_berkas,
          item.nama,
          item.Kabupaten,
          item.nama_kegiatan,
          item.nama_tahapan,
          item.nomor_kontrak,
          item.nama_perusahaan,
          item.penanggung_jawab,
        ].some((value) => normalize(value).includes(keyword));

      const matchesWilayah =
        filter.wilayah === "Semua" || item.nama === filter.wilayah;

      const matchesTahun =
        filter.tahun === "Semua" ||
        String(item.anggaran_tahun ?? "") === filter.tahun;

      const matchesSumber =
        filter.sumber === "Semua" ||
        (item.nama_anggaran?.trim() || "") === filter.sumber;

      const matchesTahapan =
        filter.tahapan === "Semua" ||
        (item.nama_tahapan?.trim() || "") === filter.tahapan;

      return (
        matchesSearch &&
        matchesWilayah &&
        matchesTahun &&
        matchesSumber &&
        matchesTahapan
      );
    });
  }, [data, search, filter]);

  const pembuatan = useMemo(
    () => filteredData.filter((item) => item.kode_kegiatan === "01"),
    [filteredData],
  );

  const pembaruan = useMemo(
    () => filteredData.filter((item) => item.kode_kegiatan === "02"),
    [filteredData],
  );

  const totalAnggaran = filteredData.reduce(
    (total, item) => total + toNumber(item.anggaran),
    0,
  );

  const resetFilter = () => {
    setSearch("");
    setFilter({
      wilayah: "Semua",
      tahun: "Semua",
      sumber: "Semua",
      tahapan: "Semua",
    });
  };

  return (
    <main className="min-h-screen space-y-7 bg-muted/20 p-4 md:p-6 lg:p-8">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Activity className="size-6" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Monitoring Kegiatan SIPENTA
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Monitoring pembuatan dan pembaruan Zona Nilai Tanah, anggaran,
              tahapan, dan kontrak kegiatan.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            void refetch();
            toast.info("Memperbarui data monitoring...");
          }}
          disabled={isLoading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border bg-background px-4 text-sm font-semibold shadow-sm transition-colors hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Data
        </button>
      </div>

      {/* ERROR */}
      {isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-red-800">
                Gagal memuat data monitoring
              </p>
              <p className="mt-1 text-sm text-red-700">
                {error instanceof Error
                  ? error.message
                  : "Terjadi kesalahan saat mengambil data."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-md border border-red-300 px-3 py-2 text-sm font-semibold text-red-800"
            >
              Coba Lagi
            </button>
          </CardContent>
        </Card>
      )}

      {/* GLOBAL SUMMARY */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Berkas"
          value={
            isLoading
              ? "Memuat..."
              : filteredData.length.toLocaleString("id-ID")
          }
          description="Jumlah seluruh kegiatan terfilter"
          icon={<FileSpreadsheet className="size-5" />}
          color="bg-blue-100 text-blue-700"
        />

        <SummaryCard
          title="Total Anggaran"
          value={isLoading ? "Memuat..." : formatRupiah(totalAnggaran)}
          description="Akumulasi anggaran seluruh kegiatan"
          icon={<Banknote className="size-5" />}
          color="bg-violet-100 text-violet-700"
        />

        <SummaryCard
          title="Pembuatan ZNT"
          value={isLoading ? "..." : pembuatan.length.toLocaleString("id-ID")}
          description="Kegiatan dengan kode 01"
          icon={<MapPin className="size-5" />}
          color="bg-emerald-100 text-emerald-700"
        />

        <SummaryCard
          title="Pembaruan ZNT"
          value={isLoading ? "..." : pembaruan.length.toLocaleString("id-ID")}
          description="Kegiatan dengan kode 02"
          icon={<RefreshCw className="size-5" />}
          color="bg-amber-100 text-amber-700"
        />
      </div>

      {/* FILTER */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="space-y-5 p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Filter className="size-5" />
            </div>

            <div>
              <h2 className="font-bold">Filter Data Monitoring</h2>
              <p className="text-sm text-muted-foreground">
                Filter berlaku untuk ringkasan, grafik, dan kedua tabel.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Cari Data</label>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="No. berkas, kabupaten, kontrak..."
                  className="h-11 pl-9"
                />
              </div>
            </div>

            <FilterSelect
              label="Wilayah"
              value={filter.wilayah}
              placeholder="Pilih wilayah"
              options={wilayahOptions}
              onChange={(value) =>
                setFilter((previous) => ({ ...previous, wilayah: value }))
              }
            />

            <FilterSelect
              label="Tahun Anggaran"
              value={filter.tahun}
              placeholder="Pilih tahun"
              options={tahunOptions}
              onChange={(value) =>
                setFilter((previous) => ({ ...previous, tahun: value }))
              }
            />

            <FilterSelect
              label="Sumber Anggaran"
              value={filter.sumber}
              placeholder="Pilih sumber"
              options={sumberOptions}
              onChange={(value) =>
                setFilter((previous) => ({ ...previous, sumber: value }))
              }
            />

            <FilterSelect
              label="Tahapan Kegiatan"
              value={filter.tahapan}
              placeholder="Pilih tahapan"
              options={tahapanOptions}
              onChange={(value) =>
                setFilter((previous) => ({ ...previous, tahapan: value }))
              }
            />
          </div>

          <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <CalendarDays className="size-4 text-blue-600" />
              <span className="text-muted-foreground">Data ditemukan:</span>
              <span className="font-bold">
                {filteredData.length.toLocaleString("id-ID")} berkas
              </span>
              <span className="text-muted-foreground">dari</span>
              <span className="font-semibold">
                {data.length.toLocaleString("id-ID")} berkas
              </span>
            </div>

            <button
              type="button"
              onClick={resetFilter}
              className="inline-flex h-9 items-center justify-center rounded-lg border bg-background px-3 text-sm font-semibold hover:bg-muted"
            >
              Reset Filter
            </button>
          </div>
        </CardContent>
      </Card>

      {/* LOADING */}
      {isLoading ? (
        <Card>
          <CardContent className="flex min-h-64 flex-col items-center justify-center gap-3">
            <div className="size-9 animate-spin rounded-full border-4 border-muted border-t-blue-600" />
            <p className="text-sm text-muted-foreground">
              Memuat data SIPENTA...
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* PEMBUATAN */}
          <ActivitySection
            title="Pembuatan Zona Nilai Tanah"
            description="Analisis khusus seluruh berkas kegiatan pembuatan ZNT."
            data={pembuatan}
            type="01"
          />

          {/* PEMBARUAN */}
          <ActivitySection
            title="Pembaruan Zona Nilai Tanah"
            description="Analisis khusus seluruh berkas kegiatan pembaruan ZNT."
            data={pembaruan}
            type="02"
          />
        </>
      )}

      {/* FOOTER */}
      <div className="flex flex-col gap-2 border-t pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Monitoring Kegiatan SIPENTA</p>
        <p>{response?.total ?? data.length} data tersedia dari API</p>
      </div>
    </main>
  );
}
