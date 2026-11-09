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
  ChevronsUpDown,
  Clock3,
  FileCheck,
  FileSpreadsheet,
  FileText,
  MapPin,
  RefreshCw,
  Search,
  ArrowUp,
  ArrowDown,
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
  kode_kegiatan?: string | null;
  nama_kegiatan?: string | null;
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

type SortKey =
  | "kabupaten"
  | "perusahaan"
  | "no_berkas"
  | "no_kontrak"
  | "skala"
  | "realisasi"
  | "status";

type SortConfig = {
  key: SortKey;
  direction: "asc" | "desc";
};

const PAGE_SIZE_OPTIONS = [10, 20, 25];

const STAGE_POINT_IDS: Record<string, number[]> = {
  "01": [3],
  "02": [10],
};

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
// SORTABLE HEADER
// ======================================================

function SortableHead({
  label,
  sortKey,
  sort,
  onSort,
  className = "",
}: {
  label: string;
  sortKey: SortKey;
  sort: SortConfig;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = sort.key === sortKey;

  return (
    <TableHead
      className={`cursor-pointer select-none whitespace-nowrap ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1.5">
        <span>{label}</span>

        {active ? (
          sort.direction === "asc" ? (
            <ArrowUp className="size-3.5 text-blue-600" />
          ) : (
            <ArrowDown className="size-3.5 text-blue-600" />
          )
        ) : (
          <ChevronsUpDown className="size-3.5 text-muted-foreground/50" />
        )}
      </div>
    </TableHead>
  );
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
    <div className="min-w-[110px] space-y-1.5">
      <div className="flex justify-between">
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
// TIMELINE
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
            className={`h-4 whitespace-nowrap px-1 text-[8px] ${getTimelineStatusClass(
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

function StageCell({
  stage,
  isPointStage,
}: {
  stage?: Tahapan;
  isPointStage: boolean;
}) {
  if (!stage) {
    return (
      <TableCell className="min-w-[230px] border-l text-center align-middle">
        <span className="text-xs text-muted-foreground">-</span>
      </TableCell>
    );
  }

  const value = toNumber(stage.realisasi);

  return (
    <TableCell className="min-w-[230px] border-l p-2 align-top">
      <div className="space-y-2">
        <StageProgressBar value={value} />

        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground">
            Bobot tahapan
          </span>

          <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">
            {stage.bobot}%
          </Badge>
        </div>

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

            <div className="flex flex-wrap justify-between gap-1 text-[9px]">
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
              <p className="text-[9px] text-muted-foreground">Checklist</p>
            </div>
          </div>
        )}

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
// DETAIL BERKAS CELL
// ======================================================

function BerkasInfoCell({ detail }: { detail: DetailBerkas }) {
  return (
    <TableCell className="min-w-[250px]">
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-1.5">
          <MapPin className="mt-0.5 size-3.5 shrink-0 text-blue-500" />

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold">
              {detail.kabupaten || "-"}
            </span>

            <Badge className="h-5 border border-blue-200 bg-blue-50 px-1.5 text-[10px] text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
              {detail.skala || "-"}
            </Badge>
          </div>
        </div>

        <div className="flex items-start gap-1.5">
          <FileText className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
          <span className="text-[11px] text-muted-foreground">
            {detail.no_berkas || "-"}
          </span>
        </div>

        <div className="flex items-start gap-1.5">
          <FileCheck className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
          <span className="text-[11px] text-muted-foreground break-all">
            {detail.no_kontrak || "-"}
          </span>
        </div>

        {detail.nama_perusahaan && (
          <div className="border-t pt-1 text-[10px] font-medium text-muted-foreground">
            {detail.nama_perusahaan}
          </div>
        )}

        <div className="flex items-start gap-1.5">
          <ProgressCell value={toNumber(detail.realisasi_fisik)} />
        </div>
      </div>
      <Badge
        variant={detail.seluruh_tahapan_selesai ? "default" : "outline"}
        className={
          detail.seluruh_tahapan_selesai
            ? "bg-emerald-600 text-white hover:bg-emerald-700"
            : "text-amber-700 dark:text-amber-400"
        }
      >
        {detail.seluruh_tahapan_selesai ? "Selesai" : "Berjalan"}
      </Badge>
    </TableCell>
  );
}

// ======================================================
// TABLE PER KEGIATAN
// ======================================================

function MonitoringActivityTable({
  title,
  subtitle,
  kodeKegiatan,
  kanwilData,
  search,
  isLoading,
}: {
  title: string;
  subtitle: string;
  kodeKegiatan: "01" | "02";
  kanwilData: KanwilData[];
  search: string;
  isLoading: boolean;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [sort, setSort] = useState<SortConfig>({
    key: "kabupaten",
    direction: "asc",
  });

  // ----------------------------------------------------
  // FLATTEN DATA BERKAS
  // ----------------------------------------------------

  const allDetails = useMemo(() => {
    return kanwilData.flatMap((kanwil) =>
      (kanwil.detail ?? [])
        .filter((detail) => detail.kode_kegiatan === kodeKegiatan)
        .map((detail) => ({
          ...detail,
          kanwil_nama: kanwil.Kanwil,
          kanwilid: kanwil.kanwilid,

          // Informasi agregat Kanwil
          kanwil_anggaran: kanwil.anggaran,
          kanwil_total_berkas: kanwil.total_berkas,
          kanwil_realisasi_fisik: kanwil.realisasi_fisik,
          kanwil_seluruh_berkas_selesai: kanwil.seluruh_berkas_selesai,
          nama_kegiatan: kanwil.nama_kegiatan,
        })),
    );
  }, [kanwilData, kodeKegiatan]);

  // ----------------------------------------------------
  // FILTER
  // ----------------------------------------------------

  const filteredData = useMemo(() => {
    const keyword = normalize(search);

    return allDetails.filter((detail) => {
      if (!keyword) return true;

      const stageText = detail.tahapan
        ?.map(
          (stage) =>
            `${stage.nama_tahapan} ${stage.status_mulai} ${stage.status_selesai}`,
        )
        .join(" ");

      return [
        detail.kanwil_nama,
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
  }, [allDetails, search]);

  // ----------------------------------------------------
  // SORT
  // ----------------------------------------------------

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let result = 0;

      switch (sort.key) {
        case "kabupaten":
          result = (a.kabupaten ?? "").localeCompare(b.kabupaten ?? "", "id");
          break;

        case "perusahaan":
          result = (a.nama_perusahaan ?? "").localeCompare(
            b.nama_perusahaan ?? "",
            "id",
          );
          break;

        case "no_berkas":
          result = (a.no_berkas ?? "").localeCompare(b.no_berkas ?? "", "id");
          break;

        case "no_kontrak":
          result = (a.no_kontrak ?? "").localeCompare(b.no_kontrak ?? "", "id");
          break;

        case "skala":
          result = (a.skala ?? "").localeCompare(b.skala ?? "", "id");
          break;

        case "realisasi":
          result = toNumber(a.realisasi_fisik) - toNumber(b.realisasi_fisik);
          break;

        case "status":
          result =
            Number(a.seluruh_tahapan_selesai) -
            Number(b.seluruh_tahapan_selesai);
          break;
      }

      return sort.direction === "asc" ? result : -result;
    });
  }, [filteredData, sort]);

  // ----------------------------------------------------
  // DYNAMIC STAGE COLUMNS
  // ----------------------------------------------------

  const stageColumns = useMemo(() => {
    const map = new Map<number, Tahapan>();

    allDetails.forEach((detail) => {
      detail.tahapan?.forEach((stage) => {
        // Selesai hanya penanda akhir, bukan kolom QC
        if (normalize(stage.nama_tahapan) === "selesai") return;

        if (!map.has(stage.tahapan_kegiatan_id)) {
          map.set(stage.tahapan_kegiatan_id, stage);
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => a.urutan - b.urutan);
  }, [allDetails]);

  // ----------------------------------------------------
  // PAGINATION
  // ----------------------------------------------------

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));

  const currentPage = Math.min(page, totalPages);

  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  // ----------------------------------------------------
  // GROUP DATA BERDASARKAN KANWIL
  // ----------------------------------------------------

  const groupedData = useMemo(() => {
    const groups = new Map<
      string,
      {
        kanwilid: string;
        kanwil_nama: string;
        kode_kegiatan?: string | null;
        nama_kegiatan?: string | null;
        anggaran: string | number;
        total_berkas: string | number;
        realisasi_fisik: string | number;
        seluruh_berkas_selesai: boolean;
        details: (typeof paginatedData)[number][];
      }
    >();

    paginatedData.forEach((detail, index) => {
      // Nomor urut global berdasarkan pagination
      const nomor_urut = (currentPage - 1) * pageSize + index + 1;

      const detailWithNumber = {
        ...detail,
        nomor_urut,
      };

      if (!groups.has(detail.kanwilid)) {
        groups.set(detail.kanwilid, {
          kanwilid: detail.kanwilid,
          kanwil_nama: detail.kanwil_nama,
          kode_kegiatan: detail.kode_kegiatan,
          nama_kegiatan: detail.nama_kegiatan,
          anggaran: detail.kanwil_anggaran,
          total_berkas: detail.kanwil_total_berkas,
          realisasi_fisik: detail.kanwil_realisasi_fisik,
          seluruh_berkas_selesai: detail.kanwil_seluruh_berkas_selesai,
          details: [],
        });
      }

      groups.get(detail.kanwilid)!.details.push(detailWithNumber);
    });

    return Array.from(groups.values());
  }, [paginatedData, currentPage, pageSize]);

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------

  const totalAnggaran = kanwilData
    .filter((item) =>
      item.detail?.some((detail) => detail.kode_kegiatan === kodeKegiatan),
    )
    .reduce((total, item) => total + toNumber(item.anggaran), 0);

  const totalSelesai = filteredData.filter(
    (detail) => detail.seluruh_tahapan_selesai,
  ).length;

  const averageProgress =
    filteredData.length > 0
      ? filteredData.reduce(
          (total, detail) => total + toNumber(detail.realisasi_fisik),
          0,
        ) / filteredData.length
      : 0;

  // ----------------------------------------------------
  // SORT HANDLER
  // ----------------------------------------------------

  function handleSort(key: SortKey) {
    setSort((previous) => ({
      key,
      direction:
        previous.key === key && previous.direction === "asc" ? "desc" : "asc",
    }));

    setPage(1);
  }

  // ----------------------------------------------------
  // RENDER
  // ----------------------------------------------------

  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-3 border-b bg-muted/20 p-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
              kodeKegiatan === "01"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
            }`}
          >
            <FileSpreadsheet className="size-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold">{title}</h3>
              <Badge variant="secondary" className="text-[10px]">
                Kode {kodeKegiatan}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <Badge variant="outline" className="w-fit">
          {filteredData.length.toLocaleString("id-ID")} Berkas
        </Badge>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-2 gap-3 border-b p-4 sm:grid-cols-4">
        <div className="rounded-lg border bg-background p-3">
          <p className="text-[11px] text-muted-foreground">Total Berkas</p>
          <p className="mt-1 text-xl font-bold tabular-nums">
            {filteredData.length.toLocaleString("id-ID")}
          </p>
        </div>

        <div className="rounded-lg border bg-background p-3">
          <p className="text-[11px] text-muted-foreground">Total Anggaran</p>
          <p className="mt-1 text-sm font-bold tabular-nums">
            {formatRupiah(totalAnggaran)}
          </p>
        </div>

        <div className="rounded-lg border bg-background p-3">
          <p className="text-[11px] text-muted-foreground">
            Rata-rata Realisasi
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-blue-600">
            {formatPercent(averageProgress)}
          </p>
        </div>

        <div className="rounded-lg border bg-background p-3">
          <p className="text-[11px] text-muted-foreground">Berkas Selesai</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-emerald-600">
            {totalSelesai.toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      {/* TABLE SETTINGS */}
      <div className="flex flex-col justify-between gap-3 border-b p-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Urutkan data dengan klik judul kolom.</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap text-xs text-muted-foreground">
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

          <span className="text-xs text-muted-foreground">Baris</span>
        </div>
      </div>

      {/* LOADING */}
      {isLoading ? (
        <div className="flex min-h-48 flex-col items-center justify-center gap-3">
          <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-blue-600" />
          <p className="text-sm text-muted-foreground">Memuat data...</p>
        </div>
      ) : (
        <>
          {/* TABLE */}
          <div className="max-h-[720px] overflow-auto">
            <Table className="min-w-[1900px]">
              <TableHeader className="sticky top-0 z-30 bg-muted">
                <TableRow>
                  <TableHead className="sticky left-0 z-40 w-12 border-r bg-muted text-center">
                    No.
                  </TableHead>

                  <TableHead className="min-w-[220px] border-r bg-muted">
                    Kantor Wilayah
                  </TableHead>

                  <TableHead className="min-w-[220px] border-r bg-muted">
                    Kabupaten/Berkas
                  </TableHead>

                  {/* <SortableHead
                    label="Kabupaten / Berkas"
                    sortKey="kabupaten"
                    sort={sort}
                    onSort={handleSort}
                    className="min-w-[250px]"
                  /> */}

                  {stageColumns.map((stage) => (
                    <TableHead
                      key={stage.tahapan_kegiatan_id}
                      className="min-w-[230px] border-l text-center"
                    >
                      <div className="whitespace-normal text-xs font-bold">
                        {stage.urutan}. {stage.nama_tahapan}
                      </div>

                      <div className="mt-1 text-[10px] font-normal text-muted-foreground">
                        Bobot {stage.bobot}%
                      </div>

                      {(STAGE_POINT_IDS[kodeKegiatan] ?? []).includes(
                        stage.tahapan_kegiatan_id,
                      ) && (
                        <Badge
                          variant="secondary"
                          className="mt-1 h-4 text-[9px]"
                        >
                          Capaian Titik
                        </Badge>
                      )}
                    </TableHead>
                  ))}

                  {/* <SortableHead
                    label="Realisasi Fisik"
                    sortKey="realisasi"
                    sort={sort}
                    onSort={handleSort}
                    className="min-w-[140px]"
                  /> */}

                  {/* <SortableHead
                    label="Status"
                    sortKey="status"
                    sort={sort}
                    onSort={handleSort}
                    className="min-w-[110px] text-center"
                  /> */}
                </TableRow>
              </TableHeader>

              <TableBody>
                {groupedData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5 + stageColumns.length}
                      className="h-32 text-center text-muted-foreground"
                    >
                      Tidak ada data yang sesuai.
                    </TableCell>
                  </TableRow>
                ) : (
                  groupedData.map((group) =>
                    group.details.map((detail, detailIndex) => {
                      const isFirstRow = detailIndex === 0;

                      return (
                        <TableRow
                          key={`${detail.kanwilid}-${detail.berkas_id}`}
                          className="transition-colors hover:bg-muted/30"
                        >
                          {/* NOMOR */}
                          <TableCell className="sticky left-0 z-20 border-r bg-background text-center text-xs text-muted-foreground">
                            {(
                              (currentPage - 1) * pageSize +
                              paginatedData.findIndex(
                                (item) => item.berkas_id === detail.berkas_id,
                              ) +
                              1
                            )
                              .toString()
                              .padStart(2, "0")}
                          </TableCell>

                          {/* KANWIL - MERGE ROWSPAN */}
                          {isFirstRow && (
                            <TableCell
                              rowSpan={group.details.length}
                              className="min-w-[220px] border-r bg-blue-50/50 align-middle dark:bg-blue-950/20"
                            >
                              <div className="flex h-full flex-col justify-center gap-2">
                                <div className="flex items-start gap-2">
                                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                                    <MapPin className="size-4 text-blue-700 dark:text-blue-300" />
                                  </div>

                                  <div className="min-w-0">
                                    <p className="text-xs font-bold leading-relaxed text-blue-800 dark:text-blue-300">
                                      {group.kanwil_nama}
                                    </p>

                                    <div className="mt-1 text-[9px] text-muted-foreground">
                                      <ProgressCell
                                        value={toNumber(group.realisasi_fisik)}
                                      />
                                    </div>
                                  </div>
                                </div>

                                <Badge
                                  variant="secondary"
                                  className="w-fit text-[10px]"
                                >
                                  {group.details.length} Berkas
                                </Badge>
                              </div>
                            </TableCell>
                          )}

                          {/* KABUPATEN / BERKAS */}
                          <BerkasInfoCell detail={detail} />

                          {/* TAHAPAN */}
                          {stageColumns.map((column) => {
                            const stage = detail.tahapan?.find(
                              (item) =>
                                item.tahapan_kegiatan_id ===
                                column.tahapan_kegiatan_id,
                            );

                            const isPointStage = (
                              STAGE_POINT_IDS[kodeKegiatan] ?? []
                            ).includes(column.tahapan_kegiatan_id);

                            return (
                              <StageCell
                                key={column.tahapan_kegiatan_id}
                                stage={stage}
                                isPointStage={isPointStage}
                              />
                            );
                          })}
                        </TableRow>
                      );
                    }),
                  )
                )}
              </TableBody>
            </Table>
          </div>

          {/* PAGINATION */}
          <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Menampilkan{" "}
              {sortedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              {"–"}
              {Math.min(currentPage * pageSize, sortedData.length)}
              {" dari "}
              {sortedData.length.toLocaleString("id-ID")} berkas
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

              <Badge variant="outline" className="px-3 py-2 tabular-nums">
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

// ======================================================
// MAIN PAGE
// ======================================================

export default function MonitoringPageRevisiCopy() {
  const [search, setSearch] = useState("");
  const [pagePembuatan, setPagePembuatan] = useState(1);
  const [pagePembaruan, setPagePembaruan] = useState(1);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPagePembuatan(1);
    setPagePembaruan(1);
  };

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

  return (
    <div className="space-y-5">
      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold tracking-tight">
            Monitoring Quality Control Berkas
          </h2>

          <p className="text-sm text-muted-foreground">
            Monitoring realisasi fisik dan pemeriksaan checklist setiap tahapan
            kegiatan ZNT.
          </p>
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

      {/* SEARCH GLOBAL */}
      <Card className="p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Pencarian Data</p>
            <p className="text-xs text-muted-foreground">
              Cari Kanwil, kabupaten, perusahaan, nomor kontrak, atau nomor
              berkas.
            </p>
          </div>

          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari data monitoring..."
            />
          </div>
        </div>
      </Card>

      {/* ERROR */}
      {isError && (
        <CardContent className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
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
        </CardContent>
      )}

      {/* TABLE PEMBUATAN */}
      <MonitoringActivityTable
        title="Pembuatan ZNT"
        subtitle="Monitoring Quality Control kegiatan pembuatan Zona Nilai Tanah."
        kodeKegiatan="01"
        kanwilData={data}
        search={search}
        isLoading={isLoading}
      />

      {/* TABLE PEMBARUAN */}
      <MonitoringActivityTable
        title="Pembaruan ZNT"
        subtitle="Monitoring Quality Control kegiatan pembaruan Zona Nilai Tanah."
        kodeKegiatan="02"
        kanwilData={data}
        search={search}
        isLoading={isLoading}
      />
    </div>
  );
}
