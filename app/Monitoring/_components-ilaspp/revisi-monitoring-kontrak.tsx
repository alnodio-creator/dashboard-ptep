"use client";

import { Fragment, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  Building2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock3,
  MapPin,
  FileCheck2,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Kegiatan } from "../types/type";
import { formatRupiah } from "@/constants/auth-constants";
import { formatNumber } from "@/data/land-values";

// ======================================================
// TYPES
// ======================================================

type ContractGroup = {
  key: string;
  nomor_kontrak: string | null;
  nama_perusahaan: string;
  penanggung_jawab: string;
  kanwilid: string;
  kode_kegiatan: string;
  items: Kegiatan[];
  anggaran: number;
};

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

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// ======================================================
// HELPERS
// ======================================================

function normalize(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function numberValue(value: unknown): number {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

function getRealisasi(record: MonitoringRecord) {
  return numberValue(record.realisasi_fisik);
}

function formatPercent(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";

  return `${new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(value)}%`;
}

function getStageColor(stage: Tahapan) {
  if (!stage.total_checklist) {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }

  if (stage.sesuai === stage.total_checklist) {
    return "border-green-200 bg-green-100 text-green-800";
  }

  if (stage.tidak_sesuai > 0) {
    return "border-red-200 bg-red-100 text-red-800";
  }

  return "border-slate-200 bg-slate-100 text-slate-600";
}

// ======================================================
// GROUP BY CONTRACT
// ======================================================

function groupByContract(items: Kegiatan[]): ContractGroup[] {
  const map = new Map<string, ContractGroup>();

  items.forEach((item) => {
    const nomor = item.nomor_kontrak?.trim() || "";
    const perusahaan =
      item.nama_perusahaan?.trim() || "Perusahaan Tidak Diketahui";

    // Nomor kontrak sama dalam perusahaan yang sama
    // digabung menjadi satu kelompok.
    const key = nomor
      ? `${normalize(perusahaan)}-${normalize(nomor)}`
      : `${normalize(perusahaan)}-berkas-${item.no_berkas}`;

    const existing = map.get(key);

    if (!existing) {
      map.set(key, {
        key,
        nomor_kontrak: nomor || null,
        nama_perusahaan: perusahaan,
        penanggung_jawab: item.penanggung_jawab || "-",
        kanwilid: item.kanwilid || "",
        kode_kegiatan: item.kode_kegiatan || "",
        items: [item],

        // Anggaran diambil sekali saja.
        // Tidak dijumlahkan berdasarkan jumlah berkas.
        anggaran: numberValue(item.anggaran),
      });
    } else {
      existing.items.push(item);
    }
  });

  return Array.from(map.values()).sort((a, b) =>
    a.nama_perusahaan.localeCompare(b.nama_perusahaan, "id"),
  );
}

// ======================================================
// MAIN TABLE
// ======================================================

export function MonitoringKontrakTable({ data }: { data: Kegiatan[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedContract, setSelectedContract] = useState<string | null>(null);

  // ====================================================
  // SEARCH
  // ====================================================

  const filteredData = useMemo(() => {
    const keyword = normalize(search);

    if (!keyword) return data;

    return data.filter((item) =>
      [
        item.nama_perusahaan,
        item.penanggung_jawab,
        item.nomor_kontrak,
        item.no_berkas,
        item.namakantor,
        item.Kabupaten,
        item.nama_kegiatan,
        item.nama_tahapan,
      ].some((value) => normalize(value).includes(keyword)),
    );
  }, [data, search]);

  // ====================================================
  // GROUPING
  // ====================================================

  const groupedData = useMemo(
    () => groupByContract(filteredData),
    [filteredData],
  );

  // ====================================================
  // PAGINATION
  // ====================================================

  const totalPages = Math.max(1, Math.ceil(groupedData.length / pageSize));

  const currentPage = Math.min(page, totalPages);

  const paginatedGroups = groupedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  // ====================================================
  // SUMMARY
  // ====================================================

  const summary = useMemo(() => {
    const companies = new Set(
      filteredData.map((item) => normalize(item.nama_perusahaan)),
    );

    return {
      perusahaan: companies.size,
      kontrak: groupedData.length,
      berkas: filteredData.length,
    };
  }, [filteredData, groupedData]);

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-3 border-b bg-muted/20 p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <Building2 className="size-5" />
          </div>

          <div>
            <h3 className="font-bold">Monitoring Perusahaan dan Kontrak</h3>

            <p className="mt-1 text-xs text-muted-foreground">
              Klik nama perusahaan untuk melihat detail realisasi fisik dan
              progress QC setiap tahapan.
            </p>
          </div>
        </div>

        <Badge variant="outline">
          {groupedData.length.toLocaleString("id-ID")} Kontrak
        </Badge>
      </div>

      {/* SEARCH */}
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
              setSelectedContract(null);
            }}
            placeholder="Cari perusahaan, nomor kontrak, kabupaten..."
            className="h-10 pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            Tampilkan
          </span>

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>

          <span className="text-sm text-muted-foreground">kontrak</span>
        </div>
      </div>

      {/* MAIN TABLE */}
      <div className="max-h-[750px] overflow-auto">
        <Table className="min-w-[1750px]">
          <TableHeader className="sticky top-0 z-30 bg-muted">
            <TableRow>
              <TableHead className="w-16 px-4">No.</TableHead>

              <TableHead className="sticky left-0 z-40 min-w-[260px] bg-muted">
                Perusahaan
              </TableHead>

              <TableHead className="min-w-[250px]">Nomor Kontrak</TableHead>

              <TableHead className="min-w-[190px] text-right">
                Anggaran
              </TableHead>

              {/* <TableHead className="min-w-[190px]">Kabupaten/Kota</TableHead> */}

              <TableHead className="min-w-[150px]">Nomor Berkas</TableHead>

              <TableHead className="min-w-[180px]">Tahapan</TableHead>

              <TableHead>Tahun</TableHead>

              <TableHead className="min-w-[140px] text-right">
                Target Luasan
              </TableHead>

              <TableHead>Skala</TableHead>

              {/* <TableHead>Sumber Anggaran</TableHead> */}

              <TableHead className="min-w-[200px]">Penanggung Jawab</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedGroups.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={12}
                  className="h-32 text-center text-muted-foreground"
                >
                  Tidak ada data yang sesuai.
                </TableCell>
              </TableRow>
            ) : (
              paginatedGroups.map((group, index) => {
                const isExpanded = selectedContract === group.key;

                return (
                  <Fragment key={group.key}>
                    {/* =================================
                        CONTRACT ROWS
                    ================================= */}

                    {group.items.map((item, itemIndex) => {
                      const isFirst = itemIndex === 0;

                      return (
                        <TableRow
                          key={`${group.key}-${item.no_berkas}-${itemIndex}`}
                          className={
                            isExpanded
                              ? "bg-blue-50/50 dark:bg-blue-950/20"
                              : "hover:bg-muted/30"
                          }
                        >
                          {/* NO */}
                          <TableCell className="text-muted-foreground">
                            {((currentPage - 1) * pageSize + index + 1)
                              .toString()
                              .padStart(2, "0")}
                            <span className="text-[10px]">
                              .{itemIndex + 1}
                            </span>
                          </TableCell>

                          {/* COMPANY */}
                          {isFirst && (
                            <TableCell
                              rowSpan={group.items.length}
                              className="sticky left-0 z-20 min-w-[260px] border-r bg-background align-middle"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedContract(
                                    isExpanded ? null : group.key,
                                  )
                                }
                                className="group flex w-full items-center gap-2 text-left"
                              >
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                                  <Building2 className="size-4" />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-blue-700 group-hover:underline">
                                    {group.nama_perusahaan}
                                  </p>

                                  <p className="mt-1 text-[11px] text-muted-foreground">
                                    {group.items.length} berkas
                                  </p>
                                </div>

                                {isExpanded ? (
                                  <ChevronUp className="size-4 shrink-0 text-blue-600" />
                                ) : (
                                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                                )}
                              </button>
                            </TableCell>
                          )}

                          {/* CONTRACT */}
                          {isFirst && (
                            <TableCell
                              rowSpan={group.items.length}
                              className="min-w-[250px] whitespace-normal border-r bg-blue-50/40 align-middle dark:bg-blue-950/10"
                            >
                              <p className="text-xs font-bold text-blue-800 dark:text-blue-300">
                                {group.nomor_kontrak ||
                                  "Tidak ada nomor kontrak"}
                              </p>

                              <Badge
                                variant="outline"
                                className="mt-2 text-[10px]"
                              >
                                {group.items.length} Berkas
                              </Badge>
                            </TableCell>
                          )}

                          {/* BUDGET */}
                          {isFirst && (
                            <TableCell
                              rowSpan={group.items.length}
                              className="min-w-[190px] bg-emerald-50/50 text-right align-middle font-bold tabular-nums dark:bg-emerald-950/10"
                            >
                              {formatRupiah(group.anggaran)}
                            </TableCell>
                          )}

                          {/* KABUPATEN */}
                          {/* <TableCell className="font-medium">
                            {item.Kabupaten || "-"}
                          </TableCell> */}

                          {/* NO BERKAS */}
                          <TableCell className="text-xs font-semibold">
                            {item.no_berkas || "-"}
                          </TableCell>

                          {/* TAHAPAN */}
                          <TableCell className="min-w-[180px] max-w-[240px] whitespace-normal">
                            <Badge
                              variant="outline"
                              className="block w-full whitespace-normal break-words px-2 py-1.5 text-left text-[10px] font-normal leading-relaxed"
                            >
                              {item.nama_tahapan || "-"}
                            </Badge>
                          </TableCell>

                          {/* TAHUN */}
                          <TableCell>{item.anggaran_tahun ?? "-"}</TableCell>

                          {/* TARGET */}
                          <TableCell className="text-right tabular-nums">
                            {formatNumber(numberValue(item.target_luasan))}
                          </TableCell>

                          {/* SKALA */}
                          <TableCell>{item.skala || "-"}</TableCell>

                          {/* SUMBER */}
                          {/* <TableCell>
                            <Badge variant="outline">
                              {item.nama_anggaran || "-"}
                            </Badge>
                          </TableCell> */}

                          {/* PJ */}
                          <TableCell className="whitespace-normal text-xs">
                            {item.penanggung_jawab || "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {/* =================================
                        EXPANDED MONITORING DETAIL
                    ================================= */}

                    {isExpanded && (
                      <TableRow className="bg-slate-50/70 dark:bg-slate-950/30">
                        <TableCell colSpan={12} className="p-3 sm:p-5">
                          <MonitoringCapaianDetail
                            key={group.key}
                            nama_perusahaan={group.nama_perusahaan}
                            kanwilid={group.kanwilid}
                            kode_kegiatan={group.kode_kegiatan}
                            berkasNos={
                              group.items
                                .map((item) => item.no_berkas)
                                .filter(Boolean) as string[]
                            }
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
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
          {groupedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          {"–"}
          {Math.min(currentPage * pageSize, groupedData.length)}
          {" dari "}
          {groupedData.length.toLocaleString("id-ID")} kontrak.
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => {
              setPage((prev) => Math.max(1, prev - 1));
              setSelectedContract(null);
            }}
          >
            <ChevronLeft className="size-4" />
            Sebelumnya
          </Button>

          <Badge variant="secondary">
            {currentPage} / {totalPages}
          </Badge>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => {
              setPage((prev) => Math.min(totalPages, prev + 1));
              setSelectedContract(null);
            }}
          >
            Berikutnya
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ======================================================
// MONITORING DETAIL - FETCH API
// ======================================================

function MonitoringCapaianDetail({
  nama_perusahaan,
  kanwilid,
  kode_kegiatan,
  berkasNos,
}: {
  nama_perusahaan: string;
  kanwilid: string;
  kode_kegiatan: string;
  berkasNos: string[];
}) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("semua");

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  // ====================================================
  // FETCH DETAIL
  // ====================================================

  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<MonitoringResponse>({
    queryKey: [
      "monitoring-capaian-kontrak",
      kanwilid,
      kode_kegiatan,
      normalize(nama_perusahaan),
      berkasNos,
    ],

    enabled: Boolean(kanwilid && kode_kegiatan),

    queryFn: async () => {
      const params = new URLSearchParams({
        kanwilid,
        kode_kegiatan,
      });

      const res = await fetch(
        `${basePath}/api/monitoring-qc-ilaspp?${params.toString()}`,
      );

      if (!res.ok) {
        throw new Error(`Gagal mengambil data monitoring: ${res.status}`);
      }

      const result: MonitoringResponse = await res.json();

      if (!result.success) {
        throw new Error(result.message || "Gagal mengambil monitoring QC.");
      }

      return result;
    },
  });

  // ====================================================
  // FILTER DETAIL BERDASARKAN KONTRAK
  // ====================================================

  const contractRecords = useMemo(() => {
    const allowedNos = new Set(berkasNos.map((value) => normalize(value)));

    return (response?.data ?? []).filter((record) => {
      return (
        normalize(record.nama_perusahaan) === normalize(nama_perusahaan) &&
        allowedNos.has(normalize(record.no_berkas))
      );
    });
  }, [response?.data, berkasNos, nama_perusahaan]);

  // ====================================================
  // DYNAMIC STAGES
  // ====================================================

  const stages = useMemo(() => {
    const map = new Map<number, Tahapan>();

    for (const record of contractRecords) {
      for (const stage of record.tahapan ?? []) {
        if (!map.has(stage.tahapan_kegiatan_id)) {
          map.set(stage.tahapan_kegiatan_id, stage);
        }
      }
    }

    return Array.from(map.values())
      .filter((stage) => normalize(stage.nama_tahapan) !== "selesai")
      .sort((a, b) => a.urutan - b.urutan);
  }, [contractRecords]);

  // ====================================================
  // SEARCH & STATUS FILTER
  // ====================================================

  const filteredRecords = useMemo(() => {
    const keyword = normalize(search);

    return contractRecords.filter((record) => {
      const matchesSearch =
        !keyword ||
        [
          record.kabupaten,
          record.nama_perusahaan,
          record.no_berkas,
          record.skala,
        ].some((value) => normalize(value).includes(keyword));

      const realisasi = getRealisasi(record);

      const matchesStatus =
        filterStatus === "semua" ||
        (filterStatus === "selesai" && record.seluruh_tahapan_selesai) ||
        (filterStatus === "berjalan" && !record.seluruh_tahapan_selesai) ||
        (filterStatus === "belum" && realisasi === 0);

      return matchesSearch && matchesStatus;
    });
  }, [contractRecords, search, filterStatus]);

  // ====================================================
  // SUMMARY
  // ====================================================

  const summary = useMemo(() => {
    const totalRealisasi = contractRecords.reduce(
      (sum, item) => sum + getRealisasi(item),
      0,
    );

    return {
      total: contractRecords.length,
      selesai: contractRecords.filter((item) => item.seluruh_tahapan_selesai)
        .length,
      berjalan: contractRecords.filter((item) => !item.seluruh_tahapan_selesai)
        .length,
      rataRata:
        contractRecords.length > 0
          ? totalRealisasi / contractRecords.length
          : 0,
    };
  }, [contractRecords]);

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <Card className="overflow-hidden border-blue-200 shadow-sm dark:border-blue-900">
      {/* DETAIL HEADER */}
      <div className="flex flex-col justify-between gap-3 border-b bg-blue-50/70 p-4 dark:bg-blue-950/20 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
            <FileCheck2 className="size-4" />
          </div>

          <div>
            <h3 className="font-bold text-blue-900 dark:text-blue-200">
              Detail Monitoring Realisasi Fisik
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              {nama_perusahaan} · Monitoring QC setiap tahapan kegiatan
            </p>
          </div>
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

      <CardContent className="space-y-5 p-3 sm:p-5">
        {/* SUMMARY */}
        {!isLoading && !isError && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <DetailSummary
              label="Total Berkas"
              value={summary.total.toLocaleString("id-ID")}
              icon={<FileCheck2 className="size-5" />}
            />

            <DetailSummary
              label="Tahapan Selesai"
              value={summary.selesai.toLocaleString("id-ID")}
              icon={<CheckCircle2 className="size-5 text-green-600" />}
            />

            <DetailSummary
              label="Dalam Proses"
              value={summary.berjalan.toLocaleString("id-ID")}
              icon={<Clock3 className="size-5 text-blue-600" />}
            />

            <DetailSummary
              label="Rata-rata Realisasi"
              value={formatPercent(summary.rataRata)}
              icon={<Building2 className="size-5" />}
            />
          </div>
        )}

        {/* FILTER */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kabupaten atau nomor berkas..."
              className="pl-9"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="semua">Semua Status</option>
            <option value="selesai">Selesai</option>
            <option value="berjalan">Dalam Proses</option>
            <option value="belum">Belum Ada Realisasi</option>
          </select>
        </div>

        {/* LOADING */}
        {isLoading ? (
          <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="size-4 animate-spin" />
            Memuat detail progress QC...
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error instanceof Error
              ? error.message
              : "Gagal mengambil data monitoring."}
          </div>
        ) : (
          <>
            {/* DETAIL TABLE */}
            <div className="w-full overflow-x-auto rounded-lg border">
              <Table className="w-max min-w-full">
                <TableHeader>
                  <TableRow className="bg-muted/70">
                    <TableHead className="sticky left-0 z-20 min-w-[220px] bg-muted">
                      Kabupaten / Wilayah
                    </TableHead>

                    <TableHead className="min-w-[135px] text-center">
                      Nomor Berkas
                    </TableHead>

                    {stages.map((stage) => (
                      <TableHead
                        key={stage.tahapan_kegiatan_id}
                        className="min-w-[155px] border-l text-center"
                      >
                        <div className="whitespace-normal text-xs font-semibold">
                          {stage.urutan}. {stage.nama_tahapan}
                        </div>

                        <div className="mt-1 text-[10px] font-normal text-muted-foreground">
                          Bobot {stage.bobot}%
                        </div>
                      </TableHead>
                    ))}

                    <TableHead className="sticky right-0 z-20 min-w-[130px] border-l bg-muted text-center">
                      Realisasi Fisik
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={stages.length + 3}
                        className="h-28 text-center text-muted-foreground"
                      >
                        {contractRecords.length === 0
                          ? "Belum ada data QC untuk berkas dalam kontrak ini."
                          : "Tidak ada data yang sesuai filter."}
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

                      const realisasi = getRealisasi(record);

                      return (
                        <TableRow
                          key={record.berkas_id}
                          className="hover:bg-muted/30"
                        >
                          {/* WILAYAH */}
                          <TableCell className="sticky left-0 z-10 min-w-[220px] border-r bg-background align-middle">
                            <div className="space-y-2">
                              <p className="flex items-center gap-1.5 text-sm font-semibold">
                                <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                                {record.kabupaten || "-"}
                              </p>

                              <Badge variant="outline" className="text-[10px]">
                                {record.skala || "-"}
                              </Badge>
                            </div>
                          </TableCell>

                          {/* BERKAS */}
                          <TableCell className="text-center align-middle">
                            <span className="whitespace-nowrap text-xs font-semibold">
                              {record.no_berkas}
                            </span>
                          </TableCell>

                          {/* STAGES */}
                          {stages.map((definition) => (
                            <StageCell
                              key={definition.tahapan_kegiatan_id}
                              stage={stageMap.get(
                                definition.tahapan_kegiatan_id,
                              )}
                            />
                          ))}

                          {/* REALISASI */}
                          <TableCell className="sticky right-0 z-10 border-l bg-background text-center align-middle">
                            <div className="space-y-2">
                              <p className="text-lg font-bold tabular-nums">
                                {formatPercent(realisasi)}
                              </p>

                              <div className="h-2 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-primary transition-all"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Math.max(0, realisasi),
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

              <span className="ml-auto">
                Menampilkan {filteredRecords.length} dari {summary.total} berkas
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
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

  const total = numberValue(stage.total_checklist);
  const sesuai = numberValue(stage.sesuai);
  const tidakSesuai = numberValue(stage.tidak_sesuai);
  const belum = numberValue(stage.belum_diperiksa);

  const percentage = total > 0 ? (sesuai / total) * 100 : 0;

  return (
    <TableCell className="min-w-[155px] border-l align-middle">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Badge
            variant="outline"
            className={`font-bold ${getStageColor(stage)}`}
          >
            {sesuai}/{total}
          </Badge>

          <span className="text-xs font-semibold tabular-nums">
            {formatPercent(stage.realisasi)}
          </span>
        </div>

        {/* PROGRESS BAR */}
        <div className="flex h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="bg-green-500 transition-all"
            style={{
              width: `${total ? (sesuai / total) * 100 : 0}%`,
            }}
          />

          <div
            className="bg-red-500"
            style={{
              width: `${total ? (tidakSesuai / total) * 100 : 0}%`,
            }}
          />

          <div
            className="bg-slate-300"
            style={{
              width: `${total ? (belum / total) * 100 : 0}%`,
            }}
          />
        </div>

        {/* STATUS */}
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px]">
          <span className="flex items-center gap-1 text-green-700">
            <CheckCircle2 className="size-3" />
            {sesuai}
          </span>

          <span className="flex items-center gap-1 text-red-600">
            <XCircle className="size-3" />
            {tidakSesuai}
          </span>

          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock3 className="size-3" />
            {belum}
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
// DETAIL SUMMARY CARD
// ======================================================

function DetailSummary({
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
