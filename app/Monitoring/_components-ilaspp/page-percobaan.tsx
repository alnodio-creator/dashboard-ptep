"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Filter,
  RefreshCw,
  Search,
} from "lucide-react";

import { basePath } from "@/constants/menu-sidebar";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ======================================================
// TYPES
// ======================================================

type Tahapan = {
  tahapan_kegiatan_id: number;
  nama_tahapan: string;
  bobot: number;
  ord: number;
  total: number;
  sesuai: number;
  tidak_sesuai: number;
  belum_diperiksa: number;
  sesuai_kesepakatan_teknis: number;
  butuh_perbaikan: number;
};

type BerkasQC = {
  berkas_id: string;
  no_berkas: string | null;
  kode_kegiatan: string | null;
  nama_kegiatan: string | null;
  anggaran_tahun: number | null;
  current_tahapan_id: number | null;
  current_tahapan_nama: string | null;
  is_selesai: boolean;
  penanggung_jawab: string | null;
  nama_perusahaan: string | null;
  nama_wilayah: string | null;
  jenis_kontrak: string | null;
  tahapan: Tahapan[];
};

type ApiResponse = {
  success: boolean;
  total: number;
  data: BerkasQC[];
  message?: string;
};

type ActivityGroup = {
  kode: string;
  nama: string;
  data: BerkasQC[];
};

const PAGE_SIZE = 15;

// ======================================================
// HELPERS
// ======================================================

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number) {
  return `${formatNumber(value)}%`;
}

function getActivityName(item: BerkasQC) {
  const names: Record<string, string> = {
    "01": "Pembuatan Zona Nilai Tanah",
    "02": "Pembaruan Zona Nilai Tanah",
    "03": "Pembuatan Nilai Bidang Tanah",
    "04": "Pembaruan Nilai Bidang Tanah",
  };

  return (
    names[item.kode_kegiatan ?? ""] ?? item.nama_kegiatan ?? "Kegiatan Lainnya"
  );
}

function getStageContribution(stage: Tahapan) {
  if (!stage.total || stage.total <= 0) return 0;

  const progress = stage.sesuai / stage.total;

  return progress * stage.bobot;
}

function getAggregate(data: Tahapan[]) {
  return data.reduce((total, stage) => total + getStageContribution(stage), 0);
}

function getStageProgress(stage: Tahapan) {
  if (!stage.total || stage.total <= 0) return 0;

  return (stage.sesuai / stage.total) * 100;
}

// ======================================================
// SUMMARY CARD
// ======================================================

function SummaryCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="border-border/60 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>

            <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
          </div>

          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            {icon}
          </div>
        </div>

        <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

// ======================================================
// FILTER SELECT
// ======================================================

function FilterSelect({
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold">{label}</label>

      <Select
        value={value}
        onValueChange={(newValue) => {
          if (newValue !== null) onChange(newValue);
        }}
      >
        <SelectTrigger className="h-11 w-full bg-background">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="Semua">Semua</SelectItem>

          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ======================================================
// QC MONITORING TABLE
// ======================================================

function QCMonitoringTable({
  data,
  title,
  kode,
}: {
  data: BerkasQC[];
  title: string;
  kode: string;
}) {
  const [page, setPage] = useState(1);

  const stages = useMemo(() => {
    const first = data[0]?.tahapan ?? [];

    return [...first]
      .filter((stage) => normalize(stage.nama_tahapan) !== "selesai")
      .sort((a, b) => a.ord - b.ord);
  }, [data]);

  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));

  const currentPage = Math.min(page, totalPages);

  const paginatedData = data.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const totalAggregate = data.reduce(
    (sum, item) => sum + getAggregate(item.tahapan),
    0,
  );

  const averageAggregate = data.length ? totalAggregate / data.length : 0;

  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      {/* TABLE HEADER */}
      <div className="flex flex-col justify-between gap-3 border-b bg-muted/20 p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div
            className={`flex size-10 items-center justify-center rounded-xl ${
              kode === "01" || kode === "03"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            <FileSpreadsheet className="size-5" />
          </div>

          <div>
            <h3 className="font-bold">{title}</h3>

            <p className="mt-1 text-xs text-muted-foreground">
              {data.length.toLocaleString("id-ID")} berkas ditemukan
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Kode {kode}</Badge>

          <Badge
            variant="outline"
            className="border-emerald-200 bg-emerald-50 text-emerald-700"
          >
            Rata-rata agregat {formatPercent(averageAggregate)}
          </Badge>

          <Badge variant="outline">
            Halaman {currentPage} dari {totalPages}
          </Badge>
        </div>
      </div>

      {/* TABLE */}
      <div className="max-h-[680px] overflow-auto">
        <Table className="min-w-[1500px]">
          <TableHeader className="sticky top-0 z-20 bg-muted">
            {/* GROUP HEADER */}
            <TableRow>
              <TableHead rowSpan={2} className="min-w-[160px] align-middle">
                Kabupaten
              </TableHead>

              <TableHead rowSpan={2} className="min-w-[190px] align-middle">
                Perusahaan
              </TableHead>

              <TableHead rowSpan={2} className="min-w-[140px] align-middle">
                No. Berkas
              </TableHead>

              {stages.map((stage) => (
                <TableHead
                  key={stage.tahapan_kegiatan_id}
                  colSpan={4}
                  className="min-w-[360px] border-l text-center"
                >
                  <div className="font-bold text-foreground">
                    {stage.nama_tahapan}
                  </div>

                  <div className="mt-1 text-xs font-medium text-blue-600">
                    Bobot {formatPercent(stage.bobot)}
                  </div>
                </TableHead>
              ))}

              <TableHead
                rowSpan={2}
                className="min-w-[140px] border-l text-center align-middle"
              >
                Agregat Realisasi Fisik
              </TableHead>
            </TableRow>

            {/* SUB HEADER */}
            <TableRow>
              {stages.map((stage) => (
                <Fragment key={stage.tahapan_kegiatan_id}>
                  <TableHead className="border-l text-center">Sesuai</TableHead>

                  <TableHead className="text-center">Tidak Sesuai</TableHead>

                  <TableHead className="text-center">Belum Diperiksa</TableHead>

                  <TableHead className="text-center">Realisasi</TableHead>
                </Fragment>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4 + stages.length * 4}
                  className="h-32 text-center text-muted-foreground"
                >
                  Tidak ada data kegiatan.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item) => {
                const stageMap = new Map(
                  item.tahapan.map((stage) => [
                    stage.tahapan_kegiatan_id,
                    stage,
                  ]),
                );

                const aggregate = getAggregate(item.tahapan);

                return (
                  <TableRow key={item.berkas_id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">
                      {item.nama_wilayah || "-"}
                    </TableCell>

                    <TableCell className="max-w-[190px] whitespace-normal">
                      <p className="font-semibold">
                        {item.nama_perusahaan || "-"}
                      </p>

                      {item.penanggung_jawab && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.penanggung_jawab}
                        </p>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-semibold">{item.no_berkas || "-"}</p>

                        {item.is_selesai ? (
                          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                            <CheckCircle2 className="mr-1 size-3" />
                            Selesai
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            {item.current_tahapan_nama || "Belum ada tahapan"}
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {stages.map((stage) => {
                      const value = stageMap.get(stage.tahapan_kegiatan_id);

                      const sesuai = value?.sesuai ?? 0;
                      const tidakSesuai = value?.tidak_sesuai ?? 0;
                      const belum = value?.belum_diperiksa ?? 0;
                      const total = value?.total ?? 0;

                      const progress = value ? getStageProgress(value) : 0;

                      const contribution = value
                        ? getStageContribution(value)
                        : 0;

                      return (
                        <Fragment key={stage.tahapan_kegiatan_id}>
                          <TableCell className="border-l text-center font-semibold tabular-nums text-emerald-700">
                            {sesuai}
                            <span className="text-xs font-normal text-muted-foreground">
                              {" "}
                              / {total}
                            </span>
                          </TableCell>

                          <TableCell className="text-center font-semibold tabular-nums text-red-600">
                            {tidakSesuai}
                          </TableCell>

                          <TableCell className="text-center font-semibold tabular-nums text-amber-600">
                            {belum}
                          </TableCell>

                          <TableCell className="min-w-[110px] text-center">
                            <p className="font-bold tabular-nums">
                              {formatPercent(contribution)}
                            </p>

                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-emerald-500 transition-all"
                                style={{
                                  width: `${Math.min(100, Math.max(0, progress))}%`,
                                }}
                              />
                            </div>
                          </TableCell>
                        </Fragment>
                      );
                    })}

                    <TableCell className="border-l text-center">
                      <p
                        className={`text-base font-bold tabular-nums ${
                          aggregate >= 80
                            ? "text-emerald-700"
                            : aggregate >= 50
                              ? "text-amber-600"
                              : "text-red-600"
                        }`}
                      >
                        {formatPercent(aggregate)}
                      </p>

                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{
                            width: `${Math.min(100, Math.max(0, aggregate))}%`,
                          }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* PAGINATION */}
      <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Menampilkan{" "}
          {data.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
          {"–"}
          {Math.min(currentPage * PAGE_SIZE, data.length)} dari{" "}
          {data.length.toLocaleString("id-ID")} data
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((previous) => Math.max(1, previous - 1))}
            className="inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
            Sebelumnya
          </button>

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() =>
              setPage((previous) => Math.min(totalPages, previous + 1))
            }
            className="inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            Berikutnya
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}

// ======================================================
// ACTIVITY SECTION COLLAPSIBLE
// ======================================================

function ActivitySectionCollapsible({ group }: { group: ActivityGroup }) {
  const [open, setOpen] = useState(true);

  const completed = group.data.filter((item) => item.is_selesai).length;

  const average = group.data.length
    ? group.data.reduce((sum, item) => sum + getAggregate(item.tahapan), 0) /
      group.data.length
    : 0;

  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50 md:p-5"
      >
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
            group.kode === "01" || group.kode === "03"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          <Activity className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="font-bold">{group.nama}</h2>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline">Kode {group.kode}</Badge>

            <span className="text-xs text-muted-foreground">
              {group.data.length.toLocaleString("id-ID")} berkas
            </span>

            <span className="text-xs text-muted-foreground">
              {completed.toLocaleString("id-ID")} selesai
            </span>

            <span className="text-xs font-semibold text-blue-600">
              Rata-rata {formatPercent(average)}
            </span>
          </div>
        </div>

        <ChevronDown
          className={`size-5 shrink-0 text-muted-foreground transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="border-t p-3 md:p-5">
          <QCMonitoringTable
            data={group.data}
            title={`Monitoring ${group.nama}`}
            kode={group.kode}
          />
        </div>
      )}
    </section>
  );
}

// ======================================================
// MAIN PAGE
// ======================================================

export default function MonitoringQCPage() {
  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState({
    wilayah: "Semua",
    tahun: "Semua",
    kegiatan: "Semua",
  });

  // ====================================================
  // FETCH DATA
  // ====================================================

  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<ApiResponse>({
    queryKey: ["Monitoring_QC_Berkas"],

    queryFn: async () => {
      const result = await fetch(`${basePath}/api/monitoring-qc-berkas`, {
        method: "GET",
        cache: "no-store",
      });

      const json: ApiResponse = await result.json();

      if (!result.ok || !json.success) {
        throw new Error(json.message || "Gagal mengambil data monitoring QC.");
      }

      return json;
    },

    staleTime: 1000 * 60 * 2,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const data = response?.data ?? [];

  // ====================================================
  // FILTER OPTIONS
  // ====================================================

  const wilayahOptions = useMemo(
    () =>
      Array.from(
        new Set(
          data
            .map((item) => item.nama_wilayah)
            .filter((value): value is string => !!value),
        ),
      ).sort((a, b) => a.localeCompare(b, "id")),
    [data],
  );

  const tahunOptions = useMemo(
    () =>
      Array.from(
        new Set(
          data
            .map((item) => item.anggaran_tahun)
            .filter((value): value is number => value !== null),
        ),
      )
        .sort((a, b) => b - a)
        .map(String),
    [data],
  );

  const kegiatanOptions = useMemo(
    () =>
      Array.from(
        new Set(
          data
            .map((item) => item.kode_kegiatan)
            .filter((value): value is string => !!value),
        ),
      ).sort(),
    [data],
  );

  // ====================================================
  // FILTER DATA
  // ====================================================

  const filteredData = useMemo(() => {
    const keyword = normalize(search);

    return data.filter((item) => {
      const matchesSearch =
        !keyword ||
        [
          item.no_berkas,
          item.nama_wilayah,
          item.nama_perusahaan,
          item.penanggung_jawab,
          item.nama_kegiatan,
          item.current_tahapan_nama,
        ].some((value) => normalize(value).includes(keyword));

      const matchesWilayah =
        filter.wilayah === "Semua" || item.nama_wilayah === filter.wilayah;

      const matchesTahun =
        filter.tahun === "Semua" ||
        String(item.anggaran_tahun ?? "") === filter.tahun;

      const matchesKegiatan =
        filter.kegiatan === "Semua" || item.kode_kegiatan === filter.kegiatan;

      return matchesSearch && matchesWilayah && matchesTahun && matchesKegiatan;
    });
  }, [data, search, filter]);

  // ====================================================
  // GROUP BY ACTIVITY TYPE
  // ====================================================

  const activityGroups = useMemo<ActivityGroup[]>(() => {
    const grouped = new Map<string, ActivityGroup>();

    filteredData.forEach((item) => {
      const kode = item.kode_kegiatan ?? "LAINNYA";

      const current = grouped.get(kode) ?? {
        kode,
        nama: getActivityName(item),
        data: [],
      };

      current.data.push(item);
      grouped.set(kode, current);
    });

    return Array.from(grouped.values()).sort((a, b) =>
      a.kode.localeCompare(b.kode),
    );
  }, [filteredData]);

  // ====================================================
  // GLOBAL SUMMARY
  // ====================================================

  const totalSelesai = filteredData.filter((item) => item.is_selesai).length;

  const totalAggregate = filteredData.reduce(
    (sum, item) => sum + getAggregate(item.tahapan),
    0,
  );

  const averageAggregate = filteredData.length
    ? totalAggregate / filteredData.length
    : 0;

  // ====================================================
  // RESET FILTER
  // ====================================================

  const resetFilter = () => {
    setSearch("");

    setFilter({
      wilayah: "Semua",
      tahun: "Semua",
      kegiatan: "Semua",
    });
  };

  // ====================================================
  // RENDER
  // ====================================================

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
              Monitoring QC Berkas
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Monitoring kesesuaian checklist, bobot tahapan, dan agregat
              realisasi fisik kegiatan SIPENTA.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            void refetch();
            toast.info("Memperbarui data monitoring QC...");
          }}
          disabled={isFetching}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border bg-background px-4 text-sm font-semibold shadow-sm transition-colors hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh Data
        </button>
      </div>

      {/* ERROR */}
      {isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 size-5 text-red-600" />

              <div>
                <p className="font-semibold text-red-800">
                  Gagal memuat data monitoring QC
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {error instanceof Error
                    ? error.message
                    : "Terjadi kesalahan saat mengambil data."}
                </p>
              </div>
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

      {/* SUMMARY */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Berkas"
          value={
            isLoading
              ? "Memuat..."
              : filteredData.length.toLocaleString("id-ID")
          }
          description="Jumlah berkas sesuai filter"
          icon={<FileSpreadsheet className="size-5" />}
        />

        <SummaryCard
          title="Kegiatan Selesai"
          value={isLoading ? "Memuat..." : totalSelesai.toLocaleString("id-ID")}
          description="Berkas dengan tahapan penanda Selesai"
          icon={<CheckCircle2 className="size-5" />}
        />

        <SummaryCard
          title="Rata-rata Realisasi Fisik"
          value={isLoading ? "Memuat..." : formatPercent(averageAggregate)}
          description="Rata-rata agregat seluruh berkas"
          icon={<Activity className="size-5" />}
        />

        <SummaryCard
          title="Jenis Kegiatan"
          value={
            isLoading
              ? "Memuat..."
              : activityGroups.length.toLocaleString("id-ID")
          }
          description="Jumlah kelompok kegiatan ditemukan"
          icon={<Filter className="size-5" />}
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
                Filter berlaku untuk seluruh tabel dan ringkasan.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* SEARCH */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Cari Data</label>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="No. berkas, kabupaten, perusahaan..."
                  className="h-11 pl-9"
                />
              </div>
            </div>

            {/* WILAYAH */}
            <FilterSelect
              label="Kabupaten"
              value={filter.wilayah}
              placeholder="Pilih kabupaten"
              options={wilayahOptions}
              onChange={(value) =>
                setFilter((previous) => ({
                  ...previous,
                  wilayah: value,
                }))
              }
            />

            {/* TAHUN */}
            <FilterSelect
              label="Tahun Anggaran"
              value={filter.tahun}
              placeholder="Pilih tahun"
              options={tahunOptions}
              onChange={(value) =>
                setFilter((previous) => ({
                  ...previous,
                  tahun: value,
                }))
              }
            />

            {/* KEGIATAN */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Jenis Kegiatan</label>

              <Select
                value={filter.kegiatan}
                onValueChange={(value) => {
                  if (value !== null) {
                    setFilter((previous) => ({
                      ...previous,
                      kegiatan: value,
                    }));
                  }
                }}
              >
                <SelectTrigger className="h-11 w-full bg-background">
                  <SelectValue placeholder="Pilih kegiatan" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="Semua">Semua</SelectItem>

                  {kegiatanOptions.map((kode) => (
                    <SelectItem key={kode} value={kode}>
                      {kode} -{" "}
                      {getActivityName(
                        data.find((item) => item.kode_kegiatan === kode)!,
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <FileSpreadsheet className="size-4 text-blue-600" />

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
              className="inline-flex h-9 items-center justify-center rounded-lg border bg-background px-3 text-sm font-semibold transition-colors hover:bg-muted"
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
              Memuat data monitoring QC...
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {activityGroups.length === 0 ? (
            <Card>
              <CardContent className="flex min-h-48 flex-col items-center justify-center gap-2 text-center">
                <FileSpreadsheet className="size-9 text-muted-foreground" />

                <p className="font-semibold">Tidak ada data monitoring</p>

                <p className="text-sm text-muted-foreground">
                  Coba ubah filter atau kata kunci pencarian.
                </p>
              </CardContent>
            </Card>
          ) : (
            activityGroups.map((group) => (
              <ActivitySectionCollapsible key={group.kode} group={group} />
            ))
          )}
        </div>
      )}

      {/* FOOTER */}
      <div className="flex flex-col gap-2 border-t pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Monitoring QC Kegiatan SIPENTA</p>

        <p>{response?.total ?? data.length} data tersedia dari API</p>
      </div>
    </main>
  );
}
