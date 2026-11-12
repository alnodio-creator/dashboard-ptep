"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  CheckCircle2,
  MapPin,
  Search,
  RefreshCw,
  FileText,
  Wallet,
  Building2,
  ChartNoAxesCombined,
  AlertCircle,
  CalendarDays,
  Clock3,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { basePath } from "@/constants/menu-sidebar";
import { formatRupiah } from "@/constants/auth-constants";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ======================================================
// TYPES
// ======================================================

type Tahapan = {
  tahapan_kegiatan_id: number;
  nama_tahapan: string;
  urutan: number;
  bobot: number;
  realisasi: number;
  target_titik: number;
  total_approved: number;
  sesuai: number;
  tidak_sesuai: number;
  belum_diperiksa: number;
  total_checklist: number;
  masuk_tahapan_at: string | null;
  keluar_tahapan_at: string | null;
  tgl_mulai_timeline: string | null;
  tgl_selesai_timeline: string | null;
  status_mulai: string | null;
  status_selesai: string | null;
};

type KabupatenDetail = {
  berkas_id: number;
  no_berkas: string;
  no_kontrak: string;
  kode_kegiatan: string;
  kabupaten: string;
  anggaran: number;
  nama_anggaran: string;
  nama_perusahaan: string | null;
  realisasi_fisik: number;
  skala: string;
  seluruh_tahapan_selesai: boolean;
  tahapan: Tahapan[];
};

type ContractItem = {
  kanwilid: string;
  Kanwil: string;
  kode_kegiatan: string;
  nama_kegiatan: string;

  anggaran: string | number;
  total_berkas: string | number;
  realisasi_fisik: string | number;
  seluruh_berkas_selesai: boolean;

  detail: KabupatenDetail[];
};

type ApiResponse = {
  success: boolean;
  message: string;
  total: number;
  data: ContractItem[];
};

// ======================================================
// CONSTANTS
// ======================================================

const STAGE_POINT_IDS = [3, 10, 17, 25];
const FINISHED_STAGE_IDS = [29, 30];

// ======================================================
// HELPERS
// ======================================================

function toNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatNumber(value: number) {
  return value.toLocaleString("id-ID");
}

function formatPercent(value: number) {
  return `${value.toLocaleString("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getProgressColor(value: number) {
  if (value >= 100) return "bg-green-800";
  if (value >= 80) return "bg-green-600";
  if (value >= 60) return "bg-lime-500";
  if (value >= 40) return "bg-yellow-500";
  if (value >= 20) return "bg-orange-500";
  return "bg-red-500";
}

function getProgressTextColor(value: number) {
  if (value >= 100) return "text-green-800";
  if (value >= 80) return "text-green-700";
  if (value >= 60) return "text-lime-700";
  if (value >= 40) return "text-yellow-700";
  if (value >= 20) return "text-orange-700";
  return "text-red-600";
}

function getUniqueKabupaten(detail: KabupatenDetail[]) {
  return new Set(
    detail.map((item) => normalize(item.kabupaten)).filter(Boolean),
  ).size;
}

// ======================================================
// PROGRESS BAR
// ======================================================

function ProgressBar({
  value,
  compact = false,
}: {
  value: number;
  compact?: boolean;
}) {
  const progress = Math.min(100, Math.max(0, value));

  return (
    <div className="min-w-27.5 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`font-bold tabular-nums ${getProgressTextColor(value)} ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          {formatPercent(value)}
        </span>

        {value >= 100 && (
          <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
        )}
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
            value,
          )}`}
          style={{ width: `${progress}%` }}
        />
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
      <TableCell className="min-w-70 border-l text-center align-middle">
        <span className="text-xs text-muted-foreground">-</span>
      </TableCell>
    );
  }

  const value = toNumber(stage.realisasi);
  const isPointStage = STAGE_POINT_IDS.includes(stage.tahapan_kegiatan_id);

  return (
    <TableCell className="min-w-60 border-l p-2 align-top">
      <div className="space-y-2">
        {/* PROGRESS */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-muted-foreground">
              Realisasi tahapan
            </span>
            <span className="text-[10px] font-semibold tabular-nums">
              Bobot {stage.bobot}%
            </span>
          </div>
          <ProgressBar value={value} compact />
        </div>

        {/* CAPAIAN */}
        {isPointStage ? (
          <div className="flex flex-col items-center justify-between gap-2 rounded-md border bg-muted/20 px-2 py-1.5">
            {/* Target Titik */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">
                Titik disetujui / Target
              </span>
              <span className="font-bold tabular-nums">
                {formatNumber(toNumber(stage.total_approved))}/
                {formatNumber(toNumber(stage.target_titik))}
              </span>
            </div>

            {/* Checklist */}
            <div className="flex items-center gap-2 text-[10px]">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                ✓ {stage.sesuai} Sesuai
              </span>

              <span className="font-semibold text-red-600 dark:text-red-400">
                ✕ {stage.tidak_sesuai} Tidak sesuai
              </span>

              <span className="font-semibold text-muted-foreground">
                {stage.sesuai}/{stage.total_checklist} Keseluruhan
              </span>
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
              <p className="text-[9px] text-muted-foreground">Keseluruhan</p>
            </div>
          </div>
        )}

        {/* TIMELINE */}
        <div className="space-y-1.5 border-t pt-2">
          <p className="text-[9px] font-bold tracking-wide text-muted-foreground">
            TIMELINE TAHAPAN
          </p>

          {/* MULAI */}
          <div className="flex items-center gap-1.5">
            <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">
              <CalendarDays className="size-2.5 text-blue-600" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-semibold">Mulai</span>

                <span className="text-[9px] text-muted-foreground">
                  Deadline: {formatDate(stage.tgl_mulai_timeline)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-1">
                <span className="text-[9px] text-muted-foreground">
                  {formatDate(stage.masuk_tahapan_at)}
                </span>

                <Badge
                  variant="outline"
                  className={cn(
                    "whitespace-nowrap px-1 py-0 text-[8px] font-medium leading-4",
                    stage.status_mulai === "TERLAMBAT" &&
                      "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400",
                    stage.status_mulai === "TEPAT WAKTU" &&
                      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400",
                    stage.status_mulai === "JADWAL BELUM TERSEDIA" &&
                      "border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400",
                    !stage.status_mulai &&
                      "border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400",
                  )}
                >
                  {stage.status_mulai || "-"}
                </Badge>
              </div>
            </div>
          </div>

          {/* SELESAI */}
          <div className="flex items-start gap-2">
            <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
              <CalendarDays className="size-3 text-emerald-600" />
            </div>

            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-semibold">Selesai</span>
                <span className="text-[9px] text-muted-foreground">
                  Deadline: {formatDate(stage.tgl_selesai_timeline)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] text-muted-foreground">
                  {formatDate(stage.keluar_tahapan_at)}
                </span>
                {stage.status_selesai ? (
                  <Badge
                    variant="outline"
                    className={cn(
                      "whitespace-nowrap text-[9px] font-medium px-1.5 py-0.5",
                      stage.status_selesai === "TERLAMBAT" &&
                        "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400",
                      stage.status_selesai === "TEPAT WAKTU" &&
                        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400",
                      stage.status_selesai === "JADWAL BELUM TERSEDIA" &&
                        "border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400",
                    )}
                  >
                    {stage.status_selesai}
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                  >
                    -
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </TableCell>
  );
}

// ======================================================
// SUMMARY CARD
// ======================================================

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>

          <p className="mt-2 truncate text-lg font-bold tracking-tight sm:text-xl">
            {value}
          </p>

          <p className="mt-1 text-[11px] text-muted-foreground">
            {description}
          </p>
        </div>

        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${color}`}
        >
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

// ======================================================
// MAIN COMPONENT
// ======================================================

export default function DetailPresentasePembaruan() {
  const [detailSearch, setDetailSearch] = useState("");
  const tableRef = useRef<HTMLDivElement>(null);
  const [statusFilter, setStatusFilter] = useState<
    "Filter Status" | "selesai" | "belum"
  >("Filter Status");

  const [anggaranFilter, setAnggaranFilter] = useState<
    "Filter Anggaran" | "PHLN" | "APBN" | "APBD"
  >("Filter Anggaran");

  // ====================================================
  // FETCH SEMUA KONTRAK
  // ====================================================

  const {
    data: contracts = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["monitoring-qc-berkas3"],

    queryFn: async (): Promise<ContractItem[]> => {
      const response = await fetch(`${basePath}/api/monitoring-qc-berkas3`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Gagal mengambil data. HTTP ${response.status}`);
      }

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Gagal mengambil data");
      }

      return result.data ?? [];
    },

    staleTime: 1000 * 60 * 2,
  });

  // ====================================================
  // DEFINISI TAHAPAN
  // ====================================================

  useEffect(() => {
    if (!isLoading && tableRef.current) {
      tableRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [isLoading]);

  const stages = useMemo(() => {
    const stageMap = new Map<number, Tahapan>();

    contracts.forEach((contract) => {
      (contract.detail ?? []).forEach((record) => {
        (record.tahapan ?? []).forEach((stage) => {
          if (FINISHED_STAGE_IDS.includes(stage.tahapan_kegiatan_id)) {
            return;
          }

          if (!stageMap.has(stage.tahapan_kegiatan_id)) {
            stageMap.set(stage.tahapan_kegiatan_id, stage);
          }
        });
      });
    });

    return Array.from(stageMap.values()).sort((a, b) => a.urutan - b.urutan);
  }, [contracts]);

  // ====================================================
  // FILTER KONTRAK DAN DETAIL
  // ====================================================

  const filteredContracts = useMemo(() => {
    const keyword = normalize(detailSearch);

    return contracts
      .map((contract) => {
        // Filter berdasarkan Kanwil
        const companyMatch =
          normalize(contract.Kanwil).includes(keyword) ||
          normalize(contract.kanwilid).includes(keyword);

        // Filter detail berdasarkan pencarian
        const filteredDetail = (contract.detail ?? []).filter((record) => {
          const searchMatch =
            !keyword ||
            companyMatch ||
            normalize(record.kabupaten).includes(keyword) ||
            normalize(record.no_berkas).includes(keyword) ||
            normalize(record.no_kontrak).includes(keyword) ||
            normalize(record.skala).includes(keyword) ||
            normalize(record.nama_perusahaan ?? "").includes(keyword);

          // Filter status seluruh tahapan
          const statusMatch =
            statusFilter === "Filter Status" ||
            (statusFilter === "selesai" &&
              record.seluruh_tahapan_selesai === true) ||
            (statusFilter === "belum" &&
              record.seluruh_tahapan_selesai === false);

          // Filter sumber anggaran
          const anggaranMatch =
            anggaranFilter === "Filter Anggaran" ||
            normalize(record.nama_anggaran).includes(normalize(anggaranFilter));

          return searchMatch && statusMatch && anggaranMatch;
        });

        return {
          ...contract,
          detail: filteredDetail,
        };
      })
      .filter((contract) => contract.detail.length > 0);
  }, [contracts, detailSearch, statusFilter, anggaranFilter]);

  // ====================================================
  // DATA SUMMARY SELURUH KONTRAK
  // ====================================================

  const summary = useMemo(() => {
    const totalAnggaran = contracts.reduce(
      (sum, contract) => sum + toNumber(contract.anggaran),
      0,
    );

    const totalBerkas = contracts.reduce(
      (sum, contract) => sum + (contract.detail?.length ?? 0),
      0,
    );

    const allDetails = contracts.flatMap((contract) => contract.detail ?? []);

    const totalSelesai = allDetails.filter(
      (item) => item.seluruh_tahapan_selesai,
    ).length;

    const totalProses = totalBerkas - totalSelesai;

    const totalKabupaten = getUniqueKabupaten(allDetails);

    // Rata-rata realisasi fisik per kontrak berbobot jumlah berkas.
    const totalRealisasi = contracts.reduce((sum, contract) => {
      const jumlahBerkas = contract.detail?.length ?? 0;

      return sum + toNumber(contract.realisasi_fisik) * jumlahBerkas;
    }, 0);

    const realisasi = totalBerkas > 0 ? totalRealisasi / totalBerkas : 0;

    return {
      totalAnggaran,
      totalBerkas,
      totalSelesai,
      totalProses,
      totalKabupaten,
      realisasi,
    };
  }, [contracts]);

  // ====================================================
  // LOADING
  // ====================================================

  if (isLoading) {
    return (
      <div className="flex min-h-62.5 flex-col items-center justify-center gap-3">
        <RefreshCw className="size-7 animate-spin text-blue-600" />

        <p className="text-sm text-muted-foreground">
          Mengambil seluruh data monitoring kontrak...
        </p>
      </div>
    );
  }

  // ====================================================
  // ERROR
  // ====================================================

  if (isError) {
    return (
      <div className="flex min-h-62.5 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6">
        <AlertCircle className="size-9 text-red-500" />

        <div className="text-center">
          <p className="font-semibold">Gagal mengambil data monitoring</p>

          <p className="mt-1 text-xs text-muted-foreground">
            {error instanceof Error
              ? error.message
              : "Terjadi kesalahan saat mengambil data"}
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 size-3.5" />
          Coba Lagi
        </Button>
      </div>
    );
  }

  // ====================================================
  // TABLE TOTAL
  // ====================================================

  const totalFilteredRows = filteredContracts.reduce(
    (sum, contract) => sum + contract.detail.length,
    0,
  );

  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-blue-600" />

            <h3 className="text-base font-bold">
              Monitoring Realisasi Pembaruan Peta Nilai Tanah
            </h3>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Monitoring progres Kantor Wilayah, kabupaten, checklist, dan
            timeline Pembaruan Peta Nilai Tanah
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline">
              {formatNumber(contracts.length)} Kantor Wilayah
            </Badge>

            <Badge variant="outline">
              {formatNumber(summary.totalBerkas)} Berkas
            </Badge>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw
            className={`mr-2 size-3.5 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* SUMMARY */}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard
          title="Total Anggaran"
          value={formatRupiah(summary.totalAnggaran)}
          description="Akumulasi seluruh kontrak"
          icon={Wallet}
          color="bg-blue-100 text-blue-700"
        />

        <SummaryCard
          title="Total Berkas"
          value={formatNumber(summary.totalBerkas)}
          description={`${summary.totalSelesai} selesai · ${summary.totalProses} proses`}
          icon={FileText}
          color="bg-violet-100 text-violet-700"
        />

        <SummaryCard
          title="Kabupaten / Kota"
          value={formatNumber(summary.totalKabupaten)}
          description="Wilayah seluruh kontrak"
          icon={MapPin}
          color="bg-amber-100 text-amber-700"
        />

        <SummaryCard
          title="Realisasi Fisik"
          value={formatPercent(summary.realisasi)}
          description="Rata-rata berbobot jumlah berkas"
          icon={ChartNoAxesCombined}
          color="bg-emerald-100 text-emerald-700"
        />
      </div>

      {/* OVERALL PROGRESS */}

      <Card ref={tableRef} className="shadow-sm">
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">Progres Keseluruhan</p>

              <p className="text-xs text-muted-foreground">
                Akumulasi realisasi fisik seluruh berkas dari semua kontrak
              </p>
            </div>

            <Badge
              variant="outline"
              className={
                summary.totalBerkas > 0 &&
                summary.totalSelesai === summary.totalBerkas
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-blue-200 bg-blue-50 text-blue-700"
              }
            >
              {summary.totalBerkas > 0 &&
              summary.totalSelesai === summary.totalBerkas
                ? "Seluruh Berkas Selesai"
                : "Dalam Proses"}
            </Badge>
          </div>

          <ProgressBar value={summary.realisasi} />

          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>
              {summary.totalSelesai} dari {summary.totalBerkas} berkas selesai
            </span>

            <span>{summary.totalProses} berkas dalam proses</span>
          </div>
        </CardContent>
      </Card>

      {/* SEARCH */}

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h4 className="font-bold">Rincian Capaian Kabupaten</h4>

          <p className="mt-1 text-xs text-muted-foreground">
            Perbandingan realisasi, checklist, dan timeline setiap tahapan
            seluruh kontrak.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative w-full sm:flex-1 sm:min-w-55">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={detailSearch}
              onChange={(event) => setDetailSearch(event.target.value)}
              placeholder="Cari Kantor Wilayah, kontrak, kabupaten..."
              className="h-10 pl-9"
            />
          </div>

          {/* Filter Status */}
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as "Filter Status" | "selesai" | "belum")
            }
          >
            <SelectTrigger className="h-10 w-full sm:w-40">
              <SelectValue placeholder="Status Tahapan" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="Filter Status">Filter Status</SelectItem>
              <SelectItem value="selesai">Selesai</SelectItem>
              <SelectItem value="belum">Belum Selesai</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter Sumber Anggaran */}
          <Select
            value={anggaranFilter}
            onValueChange={(value) =>
              setAnggaranFilter(
                value as "Filter Anggaran" | "PHLN" | "APBN" | "APBD",
              )
            }
          >
            <SelectTrigger className="h-10 w-full sm:w-37.5">
              <SelectValue placeholder="Sumber Anggaran" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="Filter Anggaran">Filter Anggaran</SelectItem>
              <SelectItem value="PHLN">PHLN</SelectItem>
              <SelectItem value="APBN">APBN</SelectItem>
              <SelectItem value="APBD">APBD</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* TABLE */}

      <div className="w-full overflow-x-auto rounded-lg border bg-background">
        <Table className="w-max min-w-full">
          <TableHeader>
            <TableRow className="bg-muted/70">
              <TableHead className="sticky left-0 z-30 min-w-14 border-r bg-muted text-center">
                No
              </TableHead>

              <TableHead className="min-w-52 border-r bg-muted">
                Kantor Wilayah
              </TableHead>

              {/* <TableHead className="min-w-64 border-r text-center">
                Nomor Kontrak
              </TableHead>

              <TableHead className="min-w-40 border-r text-right">
                Anggaran
              </TableHead> */}

              <TableHead className="sticky left-14 z-30 min-w-52 border-r bg-muted">
                Kabupaten
              </TableHead>

              {stages.map((stage) => (
                <TableHead
                  key={stage.tahapan_kegiatan_id}
                  className="min-w-70 border-l text-center"
                >
                  <div className="whitespace-normal text-xs font-bold">
                    {stage.urutan}. {stage.nama_tahapan}
                  </div>

                  <div className="mt-1 text-[10px] font-normal text-muted-foreground">
                    Bobot {stage.bobot}%
                  </div>

                  {STAGE_POINT_IDS.includes(stage.tahapan_kegiatan_id) && (
                    <Badge variant="secondary" className="mt-1 text-[9px]">
                      Capaian Titik
                    </Badge>
                  )}
                </TableHead>
              ))}

              {/* <TableHead className="sticky right-0 z-30 min-w-36 border-l bg-muted text-center">
                Realisasi Fisik
              </TableHead> */}
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredContracts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={stages.length + 6}
                  className="h-28 text-center text-muted-foreground"
                >
                  {contracts.length === 0
                    ? "Belum ada data kontrak."
                    : "Tidak ada data yang ditemukan."}
                </TableCell>
              </TableRow>
            ) : (
              filteredContracts.map((contract, contractIndex) => {
                const contractDetails = contract.detail ?? [];
                const contractRowSpan = contractDetails.length;

                return contractDetails.map((record, detailIndex) => {
                  const stageMap = new Map(
                    (record.tahapan ?? []).map((stage) => [
                      stage.tahapan_kegiatan_id,
                      stage,
                    ]),
                  );

                  const progress = toNumber(record.realisasi_fisik);

                  const isFirstRow = detailIndex === 0;

                  return (
                    <TableRow
                      key={`${contract.kanwilid}-${record.berkas_id}`}
                      className="transition-colors hover:bg-muted/30"
                    >
                      {/* NOMOR */}

                      {isFirstRow && (
                        <TableCell
                          rowSpan={contractRowSpan}
                          className="sticky left-0 z-20 border-r bg-background text-center align-middle font-bold"
                        >
                          {contractIndex + 1}
                        </TableCell>
                      )}

                      {/* PERUSAHAAN */}

                      {isFirstRow && (
                        <TableCell
                          rowSpan={contractRowSpan}
                          className="min-w-52 border-r bg-background align-middle"
                        >
                          <div className="min-w-52 space-y-2">
                            <div className="flex items-center gap-2">
                              <Building2 className="size-4 shrink-0 text-blue-600" />

                              <span className="text-sm font-bold">
                                {contract.Kanwil}
                              </span>
                            </div>

                            <Badge variant="outline" className="text-[10px]">
                              {contract.total_berkas} Berkas
                            </Badge>

                            <div className="pt-2">
                              <p className="text-[10px] text-muted-foreground">
                                Nama Kegiatan
                              </p>
                              <p className="break-all text-xs font-semibold">
                                {contract.nama_kegiatan}
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] text-muted-foreground">
                                Anggaran
                              </p>
                              <p className="text-xs font-bold tabular-nums">
                                {formatRupiah(toNumber(contract.anggaran))}
                              </p>
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-[10px] text-muted-foreground">
                                  Realisasi Fisik Kantor Wilayah
                                </p>

                                <span
                                  className={`text-xs font-bold tabular-nums ${getProgressTextColor(
                                    toNumber(contract.realisasi_fisik),
                                  )}`}
                                >
                                  {contract.realisasi_fisik != null
                                    ? formatPercent(
                                        toNumber(contract.realisasi_fisik),
                                      )
                                    : "-"}
                                </span>
                              </div>

                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                  className={`h-full rounded-full transition-all ${getProgressColor(
                                    toNumber(contract.realisasi_fisik),
                                  )}`}
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Math.max(
                                        0,
                                        toNumber(contract.realisasi_fisik),
                                      ),
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                            <div className="pt-2">
                              <p className="mb-1.5 text-[10px] text-muted-foreground">
                                Status Kegiatan
                              </p>

                              {contract.seluruh_berkas_selesai === true ? (
                                <Badge className="gap-1.5 border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-50">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Seluruh Kabupaten Selesai
                                </Badge>
                              ) : (
                                <Badge className="gap-1.5 border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 hover:bg-amber-50">
                                  <Clock3 className="h-3.5 w-3.5" />
                                  Masih dalam Proses
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      )}

                      {/* KABUPATEN */}

                      <TableCell className="sticky left-14 z-20 min-w-52 border-r bg-background align-middle">
                        <div className="space-y-2.5">
                          {/* Kabupaten */}
                          <div className="flex items-center gap-1.5 text-sm font-semibold">
                            <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate">
                              {record.kabupaten || "-"}
                            </span>
                          </div>

                          {/* Identitas Berkas */}
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">
                              {record.skala || "-"}
                            </Badge>

                            <Badge variant="secondary" className="text-[10px]">
                              {record.no_berkas || "-"}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px]">
                              {record.nama_anggaran || "-"}
                            </Badge>
                          </div>

                          {/* Status */}
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                record.seluruh_tahapan_selesai
                                  ? "gap-1.5 border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
                                  : "gap-1.5 border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
                              }
                            >
                              {record.seluruh_tahapan_selesai ? (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              ) : (
                                <Clock3 className="h-3.5 w-3.5" />
                              )}

                              {record.seluruh_tahapan_selesai
                                ? "Selesai"
                                : "Dalam Proses"}
                            </Badge>
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-muted-foreground">
                              Anggaran
                            </span>

                            <Badge
                              variant="secondary"
                              className="w-fit gap-1.5 border border-green-200 bg-green-50 px-2 py-1 text-[10px] font-semibold text-green-700 hover:bg-green-50"
                            >
                              <Wallet className="h-3 w-3" />
                              {formatRupiah(toNumber(record.anggaran))}
                            </Badge>
                          </div>

                          {/* Progress */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-muted-foreground">
                                Realisasi Fisik
                              </span>

                              <span
                                className={`text-sm font-bold tabular-nums ${getProgressTextColor(
                                  progress,
                                )}`}
                              >
                                {formatPercent(progress)}
                              </span>
                            </div>

                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className={`h-full rounded-full transition-all ${getProgressColor(
                                  progress,
                                )}`}
                                style={{
                                  width: `${Math.min(100, Math.max(0, progress))}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* TAHAPAN */}

                      {stages.map((definition) => (
                        <StageCell
                          key={definition.tahapan_kegiatan_id}
                          stage={stageMap.get(definition.tahapan_kegiatan_id)}
                        />
                      ))}

                      {/* REALISASI FISIK */}

                      {/* <TableCell className="sticky right-0 z-10 border-l bg-background text-center align-middle">
                        <div className="mx-auto min-w-[110px] space-y-2">
                          <p
                            className={`text-lg font-bold tabular-nums ${getProgressTextColor(
                              progress,
                            )}`}
                          >
                            {formatPercent(progress)}
                          </p>

                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full transition-all ${getProgressColor(
                                progress,
                              )}`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(0, progress),
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </TableCell> */}
                    </TableRow>
                  );
                });
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* FOOTER */}

      <div className="flex flex-col justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
        <p>
          Menampilkan {formatNumber(totalFilteredRows)} berkas dari{" "}
          {formatNumber(summary.totalBerkas)} berkas. Total{" "}
          {formatNumber(filteredContracts.length)} kontrak.
        </p>
      </div>
    </div>
  );
}
