"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Activity,
  Banknote,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleX,
  Clock,
  ChevronDown,
  ChevronUp,
  Filter,
  MapPin,
  RefreshCw,
  Search,
  Sprout,
  Target,
  Users,
  Layers3,
  ChevronRight,
  ChevronLeft,
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
import { SummaryCard } from "./summary-card";
import { FilterSelect } from "./filter-select";

// ======================================================
// TYPES
// ======================================================

type ContractGroup = {
  key: string;
  nomor_kontrak: string;
  nama_perusahaan: string;
  penanggung_jawab: string;
  tgl_mulai: string | null;
  tgl_selesai: string | null;
  anggaran: number;

  kabupaten: string[];

  target_titik: number;
  total_approved: number;
  total_rejected: number;
  total_not_approved: number;
  total_titik: number;

  total_pertanian: number;
  total_non_pertanian: number;
  jumlah_zona: number;
  total_surveyor: number;

  details: ProgressItem[];
};

type ProgressItem = {
  no_berkas: string | null;
  kode_kegiatan: string | null;

  tgl_mulai: string | null;
  tgl_selesai: string | null;

  nama_kegiatan: string | null;
  Kabupaten: string | null;

  berkas_id: string | null;
  kontrak_id: number | null;
  nomor_kontrak: string | null;

  tahapan_kegiatan_id: number | null;
  nama_tahapan: string | null;
  nama_wilayah: string | null;

  nama_perusahaan: string | null;
  penanggung_jawab: string | null;

  anggaran: string | number | null;
  target_titik: number | null;
  target_luasan: number | null;
  jumlah_zona: number | null;

  total_pertanian: string | number | null;
  total_non_pertanian: string | number | null;
  total_titik: string | number | null;
  total_approved: string | number | null;
  total_rejected: string | number | null;
  total_not_approved: string | number | null;

  total_surveyor: string | number | null;
};

type ApiResponse = {
  success: boolean;
  total: number;
  data: ProgressItem[];
  message?: string;
};

const PAGE_SIZE = 10;

// ======================================================
// HELPERS
// ======================================================

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const result = Number(value);

  return Number.isFinite(result) ? result : 0;
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

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function getProgress(item: ProgressItem) {
  const target = toNumber(item.target_titik);
  const approved = toNumber(item.total_approved);

  if (target <= 0) return 0;

  return (approved / target) * 100;
}

// ======================================================
// PROGRESS BAR
// ======================================================

function ProgressBar({ value }: { value: number }) {
  const progressColor =
    value >= 100
      ? "bg-emerald-500"
      : value >= 75
        ? "bg-blue-500"
        : value >= 40
          ? "bg-amber-500"
          : "bg-red-500";

  return (
    <div className="min-w-[140px] space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold tabular-nums">
          {formatPercent(value)}
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
          style={{
            width: `${Math.min(value, 100)}%`,
          }}
        />
      </div>
    </div>
  );
}

// ======================================================
// MAIN PAGE
// ======================================================

export default function ProgressILASPPPageRevisi() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(25);
  const tableRef = useRef<HTMLDivElement>(null);

  const [filter, setFilter] = useState({
    wilayah: "Semua",
    perusahaan: "Semua",
    tahapan: "Semua",
  });

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
    queryKey: ["progress-ilaspp"],
    queryFn: async () => {
      const result = await fetch(`${basePath}/api/progress-ilaspp`);

      if (!result.ok) {
        throw new Error("Gagal mengambil data progress ILASPP");
      }

      const json: ApiResponse = await result.json();

      if (!json.success) {
        throw new Error(json.message || "API mengembalikan status gagal");
      }

      return json;
    },
  });

  const data = response?.data ?? [];

  // Menuju ke Table
  useEffect(() => {
    if (!isLoading && tableRef.current) {
      tableRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [isLoading]);

  // ======================================================
  // FILTER OPTIONS
  // ======================================================

  const wilayahOptions = useMemo(
    () =>
      Array.from(
        new Set(
          data
            .map((item) => item.Kabupaten)
            .filter((value): value is string => !!value),
        ),
      ).sort((a, b) => a.localeCompare(b, "id")),
    [data],
  );

  const perusahaanOptions = useMemo(
    () =>
      Array.from(
        new Set(
          data
            .map((item) => item.nama_perusahaan)
            .filter((value): value is string => !!value),
        ),
      ).sort((a, b) => a.localeCompare(b, "id")),
    [data],
  );

  const tahapanOptions = useMemo(
    () =>
      Array.from(
        new Set(
          data
            .map((item) => item.nama_tahapan)
            .filter((value): value is string => !!value),
        ),
      ).sort((a, b) => a.localeCompare(b, "id")),
    [data],
  );

  // ======================================================
  // FILTER DATA
  // ======================================================

  const filteredData = useMemo(() => {
    const keyword = normalize(search);

    return data.filter((item) => {
      const matchesSearch =
        !keyword ||
        [
          item.no_berkas,
          item.Kabupaten,
          item.nama_kegiatan,
          item.nama_tahapan,
          item.nomor_kontrak,
          item.nama_perusahaan,
          item.penanggung_jawab,
        ].some((value) => normalize(value).includes(keyword));

      const matchesWilayah =
        filter.wilayah === "Semua" || item.Kabupaten === filter.wilayah;

      const matchesPerusahaan =
        filter.perusahaan === "Semua" ||
        item.nama_perusahaan === filter.perusahaan;

      const matchesTahapan =
        filter.tahapan === "Semua" || item.nama_tahapan === filter.tahapan;

      return (
        matchesSearch && matchesWilayah && matchesPerusahaan && matchesTahapan
      );
    });
  }, [data, search, filter]);

  // ======================================================
  // GROUPING DATA PER NOMOR KONTRAK
  // ======================================================

  const contractGroups = useMemo(() => {
    const groups = new Map<string, ContractGroup>();

    filteredData.forEach((item, index) => {
      const contractNumber = item.nomor_kontrak?.trim();

      const key =
        contractNumber ||
        `TANPA-KONTRAK-${item.berkas_id ?? item.no_berkas ?? index}`;

      let group = groups.get(key);

      if (!group) {
        group = {
          key,
          nomor_kontrak: contractNumber || "-",
          nama_perusahaan: item.nama_perusahaan ?? "-",
          penanggung_jawab: item.penanggung_jawab ?? "-",
          tgl_mulai: item.tgl_mulai,
          tgl_selesai: item.tgl_selesai,

          // Anggaran kontrak tidak dijumlahkan per kabupaten
          // karena nilainya merupakan anggaran satu kontrak.
          anggaran: toNumber(item.anggaran),

          kabupaten: [],

          target_titik: 0,
          total_approved: 0,
          total_rejected: 0,
          total_not_approved: 0,
          total_titik: 0,

          total_pertanian: 0,
          total_non_pertanian: 0,
          jumlah_zona: 0,
          total_surveyor: 0,

          details: [],
        };

        groups.set(key, group);
      }

      // Simpan rincian kabupaten
      group.details.push(item);

      // Kabupaten unik
      const namaKabupaten = item.Kabupaten?.trim();

      if (namaKabupaten && !group.kabupaten.includes(namaKabupaten)) {
        group.kabupaten.push(namaKabupaten);
      }

      // Akumulasi target dan realisasi
      group.target_titik += toNumber(item.target_titik);
      group.total_approved += toNumber(item.total_approved);
      group.total_rejected += toNumber(item.total_rejected);
      group.total_not_approved += toNumber(item.total_not_approved);
      group.total_titik += toNumber(item.total_titik);

      group.total_pertanian += toNumber(item.total_pertanian);
      group.total_non_pertanian += toNumber(item.total_non_pertanian);

      group.jumlah_zona += toNumber(item.jumlah_zona);
      group.total_surveyor += toNumber(item.total_surveyor);
    });

    return Array.from(groups.values()).sort((a, b) =>
      a.nomor_kontrak.localeCompare(b.nomor_kontrak, "id"),
    );
  }, [filteredData]);

  // ======================================================
  // SUMMARY CALCULATION
  // ======================================================

  const summary = useMemo(() => {
    const result = filteredData.reduce(
      (acc, item) => {
        acc.target += toNumber(item.target_titik);
        acc.approved += toNumber(item.total_approved);

        acc.pertanian += toNumber(item.total_pertanian);
        acc.nonPertanian += toNumber(item.total_non_pertanian);

        acc.totalTitik += toNumber(item.total_titik);
        acc.rejected += toNumber(item.total_rejected);
        acc.notApproved += toNumber(item.total_not_approved);

        acc.zona += toNumber(item.jumlah_zona);
        acc.surveyor += toNumber(item.total_surveyor);

        acc.luasan += toNumber(item.target_luasan);
        acc.anggaran += toNumber(item.anggaran);

        return acc;
      },
      {
        target: 0,
        approved: 0,
        pertanian: 0,
        nonPertanian: 0,
        totalTitik: 0,
        rejected: 0,
        notApproved: 0,
        zona: 0,
        surveyor: 0,
        luasan: 0,
        anggaran: 0,
      },
    );

    return {
      ...result,
      progress: result.target > 0 ? (result.approved / result.target) * 100 : 0,
    };
  }, [filteredData]);

  // ======================================================
  // CHART DATA
  // ======================================================

  const wilayahChart = useMemo(() => {
    return filteredData
      .map((item) => ({
        wilayah: item.Kabupaten?.replace("Kabupaten ", "") ?? "-",
        target: toNumber(item.target_titik),
        approved: toNumber(item.total_approved),
      }))
      .sort((a, b) => b.target - a.target);
  }, [filteredData]);

  const komposisiChart = useMemo(
    () => [
      {
        name: "Pertanian",
        value: summary.pertanian,
        color: "#16a34a",
      },
      {
        name: "Non Pertanian",
        value: summary.nonPertanian,
        color: "#2563eb",
      },
    ],
    [summary],
  );

  const statusChart = useMemo(
    () => [
      {
        name: "Disetujui",
        value: summary.approved,
        color: "#16a34a",
      },
      {
        name: "Ditolak",
        value: summary.rejected,
        color: "#ef4444",
      },
      {
        name: "Belum Disetujui",
        value: summary.notApproved,
        color: "#f59e0b",
      },
    ],
    [summary],
  );

  // ======================================================
  // PAGINATION
  // ======================================================

  const totalPages = Math.max(1, Math.ceil(contractGroups.length / pageSize));

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;

    return contractGroups.slice(start, start + pageSize);
  }, [contractGroups, currentPage]);

  // ======================================================
  // RESET FILTER
  // ======================================================

  const resetFilter = () => {
    setSearch("");
    setFilter({
      wilayah: "Semua",
      perusahaan: "Semua",
      tahapan: "Semua",
    });
    setCurrentPage(1);
  };

  // ======================================================
  // RENDER
  // ======================================================

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
              Monitoring Progress ILASPP
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Monitoring realisasi pengumpulan titik sampel nilai tanah, target,
              persetujuan, dan sebaran kegiatan.
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

      {/* SUMMARY CARDS */}

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight">
            Ringkasan Progress
          </h2>
          <p className="text-sm text-muted-foreground">
            Akumulasi realisasi titik berdasarkan data yang difilter.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Progress Keseluruhan"
            value={isLoading ? "Memuat..." : formatPercent(summary.progress)}
            description={`${formatNumber(summary.approved)} dari ${formatNumber(summary.target)} target titik`}
            icon={<Target className="size-5" />}
            color="bg-blue-100 text-blue-700"
          />

          <SummaryCard
            title="Titik Disetujui"
            value={isLoading ? "..." : formatNumber(summary.approved)}
            description="Total titik yang telah disetujui"
            icon={<CheckCircle2 className="size-5" />}
            color="bg-emerald-100 text-emerald-700"
          />

          <SummaryCard
            title="Titik Pertanian"
            value={isLoading ? "..." : formatNumber(summary.pertanian)}
            description="Total sampel penggunaan lahan pertanian"
            icon={<Sprout className="size-5" />}
            color="bg-lime-100 text-lime-700"
          />

          <SummaryCard
            title="Titik Non Pertanian"
            value={isLoading ? "..." : formatNumber(summary.nonPertanian)}
            description="Total sampel penggunaan lahan non pertanian"
            icon={<Building2 className="size-5" />}
            color="bg-violet-100 text-violet-700"
          />
        </div>

        {/* ADDITIONAL SUMMARY */}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {[
            {
              title: "Target Titik",
              value: summary.target,
              icon: <MapPin className="size-4" />,
              color: "text-blue-600",
            },
            {
              title: "Total Titik",
              value: summary.totalTitik,
              icon: <Activity className="size-4" />,
              color: "text-cyan-600",
            },
            {
              title: "Titik Ditolak",
              value: summary.rejected,
              icon: <CircleX className="size-4" />,
              color: "text-red-600",
            },
            {
              title: "Belum Disetujui",
              value: summary.notApproved,
              icon: <Clock className="size-4" />,
              color: "text-amber-600",
            },
            {
              title: "Jumlah Zona",
              value: summary.zona,
              icon: <Layers3 className="size-4" />,
              color: "text-purple-600",
            },
            {
              title: "Total Surveyor",
              value: summary.surveyor,
              icon: <Users className="size-4" />,
              color: "text-indigo-600",
            },
          ].map((item) => (
            <Card key={item.title} className="border-border/60 shadow-sm">
              <CardContent className="p-4">
                <div className={`mb-2 ${item.color}`}>{item.icon}</div>

                <p className="text-xs text-muted-foreground">{item.title}</p>

                <p className="mt-1 text-xl font-bold tracking-tight">
                  {isLoading ? "..." : formatNumber(item.value)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* LOADING */}

      {isLoading ? (
        <Card>
          <CardContent className="flex min-h-64 flex-col items-center justify-center gap-3">
            <div className="size-9 animate-spin rounded-full border-4 border-muted border-t-blue-600" />

            <p className="text-sm text-muted-foreground">
              Memuat data progress ILASPP...
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* ADDITIONAL INFORMATION

          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-5">
              <div className="mb-4">
                <h3 className="font-bold">Informasi Tambahan Kegiatan</h3>

                <p className="text-sm text-muted-foreground">
                  Ringkasan luasan dan anggaran berdasarkan filter.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border bg-muted/20 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="size-4" />
                    <span className="text-sm">Total Target Luasan</span>
                  </div>

                  <p className="mt-2 text-2xl font-bold">
                    {formatNumber(summary.luasan)}
                  </p>
                </div>

                <div className="rounded-xl border bg-muted/20 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Banknote className="size-4" />
                    <span className="text-sm">Total Anggaran</span>
                  </div>

                  <p className="mt-2 break-words text-2xl font-bold">
                    {formatRupiah(summary.anggaran)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card> */}

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
                    Filter berlaku untuk kartu, grafik, dan tabel.
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
                      onChange={(event) => {
                        setSearch(event.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="No. berkas, kabupaten, kontrak..."
                      className="h-11 pl-9"
                    />
                  </div>
                </div>

                <FilterSelect
                  label="Kabupaten"
                  value={filter.wilayah}
                  placeholder="Pilih kabupaten"
                  options={wilayahOptions}
                  onChange={(value) => {
                    setFilter((previous) => ({
                      ...previous,
                      wilayah: value,
                    }));
                    setCurrentPage(1);
                  }}
                />

                <FilterSelect
                  label="Perusahaan"
                  value={filter.perusahaan}
                  placeholder="Pilih perusahaan"
                  options={perusahaanOptions}
                  onChange={(value) => {
                    setFilter((previous) => ({
                      ...previous,
                      perusahaan: value,
                    }));
                    setCurrentPage(1);
                  }}
                />

                <FilterSelect
                  label="Tahapan Kegiatan"
                  value={filter.tahapan}
                  placeholder="Pilih tahapan"
                  options={tahapanOptions}
                  onChange={(value) => {
                    setFilter((previous) => ({
                      ...previous,
                      tahapan: value,
                    }));
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <CalendarDays className="size-4 text-blue-600" />

                  <span className="text-muted-foreground">Data ditemukan:</span>

                  <span className="font-bold">
                    {formatNumber(filteredData.length)} berkas
                  </span>

                  <span className="text-muted-foreground">dari</span>

                  <span className="font-semibold">
                    {formatNumber(data.length)} berkas
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

          {/* DETAIL TABLE */}

          {/* ======================================================
    DETAIL TABLE - AGREGAT PER NOMOR KONTRAK
====================================================== */}

          <Card ref={tableRef} className="border-border/60 shadow-sm">
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">
                    Monitoring Progress per Nomor Kontrak
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    Agregasi target dan realisasi titik berdasarkan perusahaan
                    dan nomor kontrak. Klik nama perusahaan untuk melihat
                    rincian setiap kabupaten.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="page-size"
                      className="whitespace-nowrap text-sm text-muted-foreground"
                    >
                      Tampilkan
                    </label>

                    <select
                      id="page-size"
                      value={pageSize}
                      onChange={(event) => {
                        setPageSize(Number(event.target.value));
                        setCurrentPage(1);
                        setSelectedContract(null);
                      }}
                      className="h-9 rounded-md border bg-background px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>

                    <span className="text-sm text-muted-foreground">baris</span>
                  </div>

                  <Badge variant="outline" className="w-fit">
                    {formatNumber(contractGroups.length)} Kontrak
                  </Badge>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[55px]">No</TableHead>
                      <TableHead className="min-w-[220px]">
                        Perusahaan
                      </TableHead>
                      <TableHead className="min-w-[230px]">
                        Nomor Kontrak
                      </TableHead>
                      <TableHead className="min-w-[110px] text-center">
                        Kabupaten
                      </TableHead>
                      <TableHead className="min-w-[110px] text-right">
                        Target Titik
                      </TableHead>
                      <TableHead className="min-w-[110px] text-right">
                        Disetujui
                      </TableHead>
                      <TableHead className="min-w-[170px]">Progress</TableHead>
                      <TableHead className="min-w-[170px] text-right">
                        Anggaran
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {paginatedData.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="h-28 text-center text-muted-foreground"
                        >
                          Tidak ada data kontrak yang ditemukan.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedData.map((group, index) => {
                        const progress =
                          group.target_titik > 0
                            ? (group.total_approved / group.target_titik) * 100
                            : 0;

                        const isExpanded = selectedContract === group.key;

                        return (
                          <Fragment key={group.key}>
                            {/* BARIS AGREGAT KONTRAK */}
                            <TableRow
                              className={`transition-colors ${
                                isExpanded
                                  ? "bg-blue-50/60 dark:bg-blue-950/20"
                                  : "hover:bg-muted/30"
                              }`}
                            >
                              <TableCell className="font-medium">
                                {(currentPage - 1) * pageSize + index + 1}
                              </TableCell>

                              {/* PERUSAHAAN - CLICK TO EXPAND */}
                              <TableCell>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedContract(
                                      isExpanded ? null : group.key,
                                    )
                                  }
                                  className="group flex items-center gap-2 text-left"
                                >
                                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                                    <Building2 className="size-4" />
                                  </div>

                                  <div className="min-w-0">
                                    <p className="font-semibold text-blue-700 group-hover:underline">
                                      {group.nama_perusahaan}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {group.penanggung_jawab}
                                    </p>
                                  </div>

                                  {isExpanded ? (
                                    <ChevronUp className="size-4 shrink-0 text-blue-600" />
                                  ) : (
                                    <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                                  )}
                                </button>
                              </TableCell>

                              {/* NOMOR KONTRAK */}
                              <TableCell>
                                <p className="whitespace-normal text-xs font-semibold">
                                  {group.nomor_kontrak}
                                </p>
                              </TableCell>

                              {/* JUMLAH KABUPATEN */}
                              <TableCell className="text-center">
                                <Badge variant="secondary">
                                  {group.kabupaten.length} Kabupaten
                                </Badge>
                              </TableCell>

                              {/* TARGET */}
                              <TableCell className="text-right tabular-nums">
                                {formatNumber(group.target_titik)}
                              </TableCell>

                              {/* APPROVED */}
                              <TableCell className="text-right font-semibold text-emerald-700 tabular-nums">
                                {formatNumber(group.total_approved)}
                              </TableCell>

                              {/* PROGRESS */}
                              <TableCell>
                                <ProgressBar value={progress} />
                              </TableCell>

                              {/* ANGGARAN */}
                              <TableCell className="text-right font-semibold tabular-nums">
                                {formatRupiah(group.anggaran)}
                              </TableCell>
                            </TableRow>

                            {/* DETAIL KABUPATEN */}
                            {isExpanded && (
                              <TableRow key={`${group.key}-detail`}>
                                <TableCell
                                  colSpan={8}
                                  className="bg-muted/20 p-0"
                                >
                                  <div className="space-y-4 p-4 md:p-6">
                                    {/* HEADER DETAIL */}
                                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <MapPin className="size-4 text-blue-600" />
                                          <h3 className="font-bold">
                                            Rincian Kabupaten
                                          </h3>
                                        </div>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                          {group.nama_perusahaan} ·{" "}
                                          {group.nomor_kontrak}
                                        </p>
                                      </div>

                                      <Badge variant="outline">
                                        {group.details.length} Data Kabupaten
                                      </Badge>
                                    </div>

                                    {/* RINGKASAN KONTRAK */}
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                      <div className="rounded-lg border bg-background p-3">
                                        <p className="text-xs text-muted-foreground">
                                          Target Titik
                                        </p>
                                        <p className="mt-1 text-lg font-bold">
                                          {formatNumber(group.target_titik)}
                                        </p>
                                      </div>

                                      <div className="rounded-lg border bg-background p-3">
                                        <p className="text-xs text-muted-foreground">
                                          Titik Disetujui
                                        </p>
                                        <p className="mt-1 text-lg font-bold text-emerald-700">
                                          {formatNumber(group.total_approved)}
                                        </p>
                                      </div>

                                      <div className="rounded-lg border bg-background p-3">
                                        <p className="text-xs text-muted-foreground">
                                          Titik Ditolak
                                        </p>
                                        <p className="mt-1 text-lg font-bold text-red-600">
                                          {formatNumber(group.total_rejected)}
                                        </p>
                                      </div>

                                      <div className="rounded-lg border bg-background p-3">
                                        <p className="text-xs text-muted-foreground">
                                          Progress Kontrak
                                        </p>
                                        <p className="mt-1 text-lg font-bold text-blue-700">
                                          {formatPercent(progress)}
                                        </p>
                                      </div>
                                    </div>

                                    {/* TABEL RINCIAN */}
                                    <div className="overflow-x-auto rounded-lg border bg-background">
                                      <Table>
                                        <TableHeader>
                                          <TableRow className="bg-muted/50">
                                            <TableHead className="w-[55px]">
                                              No
                                            </TableHead>
                                            <TableHead className="min-w-[180px]">
                                              Kabupaten
                                            </TableHead>
                                            <TableHead className="min-w-[120px]">
                                              No. Berkas
                                            </TableHead>
                                            <TableHead className="text-right">
                                              Target
                                            </TableHead>
                                            <TableHead className="text-right">
                                              Disetujui
                                            </TableHead>
                                            <TableHead className="min-w-[150px]">
                                              Progress
                                            </TableHead>
                                            <TableHead className="text-right">
                                              Ditolak
                                            </TableHead>
                                            <TableHead className="text-right">
                                              Belum Disetujui
                                            </TableHead>
                                            <TableHead className="text-right">
                                              Zona
                                            </TableHead>
                                            <TableHead className="text-right">
                                              Surveyor
                                            </TableHead>
                                          </TableRow>
                                        </TableHeader>

                                        <TableBody>
                                          {group.details.map(
                                            (item, detailIndex) => {
                                              const target = toNumber(
                                                item.target_titik,
                                              );
                                              const approved = toNumber(
                                                item.total_approved,
                                              );

                                              const detailProgress =
                                                target > 0
                                                  ? (approved / target) * 100
                                                  : 0;

                                              return (
                                                <TableRow
                                                  key={`${item.no_berkas}-${item.berkas_id}-${detailIndex}`}
                                                >
                                                  <TableCell>
                                                    {detailIndex + 1}
                                                  </TableCell>

                                                  <TableCell className="font-medium">
                                                    {item.Kabupaten ?? "-"}
                                                  </TableCell>

                                                  <TableCell className="text-xs">
                                                    {item.no_berkas ?? "-"}
                                                  </TableCell>

                                                  <TableCell className="text-right tabular-nums">
                                                    {formatNumber(target)}
                                                  </TableCell>

                                                  <TableCell className="text-right font-semibold text-emerald-700 tabular-nums">
                                                    {formatNumber(approved)}
                                                  </TableCell>

                                                  <TableCell>
                                                    <ProgressBar
                                                      value={detailProgress}
                                                    />
                                                  </TableCell>

                                                  <TableCell className="text-right text-red-600 tabular-nums">
                                                    {formatNumber(
                                                      toNumber(
                                                        item.total_rejected,
                                                      ),
                                                    )}
                                                  </TableCell>

                                                  <TableCell className="text-right text-amber-600 tabular-nums">
                                                    {formatNumber(
                                                      toNumber(
                                                        item.total_not_approved,
                                                      ),
                                                    )}
                                                  </TableCell>

                                                  <TableCell className="text-right tabular-nums">
                                                    {formatNumber(
                                                      toNumber(
                                                        item.jumlah_zona,
                                                      ),
                                                    )}
                                                  </TableCell>

                                                  <TableCell className="text-right tabular-nums">
                                                    {formatNumber(
                                                      toNumber(
                                                        item.total_surveyor,
                                                      ),
                                                    )}
                                                  </TableCell>
                                                </TableRow>
                                              );
                                            },
                                          )}
                                        </TableBody>
                                      </Table>
                                    </div>

                                    {/* INFORMASI KONTRAK */}
                                    <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:justify-between">
                                      <p>
                                        Tanggal Mulai:{" "}
                                        {formatDate(group.tgl_mulai)}
                                      </p>
                                      <p>
                                        Tanggal Selesai:{" "}
                                        {formatDate(group.tgl_selesai)}
                                      </p>
                                      <p>
                                        Anggaran: {formatRupiah(group.anggaran)}
                                      </p>
                                    </div>
                                  </div>
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
              {/* PAGINATION */}
              <div className="flex flex-col justify-between gap-3 border-t pt-4 sm:flex-row sm:items-center">
                <div className="text-sm text-muted-foreground">
                  Menampilkan{" "}
                  <span className="font-semibold text-foreground">
                    {contractGroups.length === 0
                      ? 0
                      : (currentPage - 1) * pageSize + 1}
                    {" - "}
                    {Math.min(currentPage * pageSize, contractGroups.length)}
                  </span>
                  {" dari "}
                  <span className="font-semibold text-foreground">
                    {formatNumber(contractGroups.length)}
                  </span>
                  {" kontrak"}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => {
                      setCurrentPage((page) => page - 1);
                      setSelectedContract(null);
                    }}
                    className="rounded-md border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span className="flex items-center gap-1">
                      <ChevronLeft className="size-4" />
                      Sebelumnya
                    </span>
                  </button>

                  <span className="min-w-[65px] text-center text-sm font-semibold tabular-nums">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => {
                      setCurrentPage((page) => page + 1);
                      setSelectedContract(null);
                    }}
                    className="rounded-md border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span className="flex items-center gap-1">
                      Berikutnya
                      <ChevronRight className="size-4" />
                    </span>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* FOOTER */}

      <div className="flex flex-col gap-2 border-t pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Monitoring Progress ILASPP</p>

        <p>{response?.total ?? data.length} data tersedia dari API</p>
      </div>
    </main>
  );
}
