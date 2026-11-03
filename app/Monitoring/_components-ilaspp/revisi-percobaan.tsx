"use client";

import { Fragment, useRef, useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Activity,
  Building2,
  Banknote,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  FileText,
  MapPin,
  RefreshCw,
  Search,
  Target,
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

import { basePath } from "@/constants/menu-sidebar";
import Link from "next/link";
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

// Tahapan khusus yang menampilkan informasi jumlah titik.
const STAGE_POINT_IDS = [3, 10, 17, 25];

const PAGE_SIZE_OPTIONS = [10, 25, 50];

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
  return Array.from(
    new Set(detail.map((item) => item.kabupaten).filter(Boolean)),
  );
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
  const progress = Math.max(0, Math.min(value, 100));

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
// MAIN PAGE
// ======================================================

export default function MonitoringRealisasiKontrakPage({}) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [expandedContract, setExpandedContract] = useState<string | null>(null);

  const tableRef = useRef<HTMLDivElement>(null);

  // ======================================================
  // FETCH API
  // ======================================================

  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ApiResponse>({
    queryKey: ["monitoring-realisasi-kontrak"],
    queryFn: async () => {
      // Sesuaikan endpoint ini dengan route API milikmu.
      const result = await fetch(`${basePath}/api/monitoring-qc-ilaspprev`);

      if (!result.ok) {
        throw new Error("Gagal mengambil data realisasi kontrak.");
      }

      const json: ApiResponse = await result.json();

      if (!json.success) {
        throw new Error(json.message || "API mengembalikan status gagal.");
      }

      return json;
    },
  });

  const data = response?.data ?? [];

  useEffect(() => {
    if (!isLoading && tableRef.current) {
      tableRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [isLoading]);
  // ======================================================
  // FILTER
  // ======================================================

  const filteredData = useMemo(() => {
    const keyword = normalize(search);

    return data
      .filter((item) => {
        return (
          !keyword ||
          normalize(item.nama_perusahaan).includes(keyword) ||
          normalize(item.no_kontrak).includes(keyword) ||
          item.detail.some(
            (record) =>
              normalize(record.kabupaten).includes(keyword) ||
              normalize(record.no_berkas).includes(keyword),
          )
        );
      })
      .sort((a, b) => a.nama_perusahaan.localeCompare(b.nama_perusahaan, "id"));
  }, [data, search]);

  // ======================================================
  // SUMMARY
  // ======================================================

  const summary = useMemo(() => {
    const totalKontrak = filteredData.length;

    const totalPerusahaan = new Set(
      filteredData.map((item) => item.nama_perusahaan),
    ).size;

    const totalBerkas = filteredData.reduce(
      (sum, item) => sum + toNumber(item.total_berkas),
      0,
    );

    const totalAnggaran = filteredData.reduce(
      (sum, item) => sum + toNumber(item.anggaran),
      0,
    );

    const totalKabupaten = new Set(
      filteredData.flatMap((item) =>
        item.detail.map((record) => record.kabupaten),
      ),
    ).size;

    const rataRealisasi =
      totalKontrak > 0
        ? filteredData.reduce(
            (sum, item) => sum + toNumber(item.realisasi_fisik),
            0,
          ) / totalKontrak
        : 0;

    const selesai = filteredData.filter(
      (item) => item.seluruh_berkas_selesai,
    ).length;

    return {
      totalKontrak,
      totalPerusahaan,
      totalBerkas,
      totalAnggaran,
      totalKabupaten,
      rataRealisasi,
      selesai,
    };
  }, [filteredData]);

  // ======================================================
  // PAGINATION
  // ======================================================

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Kelompokkan perusahaan agar bisa menggunakan rowSpan.
  const companyGroups = useMemo(() => {
    const groups = new Map<string, ContractItem[]>();

    paginatedData.forEach((item) => {
      const key = item.nama_perusahaan || "-";
      const existing = groups.get(key) ?? [];
      existing.push(item);
      groups.set(key, existing);
    });

    return groups;
  }, [paginatedData]);

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <main className="min-h-screen space-y-6 bg-muted/20 p-4 md:p-6 lg:p-8">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Activity className="size-6" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Monitoring Realisasi Kontrak
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Monitoring realisasi fisik, anggaran, jumlah berkas, dan capaian
              tahapan kegiatan per kabupaten.
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

      {/* SUMMARY */}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {[
          {
            title: "Perusahaan",
            value: formatNumber(summary.totalPerusahaan),
            icon: <Building2 className="size-5" />,
            color: "text-blue-600 bg-blue-50",
          },
          {
            title: "Total Kontrak",
            value: formatNumber(summary.totalKontrak),
            icon: <FileText className="size-5" />,
            color: "text-violet-600 bg-violet-50",
          },
          {
            title: "Total Berkas",
            value: formatNumber(summary.totalBerkas),
            icon: <Target className="size-5" />,
            color: "text-cyan-600 bg-cyan-50",
          },
          {
            title: "Kabupaten",
            value: formatNumber(summary.totalKabupaten),
            icon: <MapPin className="size-5" />,
            color: "text-amber-600 bg-amber-50",
          },
          {
            title: "Rata-rata Realisasi",
            value: formatPercent(summary.rataRealisasi),
            icon: <Activity className="size-5" />,
            color: "text-emerald-600 bg-emerald-50",
          },
          {
            title: "Kontrak Selesai",
            value: `${summary.selesai}/${summary.totalKontrak}`,
            icon: <CheckCircle2 className="size-5" />,
            color: "text-green-600 bg-green-50",
          },
        ].map((item) => (
          <Card key={item.title} className="border-border/60 shadow-sm">
            <CardContent className="p-4">
              <div
                className={`mb-3 flex size-9 items-center justify-center rounded-lg ${item.color}`}
              >
                {item.icon}
              </div>

              <p className="text-xs text-muted-foreground">{item.title}</p>

              <p className="mt-1 wrap-break-word text-xl font-bold tabular-nums">
                {isLoading ? "..." : item.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* ANGGARAN */}

      <Card className="border-border/60 shadow-sm">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Banknote className="size-5" />
          </div>

          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">
              Total Anggaran Kontrak
            </p>

            <p className="mt-1 wrap-break-word text-xl font-bold tracking-tight md:text-2xl">
              {isLoading ? "Memuat..." : formatRupiah(summary.totalAnggaran)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* FILTER */}

      <Card className="border-border/60 shadow-sm">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2">
            <Search className="size-5 text-blue-600" />

            <div>
              <h2 className="font-bold">Pencarian Data</h2>
              <p className="text-xs text-muted-foreground">
                Cari perusahaan, nomor kontrak, kabupaten, atau nomor berkas.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                  setExpandedContract(null);
                }}
                placeholder="Cari nama perusahaan, nomor kontrak, kabupaten..."
                className="h-11 pl-9"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCurrentPage(1);
                setExpandedContract(null);
              }}
              className="h-11 rounded-lg border bg-background px-4 text-sm font-semibold hover:bg-muted"
            >
              Reset
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Menampilkan{" "}
              <span className="font-bold text-foreground">
                {filteredData.length}
              </span>{" "}
              kontrak.
            </p>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Baris per halaman
              </span>

              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setCurrentPage(1);
                  setExpandedContract(null);
                }}
                className="h-9 rounded-md border bg-background px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MAIN TABLE */}

      <Card ref={tableRef} className="border-border/60 shadow-sm">
        <CardContent className="space-y-4 p-4 md:p-5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                Realisasi Fisik per Perusahaan
              </h2>

              <p className="text-sm text-muted-foreground">
                Klik nomor kontrak untuk membuka rincian capaian seluruh
                kabupaten dan tahapan kegiatan.
              </p>
            </div>

            <Badge variant="outline">
              {formatNumber(filteredData.length)} Kontrak
            </Badge>
          </div>

          {isLoading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3">
              <div className="size-9 animate-spin rounded-full border-4 border-muted border-t-blue-600" />
              <p className="text-sm text-muted-foreground">
                Memuat data monitoring kontrak...
              </p>
            </div>
          ) : (
            <>
              <div className="w-full overflow-x-auto rounded-lg border">
                <Table className="min-w-250">
                  <TableHeader>
                    <TableRow className="bg-muted/70">
                      <TableHead className="w-13.75 text-center">No.</TableHead>

                      <TableHead className="min-w-60">
                        Nama Perusahaan
                      </TableHead>

                      <TableHead className="min-w-42.5 text-center">
                        Realisasi Fisik
                      </TableHead>

                      <TableHead className="min-w-65">Nomor Kontrak</TableHead>

                      <TableHead className="min-w-43.75 text-right">
                        Anggaran
                      </TableHead>

                      <TableHead className="min-w-27.5 text-center">
                        Total Berkas
                      </TableHead>

                      <TableHead className="min-w-27.5 text-center">
                        Kabupaten
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {paginatedData.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="h-32 text-center text-muted-foreground"
                        >
                          Tidak ada data kontrak yang ditemukan.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (() => {
                        let companyIndex = 0;

                        return paginatedData.map((item, index) => {
                          const key = `${item.nama_perusahaan}-${item.no_kontrak}`;

                          const isExpanded = expandedContract === key;

                          const company = item.nama_perusahaan || "-";
                          const isFirstCompanyRow =
                            index === 0 ||
                            paginatedData[index - 1].nama_perusahaan !==
                              company;

                          const companyRowSpan = isFirstCompanyRow
                            ? (companyGroups.get(company)?.length ?? 1)
                            : 0;

                          if (isFirstCompanyRow) companyIndex++;

                          const progress = toNumber(item.realisasi_fisik);
                          const kabupaten = getUniqueKabupaten(item.detail);

                          return (
                            <Fragment key={key}>
                              <TableRow
                                className={`transition-colors ${
                                  isExpanded
                                    ? "bg-blue-50/70 dark:bg-blue-950/20"
                                    : "hover:bg-muted/30"
                                }`}
                              >
                                {/* NOMOR */}

                                <TableCell className="text-center font-medium tabular-nums">
                                  {(currentPage - 1) * pageSize + index + 1}
                                </TableCell>

                                {/* PERUSAHAAN MERGE */}

                                {isFirstCompanyRow && (
                                  <TableCell
                                    rowSpan={companyRowSpan}
                                    className="border-r bg-muted/10 align-middle"
                                  >
                                    <Link
                                      href={`/Monitoring/monitoring-ilaspp/${encodeURIComponent(item.no_kontrak)}`}
                                      className="group flex w-full items-start gap-2 text-left"
                                    >
                                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                                        <Building2 className="size-4" />
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <p className="font-bold leading-relaxed text-blue-700 group-hover:text-blue-800 hover:underline transition-colors">
                                          {company}
                                        </p>

                                        <p className="mt-1 text-[10px] text-muted-foreground">
                                          Klik untuk detail
                                        </p>
                                      </div>

                                      <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-blue-600" />
                                    </Link>
                                  </TableCell>
                                )}

                                {/* REALISASI FISIK */}

                                <TableCell className="align-middle">
                                  <div className="mx-auto max-w-37.5 space-y-1.5">
                                    <ProgressBar value={progress} />

                                    {progress >= 100 && (
                                      <Badge
                                        variant="outline"
                                        className="border-green-200 bg-green-50 text-[10px] text-green-700"
                                      >
                                        <CheckCircle2 className="mr-1 size-3" />
                                        100% Selesai
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>

                                {/* NOMOR KONTRAK */}

                                <TableCell className="align-middle">
                                  <p className="wrap-break-word text-xs font-semibold text-blue-700">
                                    {item.no_kontrak || "-"}
                                  </p>
                                </TableCell>

                                {/* ANGGARAN */}

                                <TableCell className="text-right align-middle">
                                  <p className="whitespace-nowrap text-xs font-bold tabular-nums">
                                    {formatRupiah(toNumber(item.anggaran))}
                                  </p>
                                </TableCell>

                                {/* TOTAL BERKAS */}

                                <TableCell className="text-center align-middle">
                                  <Badge variant="secondary">
                                    {formatNumber(item.total_berkas)}
                                  </Badge>
                                </TableCell>

                                {/* KABUPATEN */}

                                <TableCell className="text-center align-middle">
                                  <Badge variant="outline">
                                    {kabupaten.length} Wilayah
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            </Fragment>
                          );
                        });
                      })()
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* PAGINATION */}

              <div className="flex flex-col justify-between gap-3 border-t pt-4 sm:flex-row sm:items-center">
                <p className="text-sm text-muted-foreground">
                  Menampilkan{" "}
                  <span className="font-semibold text-foreground">
                    {filteredData.length === 0
                      ? 0
                      : (currentPage - 1) * pageSize + 1}
                    {" - "}
                    {Math.min(currentPage * pageSize, filteredData.length)}
                  </span>{" "}
                  dari{" "}
                  <span className="font-semibold text-foreground">
                    {formatNumber(filteredData.length)}
                  </span>{" "}
                  kontrak
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => {
                      setCurrentPage((page) => page - 1);
                      setExpandedContract(null);
                    }}
                    className="inline-flex items-center gap-1 rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="size-4" />
                    Sebelumnya
                  </button>

                  <span className="min-w-16.25 text-center text-sm font-semibold tabular-nums">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => {
                      setCurrentPage((page) => page + 1);
                      setExpandedContract(null);
                    }}
                    className="inline-flex items-center gap-1 rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Berikutnya
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* FOOTER */}

      <div className="flex flex-col justify-between gap-2 border-t pt-4 text-xs text-muted-foreground sm:flex-row">
        <p>Monitoring Realisasi Kontrak ILASPP</p>
        <p>{response?.total ?? data.length} data tersedia dari API</p>
      </div>
    </main>
  );
}
