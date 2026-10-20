"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Activity,
  Banknote,
  CalendarDays,
  FileSpreadsheet,
  Filter,
  MapPin,
  MapPinned,
  TrendingUp,
  RefreshCw,
  Search,
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

import { FilterSelect } from "./filter-select";
import { SummaryCard } from "./summary-card";
import { formatRupiah } from "@/constants/auth-constants";
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

// ======================================================
// HELPERS
// ======================================================

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;

  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(value);
}

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

// ======================================================
// REKAP TAHAPAN PER PROVINSI
// ======================================================

const TAHAPAN_REKAP = [
  { key: "persiapan", label: "Persiapan", aliases: ["persiapan"] },
  {
    key: "zona-awal",
    label: "Pembuatan Zona Awal",
    aliases: ["pembuatan zona awal", "zona awal"],
  },
  {
    key: "survei-batas",
    label: "Survei Batas Zona Awal Nilai Tanah",
    aliases: ["survei batas zona awal nilai tanah", "survei batas zona awal"],
  },
  {
    key: "sampel",
    label: "Pengumpulan Data Sampel Nilai Tanah",
    aliases: [
      "pengumpulan data sampel nilai tanah",
      "pengumpulan data sample nilai tanah",
      "pengumpulan data sampel",
      "pengumpulan data sample",
    ],
  },
  {
    key: "analisis",
    label: "Analisis dan Pengolahan Data",
    aliases: [
      "analisis dan pengolahan data",
      "analisis pengolahan data",
      "analisis dan pengolahan",
    ],
  },
  {
    key: "penyajian",
    label: "Penyajian Peta",
    aliases: ["penyajian peta"],
  },
  { key: "pelaporan", label: "Pelaporan", aliases: ["pelaporan"] },
  { key: "selesai", label: "Selesai", aliases: ["selesai"] },
] as const;

function normalizeTahapan(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[–—-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getProvinsi(namaKantor: string | null): string {
  const nama = (namaKantor ?? "").trim();
  return (
    nama
      .replace(/^kantor\s+wilayah\s+provinsi\s+/i, "")
      .replace(/^kanwil\s+/i, "")
      .trim() || "Provinsi belum diketahui"
  );
}

function getTahapanIndex(status: string | null): number {
  const value = normalizeTahapan(status);
  const matches = TAHAPAN_REKAP.map((tahap, index) => ({
    index,
    length: Math.max(
      0,
      ...tahap.aliases
        .filter((alias) => value.includes(alias))
        .map((alias) => alias.length),
    ),
  }))
    .filter((item) => item.length > 0)
    .sort((a, b) => b.length - a.length);

  return matches[0]?.index ?? -1;
}

function formatPersen(value: number): string {
  return `${value.toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

function RekapTahapanProvinsi({
  data,
  title,
  description,
}: {
  data: Kegiatan[];
  title: string;
  description: string;
}) {
  const rekap = useMemo(() => {
    const provinsiMap = new Map<
      string,
      Map<string, { tahapan: number; tahun: number | null; noBerkas: string }>
    >();

    data.forEach((item) => {
      const provinsi = getProvinsi(item.nama);
      const kabupaten = (item.Kabupaten ?? "").trim();
      if (!kabupaten) return;

      if (!provinsiMap.has(provinsi)) provinsiMap.set(provinsi, new Map());
      const kabupatenMap = provinsiMap.get(provinsi)!;

      // Satu kabupaten dihitung satu kali dalam kombinasi provinsi dan kegiatan.
      const keyKabupaten = normalizeTahapan(kabupaten);
      const tahapIndex = getTahapanIndex(item.nama_tahapan);
      const existing = kabupatenMap.get(keyKabupaten);

      // Jika ada beberapa berkas untuk kabupaten yang sama, gunakan tahapan
      // paling maju agar satu kabupaten tidak dihitung berulang kali.
      if (!existing || tahapIndex > existing.tahapan) {
        kabupatenMap.set(keyKabupaten, {
          tahapan: tahapIndex,
          tahun: item.anggaran_tahun,
          noBerkas: item.no_berkas ?? "",
        });
      }
    });

    return Array.from(provinsiMap.entries())
      .map(([provinsi, kabupatenMap]) => {
        const totalKabupaten = kabupatenMap.size;
        const jumlahTahapan = TAHAPAN_REKAP.map(
          (_, index) =>
            Array.from(kabupatenMap.values()).filter(
              (item) => item.tahapan === index,
            ).length,
        );
        const persenTahapan = jumlahTahapan.map((jumlah) =>
          totalKabupaten > 0 ? (jumlah / totalKabupaten) * 100 : 0,
        );
        const jumlahTerpetakan = Array.from(kabupatenMap.values()).filter(
          (item) => item.tahapan >= 0,
        ).length;

        // Agregat = rata-rata posisi tahapan tiap kabupaten (Persiapan 0%,
        // Selesai 100%). Berbeda dengan rata-rata distribusi tiap kolom.
        const agregat =
          totalKabupaten > 0
            ? (Array.from(kabupatenMap.values()).reduce(
                (sum, item) =>
                  sum +
                  (item.tahapan >= 0
                    ? item.tahapan / (TAHAPAN_REKAP.length - 1)
                    : 0),
                0,
              ) /
                totalKabupaten) *
              100
            : 0;

        return {
          provinsi,
          totalKabupaten,
          jumlahTahapan,
          persenTahapan,
          jumlahTerpetakan,
          agregat,
        };
      })
      .sort((a, b) => a.provinsi.localeCompare(b.provinsi, "id"));
  }, [data]);

  const totalKabupaten = rekap.reduce(
    (sum, item) => sum + item.totalKabupaten,
    0,
  );
  const totalTerpetakan = rekap.reduce(
    (sum, item) => sum + item.jumlahTerpetakan,
    0,
  );
  const totalAgregat =
    totalKabupaten > 0
      ? rekap.reduce(
          (sum, item) => sum + item.agregat * item.totalKabupaten,
          0,
        ) / totalKabupaten
      : 0;

  return (
    <section className="w-full min-w-0 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <MapPinned className="size-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <Badge variant="outline" className="w-fit">
          {rekap.length.toLocaleString("id-ID")} provinsi
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Jumlah Provinsi</p>
            <p className="mt-1 text-2xl font-bold">
              {rekap.length.toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Kabupaten/Kota Unik</p>
            <p className="mt-1 text-2xl font-bold">
              {totalKabupaten.toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="size-4" />
              <p className="text-xs">Persentase Agregat</p>
            </div>
            <p className="mt-1 text-2xl font-bold">
              {formatPersen(totalAgregat)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {totalTerpetakan.toLocaleString("id-ID")} kabupaten/kota memiliki
              tahapan yang dikenali
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="min-w-0 overflow-hidden border-border/60 shadow-sm">
        <div className="border-b bg-muted/30 px-4 py-4">
          <h3 className="font-bold">Rekap Progres per Provinsi</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Persentase kolom menunjukkan proporsi kabupaten/kota pada tahapan
            tersebut. Agregat adalah rata-rata progres tahapan.
          </p>
        </div>

        <div className="w-full overflow-x-auto">
          <Table className="min-w-[1750px]">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="sticky left-0 z-20 min-w-50 bg-muted/95">
                  Provinsi
                </TableHead>
                <TableHead className="min-w-27.5 text-center">
                  Jumlah Kab/Kota
                </TableHead>
                {TAHAPAN_REKAP.map((tahap) => (
                  <TableHead
                    key={tahap.key}
                    className="min-w-38.75 whitespace-normal"
                  >
                    {tahap.label}
                  </TableHead>
                ))}
                <TableHead className="min-w-38.75 bg-blue-50 font-bold text-blue-800">
                  Persentase Agregat
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rekap.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={TAHAPAN_REKAP.length + 3}
                    className="h-32 text-center text-sm text-muted-foreground"
                  >
                    Tidak ada data rekap untuk filter yang dipilih.
                  </TableCell>
                </TableRow>
              ) : (
                rekap.map((item) => (
                  <TableRow key={item.provinsi} className="hover:bg-muted/30">
                    <TableCell className="sticky left-0 z-10 bg-background font-semibold">
                      {item.provinsi}
                    </TableCell>
                    <TableCell className="text-center font-semibold tabular-nums">
                      {item.totalKabupaten.toLocaleString("id-ID")}
                    </TableCell>
                    {item.persenTahapan.map((persen, index) => (
                      <TableCell key={TAHAPAN_REKAP[index].key}>
                        <div className="min-w-26.25 space-y-1.5">
                          <div className="text-xs font-semibold tabular-nums">
                            {formatPersen(persen)}
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-blue-600 transition-all"
                              style={{
                                width: `${Math.min(100, Math.max(0, persen))}%`,
                              }}
                            />
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {item.jumlahTahapan[index]} dari{" "}
                            {item.totalKabupaten}
                          </p>
                        </div>
                      </TableCell>
                    ))}
                    <TableCell className="bg-blue-50/50">
                      <p className="font-bold text-blue-800">
                        {formatPersen(item.agregat)}
                      </p>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{
                            width: `${Math.min(100, item.agregat)}%`,
                          }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="border-t px-4 py-3 text-xs text-muted-foreground">
          Geser tabel ke kanan untuk melihat semua tahapan. Rekap menghitung
          kabupaten/kota unik satu kali per provinsi dan menggunakan tahapan
          paling maju jika ada beberapa berkas di kabupaten/kota yang sama.
        </div>
      </Card>
    </section>
  );
}

// ======================================================
// MAIN PAGE
// ======================================================

export default function RekapTahapanPage() {
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

  // Data rekap tidak dipengaruhi filter tahapan agar persentase tetap
  // memakai seluruh kabupaten/kota sesuai filter lainnya.
  const dataUntukRekap = useMemo(() => {
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

      return matchesSearch && matchesWilayah && matchesTahun && matchesSumber;
    });
  }, [data, search, filter.wilayah, filter.tahun, filter.sumber]);

  const rekapPembuatan = useMemo(
    () => dataUntukRekap.filter((item) => item.kode_kegiatan?.trim() === "01"),
    [dataUntukRekap],
  );

  const rekapPembaruan = useMemo(
    () => dataUntukRekap.filter((item) => item.kode_kegiatan?.trim() === "02"),
    [dataUntukRekap],
  );

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

      {!isLoading && !isError && (
        <>
          <RekapTahapanProvinsi
            title="Rekap Tahapan Pembuatan ZNT"
            description="Persentase progres pembuatan Zona Nilai Tanah per provinsi."
            data={rekapPembuatan}
          />
          <RekapTahapanProvinsi
            title="Rekap Tahapan Pembaruan ZNT"
            description="Persentase progres pembaruan Zona Nilai Tanah per provinsi."
            data={rekapPembaruan}
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
