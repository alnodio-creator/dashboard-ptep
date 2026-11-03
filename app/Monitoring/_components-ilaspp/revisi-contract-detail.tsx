"use client";

import { useMemo, useState } from "react";
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
  XCircle,
  CircleHelp,
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

// ======================================================
// TYPES
// ======================================================

type Tahapan = {
  tahapan_kegiatan_id: number;
  nama_tahapan: string;
  urutan: number;
  bobot: number;
  realisasi: number | null;
  target_titik: number;
  total_approved: number;
  sesuai: number;
  tidak_sesuai: number;
  belum_diperiksa: number;
  total_checklist: number;
};

type KabupatenDetail = {
  berkas_id: number;
  no_berkas: string;
  kode_kegiatan: string;
  skala: string;
  kabupaten: string;
  realisasi_fisik: number;
  seluruh_tahapan_selesai: boolean;
  tahapan: Tahapan[];
};

type ContractItem = {
  nama_perusahaan: string;
  no_kontrak: string;
  anggaran: number;
  kanwilid: string;
  total_berkas: number;
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

// Tahapan yang menampilkan informasi jumlah titik
const STAGE_POINT_IDS = [3, 10, 17, 25];

// Tahapan selesai hanya digunakan sebagai indikator status
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

function getProgressColor(value: number) {
  if (value >= 100) return "bg-emerald-500";
  if (value >= 75) return "bg-blue-500";
  if (value >= 40) return "bg-amber-500";
  return "bg-red-500";
}

function getProgressTextColor(value: number) {
  if (value >= 100) return "text-emerald-700";
  if (value >= 75) return "text-blue-700";
  if (value >= 40) return "text-amber-700";
  return "text-red-600";
}

function getUniqueKabupaten(detail: KabupatenDetail[]) {
  return new Set(detail.map((item) => item.kabupaten).filter(Boolean)).size;
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
    <div className="min-w-[110px] space-y-1.5">
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
      <TableCell className="border-l text-center align-middle">
        <span className="text-xs text-muted-foreground">-</span>
      </TableCell>
    );
  }

  const value = toNumber(stage.realisasi);
  const isPointStage = STAGE_POINT_IDS.includes(stage.tahapan_kegiatan_id);

  return (
    <TableCell className="min-w-38.75 border-l text-center align-middle">
      <div className="mx-auto max-w-36.25 space-y-2">
        <p
          className={`text-sm font-bold tabular-nums ${
            stage.realisasi === null
              ? "text-muted-foreground"
              : getProgressTextColor(value)
          }`}
        >
          {stage.realisasi === null ? "-" : formatPercent(value)}
        </p>

        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full ${getProgressColor(value)}`}
            style={{
              width: `${Math.min(100, Math.max(0, value))}%`,
            }}
          />
        </div>

        {isPointStage ? (
          <div className="rounded-md border bg-muted/30 px-2 py-1.5">
            <p className="text-[10px] text-muted-foreground">
              Titik disetujui / target
            </p>

            <p className="mt-0.5 whitespace-nowrap text-xs font-bold tabular-nums">
              {formatNumber(toNumber(stage.total_approved))}
              <span className="font-normal text-muted-foreground">{" / "}</span>
              {formatNumber(toNumber(stage.target_titik))}
            </p>

            <p className="text-[10px] text-muted-foreground">Titik</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            <p className="text-[10px] text-muted-foreground">
              Bobot {stage.bobot}%
            </p>

            <p className="text-[10px] text-muted-foreground">
              Sesuai: {stage.sesuai} / {stage.total_checklist}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                {stage.sesuai}
              </span>

              <span className="inline-flex items-center gap-1">
                <XCircle className="h-3 w-3 text-red-500" />
                {stage.tidak_sesuai}
              </span>

              <span className="inline-flex items-center gap-1">
                <CircleHelp className="h-3 w-3 text-amber-500" />
                {stage.belum_diperiksa}
              </span>
            </div>
          </div>
        )}
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

export default function ContractDetail({
  nomor_kontrak,
}: {
  nomor_kontrak: string;
}) {
  const [detailSearch, setDetailSearch] = useState("");

  // ====================================================
  // FETCH API
  // ====================================================

  const {
    data: contract,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["monitoring-qc-ilaspprev", nomor_kontrak],

    queryFn: async (): Promise<ContractItem> => {
      if (!nomor_kontrak) {
        throw new Error("Nomor kontrak tidak tersedia");
      }

      const response = await fetch(
        `${basePath}/api/monitoring-qc-ilaspprev?nomor_kontrak=${encodeURIComponent(
          nomor_kontrak,
        )}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error(`Gagal mengambil data. HTTP ${response.status}`);
      }

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Gagal mengambil data");
      }

      if (!result.data || result.data.length === 0) {
        throw new Error("Data kontrak tidak ditemukan");
      }

      return result.data[0];
    },

    enabled: Boolean(nomor_kontrak),

    staleTime: 1000 * 60 * 2,
  });

  // ====================================================
  // STAGE DEFINITIONS
  // ====================================================

  const stages = useMemo(() => {
    if (!contract) return [];

    const stageMap = new Map<number, Tahapan>();

    contract.detail.forEach((record) => {
      record.tahapan.forEach((stage) => {
        // Selesai tidak dijadikan kolom checklist
        if (FINISHED_STAGE_IDS.includes(stage.tahapan_kegiatan_id)) {
          return;
        }

        if (!stageMap.has(stage.tahapan_kegiatan_id)) {
          stageMap.set(stage.tahapan_kegiatan_id, stage);
        }
      });
    });

    return Array.from(stageMap.values()).sort((a, b) => a.urutan - b.urutan);
  }, [contract]);

  // ====================================================
  // SEARCH FILTER
  // ====================================================

  const filteredRecords = useMemo(() => {
    if (!contract) return [];

    const keyword = normalize(detailSearch);

    return contract.detail.filter(
      (record) =>
        !keyword ||
        normalize(record.kabupaten).includes(keyword) ||
        normalize(record.no_berkas).includes(keyword) ||
        normalize(record.skala).includes(keyword),
    );
  }, [contract, detailSearch]);

  // ====================================================
  // LOADING
  // ====================================================

  if (isLoading) {
    return (
      <div className="flex min-h-[250px] flex-col items-center justify-center gap-3">
        <RefreshCw className="size-7 animate-spin text-blue-600" />

        <p className="text-sm text-muted-foreground">
          Mengambil data monitoring kontrak...
        </p>
      </div>
    );
  }

  // ====================================================
  // ERROR
  // ====================================================

  if (isError || !contract) {
    return (
      <div className="flex min-h-[250px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6">
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
  // SUMMARY
  // ====================================================

  const realisasi = toNumber(contract.realisasi_fisik);

  const totalKabupaten = getUniqueKabupaten(contract.detail);

  const totalSelesai = contract.detail.filter(
    (item) => item.seluruh_tahapan_selesai,
  ).length;

  const totalProses = contract.detail.length - totalSelesai;

  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-blue-600" />

            <h3 className="text-base font-bold">
              Monitoring Realisasi Kontrak
            </h3>
          </div>

          <p className="mt-1 text-sm font-semibold">
            {contract.nama_perusahaan}
          </p>

          <p className="mt-1 break-all text-xs text-muted-foreground">
            No. Kontrak: {contract.no_kontrak}
          </p>
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

      {/* ==================================================
          SUMMARY CARDS
      ================================================== */}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard
          title="Total Anggaran"
          value={formatRupiah(toNumber(contract.anggaran))}
          description="Nilai kontrak"
          icon={Wallet}
          color="bg-blue-100 text-blue-700"
        />

        <SummaryCard
          title="Total Berkas"
          value={formatNumber(contract.total_berkas)}
          description={`${totalSelesai} selesai · ${totalProses} proses`}
          icon={FileText}
          color="bg-violet-100 text-violet-700"
        />

        <SummaryCard
          title="Kabupaten / Kota"
          value={formatNumber(totalKabupaten)}
          description="Wilayah dalam kontrak"
          icon={MapPin}
          color="bg-amber-100 text-amber-700"
        />

        <SummaryCard
          title="Realisasi Fisik"
          value={formatPercent(realisasi)}
          description="Capaian keseluruhan kontrak"
          icon={ChartNoAxesCombined}
          color="bg-emerald-100 text-emerald-700"
        />
      </div>

      {/* ==================================================
          OVERALL PROGRESS
      ================================================== */}

      <Card className="shadow-sm">
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">
                Progres Keseluruhan Kontrak
              </p>

              <p className="text-xs text-muted-foreground">
                Akumulasi realisasi fisik seluruh berkas
              </p>
            </div>

            <Badge
              variant="outline"
              className={
                contract.seluruh_berkas_selesai
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-blue-200 bg-blue-50 text-blue-700"
              }
            >
              {contract.seluruh_berkas_selesai
                ? "Seluruh Berkas Selesai"
                : "Dalam Proses"}
            </Badge>
          </div>

          <ProgressBar value={realisasi} />

          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>
              {totalSelesai} dari {contract.detail.length} berkas selesai
            </span>

            <span>{totalProses} berkas dalam proses</span>
          </div>
        </CardContent>
      </Card>

      {/* ==================================================
          SEARCH
      ================================================== */}

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h4 className="font-bold">Rincian Capaian Kabupaten / Berkas</h4>

          <p className="mt-1 text-xs text-muted-foreground">
            Detail pemeriksaan checklist dan progres setiap tahapan.
          </p>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={detailSearch}
            onChange={(event) => setDetailSearch(event.target.value)}
            placeholder="Cari kabupaten / nomor berkas..."
            className="h-10 pl-9"
          />
        </div>
      </div>

      {/* ==================================================
          TABLE
      ================================================== */}

      <div className="w-full overflow-x-auto rounded-lg border bg-background">
        <Table className="w-max min-w-full">
          <TableHeader>
            <TableRow className="bg-muted/70">
              <TableHead className="sticky left-0 z-20 min-w-55 border-r bg-muted">
                Kabupaten / Wilayah
              </TableHead>

              <TableHead className="min-w-35 text-center">
                Nomor Berkas
              </TableHead>

              <TableHead className="min-w-25 text-center">Skala</TableHead>

              {stages.map((stage) => (
                <TableHead
                  key={stage.tahapan_kegiatan_id}
                  className="min-w-38.75 border-l text-center"
                >
                  <div className="whitespace-normal text-xs font-semibold">
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

              <TableHead className="sticky right-0 z-20 min-w-37.5 border-l bg-muted text-center">
                Realisasi Fisik
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={stages.length + 4}
                  className="h-28 text-center text-muted-foreground"
                >
                  Tidak ada data berkas yang ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords.map((record) => {
                const stageMap = new Map(
                  record.tahapan.map((stage) => [
                    stage.tahapan_kegiatan_id,
                    stage,
                  ]),
                );

                const progress = toNumber(record.realisasi_fisik);

                return (
                  <TableRow
                    key={record.berkas_id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    {/* KABUPATEN */}

                    <TableCell className="sticky left-0 z-10 min-w-55 border-r bg-background align-middle">
                      <div className="space-y-2">
                        <p className="flex items-center gap-1.5 text-sm font-semibold">
                          <MapPin className="size-3.5 shrink-0 text-muted-foreground" />

                          {record.kabupaten || "-"}
                        </p>

                        <Badge variant="outline" className="text-[10px]">
                          {record.kode_kegiatan === "01"
                            ? "Pembuatan ZNT"
                            : record.kode_kegiatan === "02"
                              ? "Pembaruan ZNT"
                              : record.kode_kegiatan}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* NOMOR BERKAS */}

                    <TableCell className="text-center align-middle">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <span className="whitespace-nowrap text-xs font-semibold">
                          {record.no_berkas || "-"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-center align-middle">
                      <div className="flex flex-col items-center gap-1">
                        <Badge variant="secondary" className="text-[10px]">
                          {record.skala || "-"}
                        </Badge>

                        <Badge
                          className={`text-[10px] ${
                            record.seluruh_tahapan_selesai
                              ? "border-green-200 bg-green-100 text-green-700 hover:bg-green-100"
                              : "border-blue-200 bg-blue-100 text-blue-700 hover:bg-blue-100"
                          }`}
                        >
                          {record.seluruh_tahapan_selesai
                            ? "Selesai"
                            : "Masih Proses"}
                        </Badge>
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

                    <TableCell className="sticky right-0 z-10 border-l bg-background text-center align-middle">
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
                              width: `${Math.min(100, Math.max(0, progress))}%`,
                            }}
                          />
                        </div>

                        <Badge
                          variant="outline"
                          className={
                            record.seluruh_tahapan_selesai
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-blue-200 bg-blue-50 text-blue-700"
                          }
                        >
                          {record.seluruh_tahapan_selesai
                            ? "Selesai"
                            : "Belum Selesai"}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ==================================================
          FOOTER
      ================================================== */}

      <div className="flex flex-col justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
        <p>
          Menampilkan {filteredRecords.length} dari {contract.detail.length}{" "}
          berkas.
        </p>

        <p>
          Tahapan ID {STAGE_POINT_IDS.join(", ")} menampilkan perbandingan titik
          disetujui dan target.
        </p>
      </div>
    </div>
  );
}
