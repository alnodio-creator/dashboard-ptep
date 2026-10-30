"use client";

import { Fragment, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  RefreshCw,
  Search,
  FileCheck2,
  Building2,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock3,
  Filter,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

// ======================================================
// TYPES
// ======================================================

type Tahapan = {
  bobot: number;
  sesuai: number;
  tidak_sesuai: number;
  belum_diperiksa: number;
  total_checklist: number;
  urutan: number;
  realisasi: number | null;
  nama_tahapan: string;
  tahapan_kegiatan_id: number;
};

type MonitoringRecord = {
  berkas_id: number;
  no_berkas: string;
  kode_kegiatan: string;
  skala: string;
  kabupaten: string;
  nama_perusahaan: string;
  kanwilid: string;
  realisasi_fisik: string | number;
  seluruh_tahapan_selesai: boolean;
  tahapan: Tahapan[];
};

type MonitoringResponse = {
  success: boolean;
  message: string;
  total: number;
  data: MonitoringRecord[];
};

// ======================================================
// HELPERS
// ======================================================

const numberFormat = new Intl.NumberFormat("id-ID");

function formatNumber(value: number) {
  return numberFormat.format(value);
}

function formatPercent(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";

  return `${new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(value)}%`;
}

function getRealisasi(record: MonitoringRecord) {
  const value = Number(record.realisasi_fisik);

  return Number.isFinite(value) ? value : 0;
}

function getStagePercentage(stage: Tahapan) {
  if (!stage.total_checklist) return 0;

  return (stage.sesuai / stage.total_checklist) * 100;
}

function getStageColor(stage: Tahapan) {
  if (stage.total_checklist === 0) {
    return "bg-slate-100 text-slate-600 border-slate-200";
  }

  if (stage.sesuai === stage.total_checklist) {
    return "bg-green-100 text-green-800 border-green-200";
  }

  if (stage.tidak_sesuai > 0) {
    return "bg-red-100 text-red-800 border-red-200";
  }

  return "bg-slate-100 text-slate-600 border-slate-200";
}

// ======================================================
// STAGE CELL
// ======================================================

function StageCell({ stage }: { stage: Tahapan | undefined }) {
  if (!stage) {
    return (
      <TableCell className="border-l text-center">
        <span className="text-muted-foreground">—</span>
      </TableCell>
    );
  }

  const percentage = getStagePercentage(stage);

  return (
    <TableCell className="min-w-[145px] border-l align-middle">
      <div className="space-y-2">
        {/* Jumlah checklist */}
        <div className="flex items-center justify-between gap-2">
          <Badge
            variant="outline"
            className={`font-bold ${getStageColor(stage)}`}
          >
            {formatNumber(stage.sesuai)}/{formatNumber(stage.total_checklist)}
          </Badge>

          <span className="text-xs font-semibold tabular-nums">
            {formatPercent(stage.realisasi)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="bg-green-500 transition-all"
            style={{
              width: `${
                stage.total_checklist
                  ? (stage.sesuai / stage.total_checklist) * 100
                  : 0
              }%`,
            }}
          />

          <div
            className="bg-red-500"
            style={{
              width: `${
                stage.total_checklist
                  ? (stage.tidak_sesuai / stage.total_checklist) * 100
                  : 0
              }%`,
            }}
          />

          <div
            className="bg-slate-300"
            style={{
              width: `${
                stage.total_checklist
                  ? (stage.belum_diperiksa / stage.total_checklist) * 100
                  : 0
              }%`,
            }}
          />
        </div>

        {/* Detail status */}
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px]">
          <span className="flex items-center gap-1 text-green-700">
            <CheckCircle2 className="size-3" />
            {stage.sesuai}
          </span>

          <span className="flex items-center gap-1 text-red-600">
            <XCircle className="size-3" />
            {stage.tidak_sesuai}
          </span>

          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock3 className="size-3" />
            {stage.belum_diperiksa}
          </span>
        </div>

        <p className="text-[10px] text-muted-foreground">
          Bobot: {stage.bobot}%
        </p>
      </div>
    </TableCell>
  );
}

// ======================================================
// MAIN COMPONENT
// ======================================================

export function MonitoringCapaianIlaspp({
  kanwilid,
  kode_kegiatan,
}: {
  kanwilid: string;
  kode_kegiatan: string;
}) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("semua");

  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<MonitoringResponse>({
    queryKey: ["monitoring-capaian", kanwilid, kode_kegiatan],
    enabled: Boolean(kanwilid && kode_kegiatan),

    queryFn: async () => {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

      const url =
        `${basePath}/api/monitoring-qc-ilaspp` +
        `?kanwilid=${encodeURIComponent(kanwilid)}` +
        `&kode_kegiatan=${encodeURIComponent(kode_kegiatan)}`;

      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`Gagal mengambil data monitoring: ${res.status}`);
      }

      const result: MonitoringResponse = await res.json();

      if (!result.success) {
        throw new Error(result.message || "Gagal mengambil data monitoring.");
      }

      return result;
    },
  });

  // ====================================================
  // DYNAMIC STAGES
  // Mengambil nama dan urutan tahapan langsung dari API.
  // ====================================================

  const stages = useMemo(() => {
    const map = new Map<number, Tahapan>();

    for (const record of response?.data ?? []) {
      for (const stage of record.tahapan ?? []) {
        if (!map.has(stage.tahapan_kegiatan_id)) {
          map.set(stage.tahapan_kegiatan_id, stage);
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => a.urutan - b.urutan);
  }, [response?.data]);

  // ====================================================
  // FILTER
  // ====================================================

  const filteredData = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return (response?.data ?? []).filter((record) => {
      const matchesSearch = [
        record.kabupaten,
        record.nama_perusahaan,
        record.no_berkas,
        record.skala,
      ].some((value) => (value ?? "").toLowerCase().includes(keyword));

      const realisasi = getRealisasi(record);

      const matchesStatus =
        filterStatus === "semua" ||
        (filterStatus === "selesai" && record.seluruh_tahapan_selesai) ||
        (filterStatus === "berjalan" && !record.seluruh_tahapan_selesai) ||
        (filterStatus === "belum" && realisasi === 0);

      return matchesSearch && matchesStatus;
    });
  }, [response?.data, search, filterStatus]);

  // ====================================================
  // SUMMARY
  // ====================================================

  const summary = useMemo(() => {
    const records = response?.data ?? [];

    const totalRealisasi = records.reduce(
      (sum, item) => sum + getRealisasi(item),
      0,
    );

    return {
      total: records.length,
      selesai: records.filter((item) => item.seluruh_tahapan_selesai).length,
      berjalan: records.filter((item) => !item.seluruh_tahapan_selesai).length,
      rataRata: records.length > 0 ? totalRealisasi / records.length : 0,
    };
  }, [response?.data]);

  if (!kanwilid || !kode_kegiatan) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Pilih Kanwil dan jenis kegiatan terlebih dahulu.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full min-w-0 overflow-hidden">
      <CardContent className="space-y-5 p-3 sm:p-5">
        {/* HEADER */}
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold">
              Monitoring Capaian Realisasi Fisik
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitoring hasil pemeriksaan QC checklist pada setiap tahapan
              kegiatan.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`mr-2 size-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* SUMMARY */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard
            label="Total Berkas"
            value={formatNumber(summary.total)}
            icon={<FileCheck2 className="size-5" />}
          />

          <SummaryCard
            label="Tahapan Selesai"
            value={formatNumber(summary.selesai)}
            icon={<CheckCircle2 className="size-5 text-green-600" />}
          />

          <SummaryCard
            label="Dalam Proses"
            value={formatNumber(summary.berjalan)}
            icon={<Clock3 className="size-5 text-blue-600" />}
          />

          <SummaryCard
            label="Rata-rata Realisasi"
            value={formatPercent(summary.rataRata)}
            icon={<Building2 className="size-5" />}
          />
        </div>

        {/* FILTER */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kabupaten, perusahaan, nomor berkas..."
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="semua">Semua Status</option>
              <option value="selesai">Selesai</option>
              <option value="berjalan">Dalam Proses</option>
              <option value="belum">Belum Ada Realisasi</option>
            </select>
          </div>
        </div>

        {/* LOADING / ERROR / TABLE */}
        {isLoading ? (
          <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="size-4 animate-spin" />
            Memuat monitoring capaian...
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error instanceof Error ? error.message : "Gagal mengambil data."}
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-lg border">
            <Table className="w-max min-w-full">
              {/* TABLE HEADER */}
              <TableHeader>
                <TableRow className="bg-muted/70">
                  <TableHead
                    rowSpan={2}
                    className="sticky left-0 z-30 min-w-[220px] border-r bg-muted align-middle"
                  >
                    Kabupaten / Perusahaan
                  </TableHead>

                  <TableHead
                    rowSpan={2}
                    className="min-w-[135px] text-center align-middle"
                  >
                    Nomor Berkas
                  </TableHead>

                  {stages
                    .filter(
                      (stage) => stage.nama_tahapan.toLowerCase() !== "selesai",
                    )
                    .map((stage) => (
                      <TableHead
                        key={stage.tahapan_kegiatan_id}
                        rowSpan={2}
                        className="min-w-[145px] border-l text-center align-middle"
                      >
                        <div className="whitespace-normal text-xs font-semibold">
                          {stage.urutan}. {stage.nama_tahapan}
                        </div>
                        <div className="mt-1 text-[10px] font-normal text-muted-foreground">
                          Bobot {stage.bobot}%
                        </div>
                      </TableHead>
                    ))}

                  <TableHead
                    rowSpan={2}
                    className="sticky right-0 z-30 min-w-[125px] border-l bg-muted text-center align-middle"
                  >
                    Realisasi Fisik
                  </TableHead>
                </TableRow>

                <TableRow className="bg-muted/70" />
              </TableHeader>

              {/* TABLE BODY */}
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={stages.length + 3}
                      className="h-28 text-center text-muted-foreground"
                    >
                      Tidak ada data yang sesuai dengan filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((record) => {
                    const stageMap = new Map(
                      record.tahapan.map((stage) => [
                        stage.tahapan_kegiatan_id,
                        stage,
                      ]),
                    );

                    return (
                      <TableRow
                        key={record.berkas_id}
                        className="hover:bg-muted/30"
                      >
                        {/* WILAYAH */}
                        <TableCell className="sticky left-0 z-20 min-w-[220px] border-r bg-background align-middle">
                          <div className="space-y-1">
                            <p className="flex items-center gap-1.5 text-sm font-semibold">
                              <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                              {record.kabupaten}
                            </p>

                            <p className="max-w-[210px] text-xs text-muted-foreground">
                              {record.nama_perusahaan}
                            </p>

                            <Badge variant="outline" className="text-[10px]">
                              {record.skala}
                            </Badge>
                          </div>
                        </TableCell>

                        {/* NOMOR BERKAS */}
                        <TableCell className="text-center align-middle">
                          <span className="whitespace-nowrap text-xs font-medium">
                            {record.no_berkas}
                          </span>
                        </TableCell>

                        {/* STAGES */}
                        {stages
                          .filter(
                            (stage) =>
                              stage.nama_tahapan.toLowerCase() !== "selesai",
                          )
                          .map((definition) => (
                            <StageCell
                              key={definition.tahapan_kegiatan_id}
                              stage={stageMap.get(
                                definition.tahapan_kegiatan_id,
                              )}
                            />
                          ))}

                        {/* AGGREGATE */}
                        <TableCell className="sticky right-0 z-20 border-l bg-background text-center align-middle">
                          <div className="space-y-2">
                            <p className="text-lg font-bold tabular-nums">
                              {formatPercent(getRealisasi(record))}
                            </p>

                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Math.max(0, getRealisasi(record)),
                                  )}%`,
                                }}
                              />
                            </div>

                            <Badge
                              variant="outline"
                              className={
                                record.seluruh_tahapan_selesai
                                  ? "border-green-200 bg-green-50 text-green-700"
                                  : "border-blue-200 bg-blue-50 text-blue-700"
                              }
                            >
                              {record.seluruh_tahapan_selesai
                                ? "Selesai"
                                : "Proses"}
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
        )}

        {/* LEGEND */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 border-t pt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-green-500" />
            Sesuai
          </span>

          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-red-500" />
            Tidak sesuai
          </span>

          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-slate-300" />
            Belum diperiksa
          </span>

          <span className="ml-auto text-right">
            Menampilkan {filteredData.length} dari {summary.total} berkas
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ======================================================
// SUMMARY CARD
// ======================================================

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground sm:text-sm">{label}</p>
        {icon}
      </div>

      <p className="mt-2 text-xl font-bold tabular-nums sm:text-2xl">{value}</p>
    </div>
  );
}
