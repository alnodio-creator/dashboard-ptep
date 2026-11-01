"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Filter, Search, RotateCcw } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Kegiatan } from "../types/type";
import { MonitoringKontrakTable } from "./revisi-monitoring-kontrak";

// ======================================================
// TYPES
// ======================================================

type ApiResponse = {
  success: boolean;
  message?: string;
  data: Kegiatan[];
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

function normalize(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;

  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

const initialFilter: FilterState = {
  wilayah: "Semua",
  tahun: "Semua",
  sumber: "Semua",
  tahapan: "Semua",
};

// ======================================================
// MAIN PAGE
// ======================================================

export default function MonitoringPageRevisi() {
  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState<FilterState>(initialFilter);

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

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
    queryKey: ["Data_Kantah"],

    queryFn: async () => {
      const result = await fetch(`${basePath}/api/berkas-monitoring-ilaspp`);

      if (!result.ok) {
        throw new Error("Gagal mengambil data berkas SIPENTA");
      }

      const json: ApiResponse = await result.json();

      if (!json.success) {
        throw new Error(json.message || "Gagal mengambil data.");
      }

      return json;
    },
  });

  const data = response?.data ?? [];

  // ====================================================
  // FILTER OPTIONS
  // ====================================================

  const wilayahOptions = useMemo(
    () =>
      Array.from(
        new Set(
          data.map((item) => item.namakantor).filter((v): v is string => !!v),
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
            .filter((v): v is number => v !== null && v !== undefined),
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
          item.namakantor,
          item.Kabupaten,
          item.nama_kegiatan,
          item.nama_tahapan,
          item.nomor_kontrak,
          item.nama_perusahaan,
          item.penanggung_jawab,
        ].some((value) => normalize(value).includes(keyword));

      const matchesWilayah =
        filter.wilayah === "Semua" || item.namakantor === filter.wilayah;

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

  // ====================================================
  // SUMMARY
  // ====================================================

  const summary = useMemo(() => {
    const contracts = new Map<string, number>();

    filteredData.forEach((item) => {
      const nomor = item.nomor_kontrak?.trim();

      const key = nomor ? normalize(nomor) : `berkas-${item.no_berkas}`;

      // Anggaran satu kali per kontrak
      if (!contracts.has(key)) {
        contracts.set(key, toNumber(item.anggaran));
      }
    });

    return {
      berkas: filteredData.length,
      kontrak: contracts.size,
      perusahaan: new Set(
        filteredData.map((item) => normalize(item.nama_perusahaan)),
      ).size,
      anggaran: Array.from(contracts.values()).reduce(
        (sum, value) => sum + value,
        0,
      ),
    };
  }, [filteredData]);

  // ====================================================
  // RESET FILTER
  // ====================================================

  const resetFilter = () => {
    setSearch("");
    setFilter(initialFilter);
  };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <main className="min-h-screen space-y-6 bg-muted/20 p-4 md:p-6 lg:p-8">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Monitoring PTEP</Badge>
            <Badge variant="secondary">2026</Badge>
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            Monitoring Kontrak dan Realisasi Fisik
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Monitoring pelaksanaan kegiatan berdasarkan perusahaan, nomor
            kontrak, anggaran, wilayah, dan capaian QC setiap tahapan.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          <RefreshCw
            className={`mr-2 size-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh Data
        </Button>
      </div>

      {/* FILTER */}
      <Card>
        <CardContent className="space-y-4 p-4 md:p-5">
          <div className="flex items-center gap-2 font-semibold">
            <Filter className="size-4" />
            Filter Monitoring
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Wilayah
              </label>

              <select
                value={filter.wilayah}
                onChange={(e) =>
                  setFilter((prev) => ({
                    ...prev,
                    wilayah: e.target.value,
                  }))
                }
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="Semua">Semua Wilayah</option>
                {wilayahOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Tahun Anggaran
              </label>

              <select
                value={filter.tahun}
                onChange={(e) =>
                  setFilter((prev) => ({
                    ...prev,
                    tahun: e.target.value,
                  }))
                }
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="Semua">Semua Tahun</option>
                {tahunOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Sumber Anggaran
              </label>

              <select
                value={filter.sumber}
                onChange={(e) =>
                  setFilter((prev) => ({
                    ...prev,
                    sumber: e.target.value,
                  }))
                }
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="Semua">Semua Sumber</option>
                {sumberOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Tahapan Kegiatan
              </label>

              <select
                value={filter.tahapan}
                onChange={(e) =>
                  setFilter((prev) => ({
                    ...prev,
                    tahapan: e.target.value,
                  }))
                }
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="Semua">Semua Tahapan</option>
                {tahapanOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari perusahaan, kontrak, kabupaten, nomor berkas..."
                className="h-10 pl-9"
              />
            </div>

            <Button
              variant="outline"
              onClick={resetFilter}
              className="shrink-0"
            >
              <RotateCcw className="mr-2 size-4" />
              Reset Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SUMMARY */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard
          title="Total Perusahaan"
          value={summary.perusahaan.toLocaleString("id-ID")}
          description="Perusahaan penyedia"
        />

        <SummaryCard
          title="Total Kontrak"
          value={summary.kontrak.toLocaleString("id-ID")}
          description="Kontrak unik"
        />

        <SummaryCard
          title="Total Berkas"
          value={summary.berkas.toLocaleString("id-ID")}
          description="Berkas kegiatan"
        />

        <SummaryCard
          title="Total Anggaran"
          value={new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
          }).format(summary.anggaran)}
          description="Akumulasi anggaran kontrak"
        />
      </div>

      {/* TABLE */}
      {isLoading ? (
        <Card>
          <CardContent className="flex min-h-52 items-center justify-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="size-4 animate-spin" />
            Memuat data monitoring kontrak...
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="p-6 text-sm text-red-600">
            {error instanceof Error ? error.message : "Gagal mengambil data."}
          </CardContent>
        </Card>
      ) : (
        <MonitoringKontrakTable data={filteredData} />
      )}
    </main>
  );
}

// ======================================================
// SUMMARY CARD
// ======================================================

function SummaryCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{title}</p>

        <p className="mt-2 break-words text-xl font-bold tabular-nums sm:text-2xl">
          {value}
        </p>

        <p className="mt-1 text-[11px] text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
