"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

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

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileCheck,
  FileSpreadsheet,
  FileText,
  MapPin,
  RefreshCw,
  Search,
} from "lucide-react";

import { formatRupiah } from "@/constants/auth-constants";
import { basePath } from "@/constants/menu-sidebar";

// ======================================================
// TYPES
// ======================================================

type Tahapan = {
  bobot: number;
  sesuai: number;
  urutan: number;
  realisasi: number | null;
  nama_tahapan: string;
  status_mulai: string | null;
  target_titik: number;
  tidak_sesuai: number;
  status_selesai: string | null;
  total_approved: number;
  belum_diperiksa: number;
  total_checklist: number;
  masuk_tahapan_at: string | null;
  keluar_tahapan_at: string | null;
  tgl_mulai_timeline: string | null;
  tahapan_kegiatan_id: number;
  tgl_selesai_timeline: string | null;
};

type DetailBerkas = {
  skala: string | null;
  tahapan: Tahapan[];
  berkas_id: number;
  kabupaten: string | null;
  no_berkas: string | null;
  no_kontrak: string | null;
  kode_kegiatan: string | null;
  nama_perusahaan: string | null;
  realisasi_fisik: number | string | null;
  seluruh_tahapan_selesai: boolean;
};

type KanwilData = {
  kanwilid: string;
  Kanwil: string;
  anggaran: string | number;
  total_berkas: string | number;
  realisasi_fisik: string | number;
  seluruh_berkas_selesai: boolean;
  detail: DetailBerkas[];
};

type ApiResponse = {
  success: boolean;
  total: number;
  data: KanwilData[];
  message?: string;
};

type KanwilGroup = {
  key: string;
  kanwil: KanwilData;
  details: DetailBerkas[];
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// ======================================================
// HELPERS
// ======================================================

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;

  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function normalize(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function formatPercent(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "-";

  return `${toNumber(value).toLocaleString("id-ID", {
    maximumFractionDigits: 2,
  })}%`;
}

function getProgressColor(value: number) {
  if (value >= 100) return "bg-emerald-500";
  if (value >= 50) return "bg-blue-500";
  if (value > 0) return "bg-amber-500";
  return "bg-muted-foreground/30";
}

function getStatusVariant(status: string | null) {
  if (!status) return "outline" as const;

  const value = normalize(status);

  if (value === "tepat waktu") return "default" as const;
  if (value === "terlambat") return "destructive" as const;

  return "outline" as const;
}

// ======================================================
// PROGRESS CELL
// ======================================================

function ProgressCell({
  value,
  status,
}: {
  value: number | null;
  status?: string | null;
}) {
  const percentage = value === null ? null : toNumber(value);

  return (
    <div className="min-w-[105px] space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold tabular-nums">
          {formatPercent(percentage)}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${getProgressColor(
            percentage ?? 0,
          )}`}
          style={{
            width: `${Math.min(100, Math.max(0, percentage ?? 0))}%`,
          }}
        />
      </div>

      {status && (
        <Badge
          variant={getStatusVariant(status)}
          className="h-5 px-1.5 text-[9px]"
        >
          {status}
        </Badge>
      )}
    </div>
  );
}

// ======================================================
// STAGE HELPERS
// ======================================================

const STAGE_POINT_IDS = [3, 9]; // Sesuaikan dengan ID tahapan survei titik pada API

function formatNumber(value: number) {
  return value.toLocaleString("id-ID");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getTimelineStatusClass(status: string | null) {
  switch (normalize(status)) {
    case "terlambat":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400";

    case "tepat waktu":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400";

    case "jadwal belum tersedia":
      return "border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400";

    default:
      return "border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400";
  }
}

// ======================================================
// STAGE PROGRESS BAR
// ======================================================

function StageProgressBar({ value }: { value: number }) {
  const percentage = Math.min(100, Math.max(0, value));

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-muted-foreground">
          Realisasi tahapan
        </span>

        <span className="text-[10px] font-bold tabular-nums">
          {formatPercent(value)}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${getProgressColor(
            percentage,
          )}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ======================================================
// TIMELINE ITEM
// ======================================================

function TimelineItem({
  type,
  date,
  deadline,
  status,
}: {
  type: "mulai" | "selesai";
  date: string | null;
  deadline: string | null;
  status: string | null;
}) {
  const isStart = type === "mulai";

  return (
    <div className="flex items-start gap-2">
      <div
        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${
          isStart
            ? "bg-blue-100 dark:bg-blue-950"
            : "bg-emerald-100 dark:bg-emerald-950"
        }`}
      >
        {isStart ? (
          <CalendarDays className="size-3 text-blue-600" />
        ) : (
          <Clock3 className="size-3 text-emerald-600" />
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] font-semibold">
            {isStart ? "Mulai" : "Selesai"}
          </span>

          <span className="text-[9px] text-muted-foreground">
            Deadline: {formatDate(deadline)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-1">
          <span className="text-[9px] text-muted-foreground">
            {formatDate(date)}
          </span>

          <Badge
            variant="outline"
            className={`h-4 whitespace-nowrap px-1 text-[8px] font-medium ${getTimelineStatusClass(
              status,
            )}`}
          >
            {status || "-"}
          </Badge>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// STAGE CELL
// ======================================================

function StageCell({ stage }: { stage?: Tahapan }) {
  if (!stage) {
    return (
      <TableCell className="min-w-[240px] border-l text-center align-middle">
        <span className="text-xs text-muted-foreground">-</span>
      </TableCell>
    );
  }

  const value = toNumber(stage.realisasi);
  const isPointStage = STAGE_POINT_IDS.includes(stage.tahapan_kegiatan_id);

  return (
    <TableCell className="min-w-[240px] border-l p-2 align-top">
      <div className="space-y-2">
        {/* PROGRESS */}
        <StageProgressBar value={value} />

        {/* BOBOT */}
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground">
            Bobot tahapan
          </span>

          <Badge
            variant="secondary"
            className="h-4 px-1.5 text-[9px] font-semibold"
          >
            {stage.bobot}%
          </Badge>
        </div>

        {/* CAPAIAN TITIK */}
        {isPointStage ? (
          <div className="space-y-1.5 rounded-md border bg-muted/20 p-2">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] text-muted-foreground">
                Titik disetujui / Target
              </span>

              <span className="text-xs font-bold tabular-nums">
                {formatNumber(toNumber(stage.total_approved))}/
                {formatNumber(toNumber(stage.target_titik))}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-1 text-[9px]">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                ✓ {stage.sesuai} Sesuai
              </span>

              <span className="font-semibold text-red-600 dark:text-red-400">
                ✕ {stage.tidak_sesuai} Tidak sesuai
              </span>
            </div>

            <div className="border-t pt-1 text-center text-[9px] text-muted-foreground">
              {stage.sesuai}/{stage.total_checklist} Checklist diperiksa
            </div>
          </div>
        ) : (
          /* CHECKLIST BIASA */
          <div className="grid grid-cols-3 gap-1">
            <div className="rounded border bg-emerald-50/70 px-1 py-1 text-center dark:bg-emerald-950/20">
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {stage.sesuai}
              </p>
              <p className="text-[9px] text-muted-foreground">Sesuai</p>
            </div>

            <div className="rounded border bg-red-50/70 px-1 py-1 text-center dark:bg-red-950/20">
              <p className="text-xs font-bold text-red-700 dark:text-red-400">
                {stage.tidak_sesuai}
              </p>
              <p className="text-[9px] text-muted-foreground">Tidak sesuai</p>
            </div>

            <div className="rounded border bg-blue-50/70 px-1 py-1 text-center dark:bg-blue-950/20">
              <p className="text-xs font-bold text-blue-700 dark:text-blue-400">
                {stage.sesuai}/{stage.total_checklist}
              </p>
              <p className="text-[9px] text-muted-foreground">Keseluruhan</p>
            </div>
          </div>
        )}

        {/* TIMELINE */}
        <div className="space-y-2 border-t pt-2">
          <p className="text-[9px] font-bold tracking-wide text-muted-foreground">
            TIMELINE TAHAPAN
          </p>

          <TimelineItem
            type="mulai"
            date={stage.masuk_tahapan_at}
            deadline={stage.tgl_mulai_timeline}
            status={stage.status_mulai}
          />

          <TimelineItem
            type="selesai"
            date={stage.keluar_tahapan_at}
            deadline={stage.tgl_selesai_timeline}
            status={stage.status_selesai}
          />
        </div>
      </div>
    </TableCell>
  );
}

// ======================================================
// MAIN COMPONENT
// ======================================================

export default function MonitoringPageRevisi2() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ====================================================
  // FETCH API
  // ====================================================

  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<ApiResponse>({
    queryKey: ["monitoring-qc-berkas2"],
    queryFn: async () => {
      const result = await fetch(`${basePath}/api/monitoring-qc-berkas2`, {
        cache: "no-store",
      });

      if (!result.ok) {
        throw new Error("Gagal mengambil data monitoring QC");
      }

      const json: ApiResponse = await result.json();

      if (!json.success) {
        throw new Error(json.message || "API mengembalikan status gagal");
      }

      return json;
    },
  });

  const data = response?.data ?? [];

  // ====================================================
  // TAHAPAN DINAMIS
  // ====================================================

  const stageColumns = useMemo(() => {
    const map = new Map<number, Tahapan>();

    data.forEach((kanwil) => {
      kanwil.detail?.forEach((detail) => {
        detail.tahapan?.forEach((stage) => {
          if (!map.has(stage.tahapan_kegiatan_id)) {
            map.set(stage.tahapan_kegiatan_id, stage);
          }
        });
      });
    });

    return Array.from(map.values()).sort((a, b) => a.urutan - b.urutan);
  }, [data]);

  // ====================================================
  // FILTER DATA
  // ====================================================

  const filteredGroups = useMemo(() => {
    const keyword = normalize(search);

    return data
      .map((kanwil) => {
        const details = (kanwil.detail ?? []).filter((detail) => {
          if (!keyword) return true;

          const stageText = detail.tahapan
            ?.map(
              (stage) =>
                `${stage.nama_tahapan} ${stage.status_mulai} ${stage.status_selesai}`,
            )
            .join(" ");

          return [
            kanwil.Kanwil,
            detail.nama_perusahaan,
            detail.no_kontrak,
            detail.no_berkas,
            detail.kabupaten,
            detail.skala,
            detail.kode_kegiatan,
            detail.berkas_id,
            stageText,
          ].some((value) => normalize(value).includes(keyword));
        });

        return {
          key: kanwil.kanwilid,
          kanwil,
          details,
        };
      })
      .filter((group) => group.details.length > 0)
      .sort((a, b) => a.kanwil.Kanwil.localeCompare(b.kanwil.Kanwil, "id"));
  }, [data, search]);

  // ====================================================
  // PAGINATION
  // ====================================================

  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / pageSize));

  const currentPage = Math.min(page, totalPages);

  const paginatedGroups = filteredGroups.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  // ====================================================
  // SUMMARY
  // ====================================================

  const totalBerkas = filteredGroups.reduce(
    (total, group) => total + group.details.length,
    0,
  );

  const totalSelesai = filteredGroups.reduce(
    (total, group) =>
      total +
      group.details.filter((detail) => detail.seluruh_tahapan_selesai).length,
    0,
  );

  const totalAnggaran = filteredGroups.reduce(
    (total, group) => total + toNumber(group.kanwil.anggaran),
    0,
  );

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-3 border-b bg-muted/20 p-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <FileSpreadsheet className="size-5" />
          </div>

          <div>
            <h3 className="font-bold">Monitoring Quality Control Berkas</h3>
            <p className="text-xs text-muted-foreground">
              Rekap progres QC seluruh Kanwil dan tahapan kegiatan.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-2 gap-3 border-b p-4 sm:grid-cols-4">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Total Kanwil</p>
          <p className="mt-1 text-xl font-bold tabular-nums">
            {filteredGroups.length.toLocaleString("id-ID")}
          </p>
        </div>

        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Total Berkas</p>
          <p className="mt-1 text-xl font-bold tabular-nums">
            {totalBerkas.toLocaleString("id-ID")}
          </p>
        </div>

        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Total Anggaran</p>
          <p className="mt-1 text-lg font-bold tabular-nums">
            {formatRupiah(totalAnggaran)}
          </p>
        </div>

        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Berkas Selesai</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-emerald-600">
            {totalSelesai.toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Cari Kanwil, perusahaan, kontrak, berkas..."
            className="h-10 pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            Tampilkan
          </span>

          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>

          <span className="text-sm text-muted-foreground">Kanwil</span>
        </div>
      </div>

      {/* LOADING */}
      {isLoading && (
        <div className="flex min-h-56 flex-col items-center justify-center gap-3">
          <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-blue-600" />
          <p className="text-sm text-muted-foreground">
            Memuat data monitoring QC...
          </p>
        </div>
      )}

      {/* ERROR */}
      {isError && (
        <CardContent className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold">Gagal memuat data monitoring QC</p>
            <p className="mt-1">
              {error instanceof Error ? error.message : "Terjadi kesalahan."}
            </p>
            <button
              onClick={() => void refetch()}
              className="mt-3 rounded-md border border-red-300 px-3 py-1.5 font-semibold"
            >
              Coba Lagi
            </button>
          </div>
        </CardContent>
      )}

      {/* TABLE */}
      {!isLoading && !isError && (
        <>
          <div className="max-h-[720px] overflow-auto">
            <Table className="min-w-[2200px]">
              <TableHeader className="sticky top-0 z-30 bg-muted">
                <TableRow>
                  <TableHead className="sticky left-0 z-40 w-14 bg-muted text-center">
                    No.
                  </TableHead>

                  <TableHead className="sticky left-14 z-40 min-w-[230px] bg-muted">
                    Kantor Wilayah
                  </TableHead>

                  <TableHead className="min-w-[180px]">
                    Kabupaten/Kota
                  </TableHead>

                  {stageColumns.map((stage) => (
                    <TableHead
                      key={stage.tahapan_kegiatan_id}
                      className="min-w-[240px] border-l text-center"
                    >
                      <div className="whitespace-normal text-xs font-bold">
                        {stage.urutan}. {stage.nama_tahapan}
                      </div>

                      <div className="mt-1 text-[10px] font-normal text-muted-foreground">
                        Bobot {stage.bobot}%
                      </div>

                      {STAGE_POINT_IDS.includes(stage.tahapan_kegiatan_id) && (
                        <Badge
                          variant="secondary"
                          className="mt-1 h-4 text-[9px]"
                        >
                          Capaian Titik
                        </Badge>
                      )}
                    </TableHead>
                  ))}

                  <TableHead className="min-w-[145px]">
                    Realisasi Fisik
                  </TableHead>

                  <TableHead className="min-w-[120px] text-center">
                    Status Berkas
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedGroups.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10 + stageColumns.length}
                      className="h-32 text-center text-muted-foreground"
                    >
                      Tidak ada data yang sesuai.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedGroups.map((group, groupIndex) => {
                    const kanwil = group.kanwil;
                    const details = group.details;

                    return details.map((detail, detailIndex) => {
                      const isFirst = detailIndex === 0;

                      return (
                        <TableRow
                          key={`${kanwil.kanwilid}-${detail.berkas_id}`}
                          className="hover:bg-muted/30"
                        >
                          {/* NOMOR */}
                          <TableCell className="sticky left-0 z-20 bg-background text-center text-xs text-muted-foreground">
                            {((currentPage - 1) * pageSize + groupIndex + 1)
                              .toString()
                              .padStart(2, "0")}
                            <span className="text-[10px]">
                              .{detailIndex + 1}
                            </span>
                          </TableCell>

                          {/* KANWIL */}
                          {isFirst && (
                            <TableCell
                              rowSpan={details.length}
                              className="sticky left-14 z-20 min-w-[230px] border-r bg-background align-middle"
                            >
                              <div className="space-y-2">
                                <p className="text-xs font-bold leading-relaxed text-blue-800">
                                  {kanwil.Kanwil}
                                </p>

                                <div className="flex flex-wrap gap-1">
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px]"
                                  >
                                    {details.length} Berkas
                                  </Badge>

                                  <Badge
                                    variant={
                                      kanwil.seluruh_berkas_selesai
                                        ? "default"
                                        : "outline"
                                    }
                                    className="text-[10px]"
                                  >
                                    {kanwil.seluruh_berkas_selesai
                                      ? "Selesai"
                                      : "Berjalan"}
                                  </Badge>
                                </div>

                                <ProgressCell
                                  value={toNumber(kanwil.realisasi_fisik)}
                                />
                                <div>
                                  {formatRupiah(toNumber(kanwil.anggaran))}
                                </div>
                              </div>
                            </TableCell>
                          )}

                          {/* KABUPATEN */}
                          <TableCell className="text-xs">
                            <div className="flex flex-col gap-1.5">
                              {/* Kabupaten */}
                              <div className="flex items-center gap-1.5">
                                <MapPin className="size-3 shrink-0 text-blue-500" />
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-foreground">
                                    {detail.kabupaten || "-"}
                                  </span>

                                  <Badge
                                    variant="secondary"
                                    className="h-5 rounded-md border border-blue-200 bg-blue-50 px-1.5 text-[10px] font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300"
                                  >
                                    {detail.skala || "-"}
                                  </Badge>
                                </div>
                              </div>

                              {/* Nomor Berkas */}
                              <div className="flex items-center gap-1.5">
                                <FileText className="size-3 shrink-0 text-emerald-600" />
                                <span className="text-[11px] text-muted-foreground">
                                  {detail.no_berkas || "-"}
                                </span>
                              </div>

                              {/* Nomor Kontrak */}
                              <div className="flex items-center gap-1.5">
                                <FileCheck className="size-3 shrink-0 text-amber-600" />
                                <span className="text-[11px] text-muted-foreground">
                                  {detail.no_kontrak || "-"}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          {/* REALISASI */}
                          <TableCell>
                            <ProgressCell
                              value={toNumber(detail.realisasi_fisik)}
                            />
                          </TableCell>

                          {/* TAHAPAN */}
                          {/* {stageColumns.map((column) => {
                            const stage = detail.tahapan?.find(
                              (item) => item.nama_tahapan === column.nama,
                            );

                            return (
                              <TableCell
                                key={column.nama}
                                className="align-middle"
                              >
                                {stage ? (
                                  <div className="space-y-1.5">
                                    <ProgressCell
                                      value={stage.realisasi}
                                      status={stage.status_selesai}
                                    />

                                    <p className="text-[10px] text-muted-foreground">
                                      Bobot: {stage.bobot}%
                                    </p>

                                    <p className="text-[10px] text-muted-foreground">
                                      Checklist: {stage.sesuai}/
                                      {stage.total_checklist}
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    -
                                  </span>
                                )}
                              </TableCell>
                            );
                          })} */}

                          {/* STATUS */}
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                detail.seluruh_tahapan_selesai
                                  ? "default"
                                  : "outline"
                              }
                              className={
                                detail.seluruh_tahapan_selesai
                                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                  : ""
                              }
                            >
                              {detail.seluruh_tahapan_selesai
                                ? "Selesai"
                                : "Berjalan"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* PAGINATION */}
          <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Menampilkan{" "}
              {filteredGroups.length === 0
                ? 0
                : (currentPage - 1) * pageSize + 1}
              {"–"}
              {Math.min(currentPage * pageSize, filteredGroups.length)}
              {" dari "}
              {filteredGroups.length.toLocaleString("id-ID")} Kanwil. Total{" "}
              {totalBerkas.toLocaleString("id-ID")} berkas.
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((previous) => Math.max(1, previous - 1))}
                className="inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
                Sebelumnya
              </button>

              <Badge variant="outline" className="px-3 py-2">
                {currentPage} / {totalPages}
              </Badge>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setPage((previous) => Math.min(totalPages, previous + 1))
                }
                className="inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                Berikutnya
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
