"use client";

import React, { useMemo, useState } from "react";
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

import { ChevronLeft, ChevronRight, FileSpreadsheet } from "lucide-react";

import { formatRupiah } from "@/constants/auth-constants";
import { formatNumber } from "@/data/land-values";

import { Kegiatan } from "../types/type";
import { toNumber } from "./chart-monitoring";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// ======================================================
// HELPERS
// ======================================================

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

type KabupatenGroup = {
  nama: string;
  items: Kegiatan[];
};

type ProvinsiGroup = {
  key: string;
  provinsi: string;
  kanwilid: string | null;
  kode_kegiatan: string | null;
  kabupaten: KabupatenGroup[];
  items: Kegiatan[];
};

function groupByProvinsi(data: Kegiatan[]): ProvinsiGroup[] {
  const provinceMap = new Map<string, ProvinsiGroup>();

  for (const item of data) {
    const province = item.namakantor || "Provinsi Tidak Diketahui";

    // Kode kegiatan dipisahkan karena URL detail membutuhkan
    // satu kode kegiatan tertentu.
    const key = [item.kanwilid, item.kode_kegiatan, normalize(province)].join(
      "-",
    );

    if (!provinceMap.has(key)) {
      provinceMap.set(key, {
        key,
        provinsi: province,
        kanwilid: item.kanwilid,
        kode_kegiatan: item.kode_kegiatan,
        kabupaten: [],
        items: [],
      });
    }

    provinceMap.get(key)!.items.push(item);
  }

  return Array.from(provinceMap.values())
    .map((province) => {
      const kabupatenMap = new Map<string, KabupatenGroup>();

      for (const item of province.items) {
        const name = item.Kabupaten || "Wilayah Tidak Diketahui";
        const key = normalize(name);

        if (!kabupatenMap.has(key)) {
          kabupatenMap.set(key, {
            nama: name,
            items: [],
          });
        }

        kabupatenMap.get(key)!.items.push(item);
      }

      return {
        ...province,
        kabupaten: Array.from(kabupatenMap.values()).sort((a, b) =>
          a.nama.localeCompare(b.nama, "id"),
        ),
      };
    })
    .sort((a, b) => a.provinsi.localeCompare(b.provinsi, "id"));
}

// ======================================================
// MAIN COMPONENT
// ======================================================

export function MonitoringActivityTable2({
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
  // FILTER DATA
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
      ].some((value) => normalize(value).includes(keyword)),
    );
  }, [data, search]);

  // ====================================================
  // GROUP PROVINSI -> KABUPATEN -> BERKAS
  // ====================================================

  const groupedData = useMemo(
    () => groupByProvinsi(filteredData),
    [filteredData],
  );

  // Pagination berdasarkan kelompok provinsi
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
    const unique = new Set(
      filteredData.map((item) => normalize(item.Kabupaten)),
    );

    return unique.size;
  }, [filteredData]);

  const totalProvinsi = groupedData.length;

  const sumberClass = (sumber: string | null) => {
    switch (normalize(sumber)) {
      case "apbn":
        return "border-blue-200 bg-blue-50 text-blue-700";
      case "apbd":
        return "border-violet-200 bg-violet-50 text-violet-700";
      case "phln":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
      default:
        return "border-border bg-muted text-muted-foreground";
    }
  };

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
              Monitoring kegiatan berdasarkan provinsi dan kabupaten/kota.
            </p>
          </div>
        </div>

        <Badge variant="outline">
          Halaman {currentPage} dari {totalPages}
        </Badge>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 gap-3 border-b p-4 sm:grid-cols-3">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Total Provinsi</p>
          <p className="mt-1 text-xl font-bold">
            {totalProvinsi.toLocaleString("id-ID")}
          </p>
        </div>

        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Kabupaten/Kota</p>
          <p className="mt-1 text-xl font-bold">
            {totalKabupaten.toLocaleString("id-ID")}
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
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cari provinsi, kabupaten, nomor berkas..."
          className="h-10 w-full max-w-md rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />

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
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
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
      <div className="max-h-[680px] overflow-auto">
        <Table className="min-w-[1500px]">
          <TableHeader className="sticky top-0 z-30 bg-muted">
            <TableRow>
              <TableHead className="px-4">No.</TableHead>

              <TableHead className="sticky left-0 z-40 min-w-[230px] bg-muted">
                Provinsi
              </TableHead>

              <TableHead className="min-w-[200px]">Kabupaten/Kota</TableHead>

              <TableHead>No. Berkas</TableHead>

              <TableHead>Tahapan</TableHead>

              <TableHead>Tahun</TableHead>

              <TableHead className="text-right">Anggaran</TableHead>

              <TableHead className="text-right">Target Luasan</TableHead>

              <TableHead>Skala</TableHead>

              <TableHead>Jenis Kontrak</TableHead>

              <TableHead>No. Kontrak</TableHead>

              <TableHead>Penanggung Jawab</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedGroups.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={12}
                  className="h-32 text-center text-muted-foreground"
                >
                  Tidak ada data yang sesuai dengan filter.
                </TableCell>
              </TableRow>
            ) : (
              paginatedGroups.map((province, provinceIndex) => {
                const provinceRowCount = province.items.length;

                let rowNumber = 0;

                return province.kabupaten.map((kabupaten, kabIndex) => (
                  <React.Fragment key={`${province.key}-${kabupaten.nama}`}>
                    {kabupaten.items.map((item, itemIndex) => {
                      const isFirstProvinceRow = rowNumber === 0;
                      const isFirstKabupatenRow = itemIndex === 0;

                      rowNumber++;

                      return (
                        <TableRow
                          key={`${item.no_berkas}-${itemIndex}`}
                          className="hover:bg-muted/30"
                        >
                          {/* NOMOR */}
                          <TableCell className="px-4 text-muted-foreground">
                            {((currentPage - 1) * pageSize + provinceIndex + 1)
                              .toString()
                              .padStart(2, "0")}
                            <span className="text-[10px]">.{rowNumber}</span>
                          </TableCell>

                          {/* PROVINSI - MERGED */}
                          {isFirstProvinceRow && (
                            <TableCell
                              rowSpan={provinceRowCount}
                              className="sticky left-0 z-20 min-w-[230px] border-r bg-background align-top"
                            >
                              <div className="space-y-3">
                                <Link
                                  href={`/Monitoring/monitoring-berkas/${province.kanwilid}/${province.kode_kegiatan}`}
                                  className="font-semibold text-blue-800 underline decoration-blue-300 underline-offset-4 hover:text-primary hover:decoration-primary"
                                >
                                  {province.provinsi}
                                </Link>

                                <div className="flex flex-wrap gap-1">
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px]"
                                  >
                                    {province.kabupaten.length} Kabupaten/Kota
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

                          {/* KABUPATEN - MERGED */}
                          {isFirstKabupatenRow && (
                            <TableCell
                              rowSpan={kabupaten.items.length}
                              className="min-w-[200px] border-r align-top"
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

                          {/* DETAIL BERKAS */}
                          <TableCell className="font-semibold">
                            {item.no_berkas || "-"}
                          </TableCell>

                          <TableCell>
                            <Badge variant="outline">
                              {item.nama_tahapan || "Belum diisi"}
                            </Badge>
                          </TableCell>

                          <TableCell>{item.anggaran_tahun ?? "-"}</TableCell>

                          <TableCell className="text-right font-semibold tabular-nums">
                            {formatRupiah(toNumber(item.anggaran))}
                          </TableCell>

                          <TableCell className="text-right tabular-nums">
                            {formatNumber(toNumber(item.target_luasan))}
                          </TableCell>

                          <TableCell>{item.skala || "-"}</TableCell>

                          <TableCell>{item.jenis_kontrak || "-"}</TableCell>

                          <TableCell className="max-w-[220px] whitespace-normal text-xs">
                            {item.nomor_kontrak || "-"}
                          </TableCell>

                          <TableCell className="max-w-[220px] whitespace-normal">
                            {item.penanggung_jawab || "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </React.Fragment>
                ));
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
          {Math.min(currentPage * pageSize, groupedData.length)} dari{" "}
          {groupedData.length.toLocaleString("id-ID")} kelompok
          provinsi-kegiatan. Total {filteredData.length.toLocaleString("id-ID")}{" "}
          berkas.
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
