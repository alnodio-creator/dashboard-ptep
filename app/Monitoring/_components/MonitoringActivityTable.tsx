import { useState } from "react";
import { Kegiatan } from "../types/type";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, FileSpreadsheet } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/constants/auth-constants";
import { formatNumber } from "@/data/land-values";
import { toNumber } from "./chart-monitoring";

const PAGE_SIZE = 10;

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function MonitoringActivityTable({
  data,
  title,
}: {
  data: Kegiatan[];
  title: string;
}) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));

  const currentPage = Math.min(page, totalPages);

  const paginatedData = data.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

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

  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      <div className="flex flex-col justify-between gap-3 border-b bg-muted/20 p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <FileSpreadsheet className="size-5" />
          </div>

          <div>
            <h3 className="font-bold">{title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {data.length.toLocaleString("id-ID")} berkas ditemukan
            </p>
          </div>
        </div>

        <Badge variant="outline">
          Halaman {currentPage} dari {totalPages}
        </Badge>
      </div>

      <div className="max-h-[580px] overflow-auto">
        <Table className="min-w-[1500px]">
          <TableHeader className="sticky top-0 z-10 bg-muted">
            <TableRow>
              <TableHead className="px-4">No.</TableHead>
              <TableHead>No. Berkas</TableHead>
              <TableHead>Wilayah</TableHead>
              <TableHead>Kabupaten/Kota</TableHead>
              <TableHead>Kegiatan</TableHead>
              <TableHead>Tahapan</TableHead>
              <TableHead>Tahun</TableHead>
              <TableHead>Sumber</TableHead>
              <TableHead className="text-right">Anggaran</TableHead>
              <TableHead className="text-right">Target Luasan</TableHead>
              <TableHead>Skala</TableHead>
              <TableHead>Jenis Kontrak</TableHead>
              <TableHead>No. Kontrak</TableHead>
              <TableHead>Penanggung Jawab</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={14}
                  className="h-32 text-center text-muted-foreground"
                >
                  Tidak ada data yang sesuai dengan filter.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item, index) => (
                <TableRow
                  key={`${item.no_berkas}-${index}`}
                  className="hover:bg-muted/30"
                >
                  <TableCell className="px-4 text-muted-foreground">
                    {(currentPage - 1) * PAGE_SIZE + index + 1}
                  </TableCell>

                  <TableCell className="font-semibold">
                    {item.no_berkas || "-"}
                  </TableCell>

                  <TableCell>{item.nama || "-"}</TableCell>

                  <TableCell>{item.Kabupaten || "-"}</TableCell>

                  <TableCell className="max-w-[260px] whitespace-normal">
                    {item.nama_kegiatan || "-"}
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline">
                      {item.nama_tahapan || "Belum diisi"}
                    </Badge>
                  </TableCell>

                  <TableCell>{item.anggaran_tahun ?? "-"}</TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={sumberClass(item.nama_anggaran)}
                    >
                      {item.nama_anggaran || "Belum Diisi"}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatRupiah(toNumber(item.anggaran))}
                  </TableCell>

                  <TableCell className="text-right tabular-nums">
                    {formatNumber(toNumber(item.target_luasan))}
                  </TableCell>

                  <TableCell>{item.skala || "-"}</TableCell>

                  <TableCell>{item.jenis_kontrak || "-"}</TableCell>

                  <TableCell>{item.nomor_kontrak || "-"}</TableCell>

                  <TableCell>{item.penanggung_jawab || "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Menampilkan{" "}
          {data.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
          {"–"}
          {Math.min(currentPage * PAGE_SIZE, data.length)} dari{" "}
          {data.length.toLocaleString("id-ID")} data
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
