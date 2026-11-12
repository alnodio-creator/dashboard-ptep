"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Search,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { formatRupiah } from "@/constants/auth-constants";
import { formatNumber } from "@/data/land-values";

import { Kegiatan } from "../types/type";
import { toNumber } from "./revisi-page";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// ======================================================
// HELPERS
// ======================================================

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

type ContractGroup = {
  key: string;
  nomor_kontrak: string | null;
  items: Kegiatan[];
  anggaran: number;
};

function groupByContract(items: Kegiatan[]): ContractGroup[] {
  const map = new Map<string, ContractGroup>();

  items.forEach((item) => {
    const nomorKontrak = item.nomor_kontrak?.trim() || "";

    // Nomor kontrak sama = satu kelompok.
    // Jika kosong, gunakan nomor berkas.
    const key = nomorKontrak
      ? `KONTRAK-${normalize(nomorKontrak)}`
      : `BERKAS-${item.no_berkas ?? Math.random()}`;

    const existing = map.get(key);

    if (!existing) {
      map.set(key, {
        key,
        nomor_kontrak: nomorKontrak || null,
        items: [item],

        // Ambil anggaran dari satu baris pertama saja.
        anggaran: toNumber(item.anggaran),
      });
    } else {
      existing.items.push(item);
    }
  });

  return Array.from(map.values());
}

// ======================================================
// GROUP PROVINSI
// ======================================================

type ProvinsiGroup = {
  key: string;
  provinsi: string;
  kanwilid: string | null;
  kode_kegiatan: string | null;
  items: Kegiatan[];
};

function groupByProvinsi(data: Kegiatan[]): ProvinsiGroup[] {
  const map = new Map<string, ProvinsiGroup>();

  data.forEach((item) => {
    const provinsi = item.namakantor || "Provinsi Tidak Diketahui";

    const key = [
      item.kanwilid ?? "",
      item.kode_kegiatan ?? "",
      normalize(provinsi),
    ].join("-");

    if (!map.has(key)) {
      map.set(key, {
        key,
        provinsi,
        kanwilid: item.kanwilid,
        kode_kegiatan: item.kode_kegiatan,
        items: [],
      });
    }

    map.get(key)!.items.push(item);
  });

  return Array.from(map.values()).sort((a, b) =>
    a.provinsi.localeCompare(b.provinsi, "id"),
  );
}

// ======================================================
// GROUP KABUPATEN
// ======================================================

type KabupatenGroup = {
  key: string;
  nama: string;
  items: Kegiatan[];
};

function groupByKabupaten(items: Kegiatan[]): KabupatenGroup[] {
  const map = new Map<string, KabupatenGroup>();

  items.forEach((item) => {
    const nama = item.Kabupaten || "Wilayah Tidak Diketahui";
    const key = normalize(nama);

    if (!map.has(key)) {
      map.set(key, {
        key,
        nama,
        items: [],
      });
    }

    map.get(key)!.items.push(item);
  });

  return Array.from(map.values()).sort((a, b) =>
    a.nama.localeCompare(b.nama, "id"),
  );
}

// ======================================================
// MAIN COMPONENT
// ======================================================

export function MonitoringActivityTableRevisi({
  data,
  title,
}: {
  data: Kegiatan[];
  title: string;
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);

  // ====================================================
  // FILTER
  // ====================================================

  const filteredData = useMemo(() => {
    const keyword = normalize(search);

    if (!keyword) return data;

    return data.filter((item) =>
      [
        item.namakantor,
        item.Kabupaten,
        item.no_berkas,
        item.nama_tahapan,
        item.penanggung_jawab,
        item.nama_kegiatan,
        item.nomor_kontrak,
        item.nama_perusahaan,
      ].some((value) => normalize(value).includes(keyword)),
    );
  }, [data, search]);

  // ====================================================
  // GROUPING
  // ====================================================

  const groupedData = useMemo(
    () => groupByProvinsi(filteredData),
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

  const totalKabupaten = useMemo(() => {
    return new Set(filteredData.map((item) => normalize(item.Kabupaten))).size;
  }, [filteredData]);

  const totalKontrak = useMemo(() => {
    return new Set(
      filteredData.map((item) =>
        item.nomor_kontrak?.trim()
          ? `K-${normalize(item.nomor_kontrak)}`
          : `B-${item.no_berkas}`,
      ),
    ).size;
  }, [filteredData]);

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-3 border-b bg-muted/20 p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <FileSpreadsheet className="size-5" />
          </div>

          <div>
            <h3 className="font-bold">{title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Rincian kegiatan berdasarkan provinsi, kontrak, kabupaten/kota,
              dan berkas.
            </p>
          </div>
        </div>

        <Badge variant="outline">
          Halaman {currentPage} dari {totalPages}
        </Badge>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-2 gap-3 border-b p-4 sm:grid-cols-4">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Provinsi</p>
          <p className="mt-1 text-xl font-bold">
            {groupedData.length.toLocaleString("id-ID")}
          </p>
        </div>

        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Kabupaten/Kota</p>
          <p className="mt-1 text-xl font-bold">
            {totalKabupaten.toLocaleString("id-ID")}
          </p>
        </div>

        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Total Kontrak</p>
          <p className="mt-1 text-xl font-bold">
            {totalKontrak.toLocaleString("id-ID")}
          </p>
        </div>

        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Total Berkas</p>
          <p className="mt-1 text-xl font-bold">
            {filteredData.length.toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      {/* SEARCH & PAGE SIZE */}
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari provinsi, kontrak, kabupaten..."
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

          <span className="text-sm text-muted-foreground">provinsi</span>
        </div>
      </div>

      {/* TABLE */}

      {/* TABLE */}
      <div className="max-h-[680px] overflow-auto">
        <Table className="min-w-[1550px]">
          <TableHeader className="sticky top-0 z-30 bg-muted">
            <TableRow>
              <TableHead className="w-16 px-4">No.</TableHead>

              <TableHead className="sticky left-0 z-40 min-w-[230px] bg-muted">
                Provinsi
              </TableHead>

              <TableHead className="min-w-[200px]">No. Kontrak</TableHead>

              <TableHead className="min-w-[180px] text-right">
                Anggaran
              </TableHead>

              <TableHead className="min-w-[200px]">Kabupaten/Kota</TableHead>

              <TableHead className="min-w-[150px]">No. Berkas</TableHead>

              <TableHead className="min-w-[140px]">Tahapan</TableHead>

              <TableHead>Tahun</TableHead>

              <TableHead className="min-w-[140px] text-right">
                Target Luasan
              </TableHead>

              <TableHead>Skala</TableHead>

              <TableHead className="min-w-[180px]">Sumber Anggaran</TableHead>

              <TableHead className="min-w-[200px]">Perusahaan</TableHead>

              <TableHead className="min-w-[200px]">Penanggung Jawab</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedGroups.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={13}
                  className="h-32 text-center text-muted-foreground"
                >
                  Tidak ada data yang sesuai.
                </TableCell>
              </TableRow>
            ) : (
              paginatedGroups.map((province, provinceIndex) => {
                const contractGroups = groupByContract(province.items);
                const provinceRowCount = province.items.length;

                let rowNumber = 0;

                return contractGroups.flatMap((contractGroup) => {
                  const kabupatenGroups = groupByKabupaten(contractGroup.items);
                  let contractRowIndex = 0;

                  return kabupatenGroups.flatMap((kabupaten) => {
                    return kabupaten.items.map((item, itemIndex) => {
                      const isFirstProvinceRow = rowNumber === 0;
                      const isFirstContractRow = contractRowIndex === 0;
                      const isFirstKabupatenRow = itemIndex === 0;

                      rowNumber++;
                      contractRowIndex++;

                      return (
                        <TableRow
                          key={`${province.key}-${contractGroup.key}-${kabupaten.key}-${item.no_berkas}-${rowNumber}`}
                          className="hover:bg-muted/30"
                        >
                          {/* NOMOR */}
                          <TableCell className="px-4 text-muted-foreground">
                            {((currentPage - 1) * pageSize + provinceIndex + 1)
                              .toString()
                              .padStart(2, "0")}
                            <span className="text-[10px]">.{rowNumber}</span>
                          </TableCell>

                          {/* 1. PROVINSI - MERGE */}
                          {isFirstProvinceRow && (
                            <TableCell
                              rowSpan={provinceRowCount}
                              className="sticky left-0 z-20 min-w-[230px] border-r bg-background align-middle"
                            >
                              <div className="space-y-3">
                                <Link
                                  href={`/Monitoring/monitoring-berkas/${province.kanwilid}/${province.kode_kegiatan}`}
                                  className="font-semibold text-blue-800 underline decoration-blue-300 underline-offset-4 hover:text-primary"
                                >
                                  {province.provinsi}
                                </Link>

                                <div className="flex flex-wrap gap-1">
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px]"
                                  >
                                    {
                                      new Set(
                                        province.items.map((i) =>
                                          normalize(i.Kabupaten),
                                        ),
                                      ).size
                                    }{" "}
                                    Kabupaten
                                  </Badge>

                                  <Badge
                                    variant="outline"
                                    className="text-[10px]"
                                  >
                                    {provinceRowCount} Berkas
                                  </Badge>
                                </div>
                              </div>
                            </TableCell>
                          )}

                          {/* 2. NOMOR KONTRAK + NAMA PERUSAHAAN - MERGE */}
                          {isFirstContractRow && (
                            <TableCell
                              rowSpan={contractGroup.items.length}
                              className="min-w-[220px] max-w-[260px] whitespace-normal border-r bg-blue-50/50 align-middle"
                            >
                              <div className="space-y-2">
                                {/* Nomor Kontrak */}
                                <p className="text-xs font-bold text-blue-800">
                                  {contractGroup.nomor_kontrak ||
                                    "Tidak ada nomor kontrak"}
                                </p>

                                {/* Nama Perusahaan */}
                                <div className=" border-blue-200 pt-2">
                                  <p className="text-[10px] text-muted-foreground">
                                    Perusahaan
                                  </p>
                                  <p className="text-xs font-medium text-foreground">
                                    {contractGroup.items[0]?.nama_perusahaan ||
                                      "-"}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                          )}

                          {/* 3. ANGGARAN - MERGE */}
                          {isFirstContractRow && (
                            <TableCell
                              rowSpan={contractGroup.items.length}
                              className="min-w-[180px] bg-emerald-50/50 text-right align-middle font-bold tabular-nums"
                            >
                              {formatRupiah(contractGroup.anggaran)}
                            </TableCell>
                          )}

                          {/* 4. KABUPATEN - MERGE */}
                          {isFirstKabupatenRow && (
                            <TableCell
                              rowSpan={kabupaten.items.length}
                              className="min-w-[200px] border-r align-middle"
                            >
                              <div className="space-y-2">
                                <p className="font-semibold">
                                  {kabupaten.nama}
                                </p>

                                <Badge
                                  variant="outline"
                                  className="text-[10px]"
                                >
                                  {kabupaten.items.length} Berkas
                                </Badge>
                              </div>
                            </TableCell>
                          )}

                          {/* 5. NO BERKAS */}
                          <TableCell className="font-semibold">
                            {item.no_berkas || "-"}
                          </TableCell>

                          {/* 6. TAHAPAN */}
                          <TableCell>
                            <Badge variant="outline">
                              {item.nama_tahapan || "Belum diisi"}
                            </Badge>
                          </TableCell>

                          {/* 7. TAHUN */}
                          <TableCell>{item.anggaran_tahun ?? "-"}</TableCell>

                          {/* 8. TARGET LUASAN */}
                          <TableCell className="text-right tabular-nums">
                            {formatNumber(toNumber(item.target_luasan))}
                          </TableCell>

                          {/* 9. SKALA */}
                          <TableCell>{item.skala || "-"}</TableCell>

                          {/* 10. SUMBER ANGGARAN */}
                          <TableCell>
                            <Badge variant="outline">
                              {item.nama_anggaran || "-"}
                            </Badge>
                          </TableCell>

                          {/* 11. PERUSAHAAN */}
                          <TableCell className="max-w-[200px] whitespace-normal">
                            {item.nama_perusahaan || "-"}
                          </TableCell>

                          {/* 12. PENANGGUNG JAWAB */}
                          <TableCell className="max-w-[200px] whitespace-normal">
                            {item.penanggung_jawab || "-"}
                          </TableCell>
                        </TableRow>
                      );
                    });
                  });
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
          {groupedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          {"–"}
          {Math.min(currentPage * pageSize, groupedData.length)}
          {" dari "}
          {groupedData.length.toLocaleString("id-ID")} kelompok provinsi. Total{" "}
          {filteredData.length.toLocaleString("id-ID")} berkas.
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
    </Card>
  );
}
