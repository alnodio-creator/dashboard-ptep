import { ReactNode } from "react";

import {
  Database,
  FileSpreadsheet,
  Rows3,
  Columns3,
  ChevronRight,
  TableProperties,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LIMIT_LISTS } from "@/constants/data-table-constant";
import PaginationDataTable from "@/components/commons/pagination-data-table";

export default function DataTableMonitoring({
  header,
  data,
  isLoading,
  totalPages,
  currentPage,
  currentLimit,
  totalData = 0,
  title = "Data Monitoring",
  description = "Data yang tersimpan pada database",
  onChangePage,
  onChangeLimit,
}: {
  header: string[];
  data: {
    data: (string | ReactNode)[];
    isAnomaly?: boolean;
  }[];
  isLoading?: boolean;
  totalPages: number;
  currentPage: number;
  currentLimit: number;
  totalData?: number;
  title?: string;
  description?: string;
  onChangePage: (page: number) => void;
  onChangeLimit: (limit: number) => void;
}) {
  return (
    <div className="w-full space-y-5">
      {/* ===================================================== */}
      {/* HEADER DASHBOARD */}
      {/* ===================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-200">
            <Database className="size-6" />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <div className="size-2 rounded-full bg-emerald-500" />

          <span className="text-xs font-semibold text-emerald-700">
            Database Connected
          </span>
        </div>
      </div>

      {/* ===================================================== */}
      {/* SUMMARY */}
      {/* ===================================================== */}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Total Data */}
        <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <Rows3 className="size-5" />
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Total Data
              </p>

              <p className="text-lg font-bold text-slate-900">
                {totalData.toLocaleString("id-ID")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total Columns */}
        <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
              <Columns3 className="size-5" />
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Total Columns
              </p>

              <p className="text-lg font-bold text-slate-900">
                {header.length}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Current Page */}
        <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <FileSpreadsheet className="size-5" />
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Current Page
              </p>

              <p className="text-lg font-bold text-slate-900">
                {currentPage}{" "}
                <span className="text-sm font-medium text-muted-foreground">
                  / {totalPages || 1}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===================================================== */}
      {/* TABLE CARD */}
      {/* ===================================================== */}

      <Card className="overflow-hidden border-slate-200 shadow-sm">
        {/* Table Header */}
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <TableProperties className="size-5" />
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-900">Data Table</h2>

                <p className="text-xs text-muted-foreground">
                  Menampilkan {data.length} data dari total{" "}
                  {totalData.toLocaleString("id-ID")} data
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2">
              <span className="text-xs font-medium text-muted-foreground">
                Rows
              </span>

              <span className="text-xs font-bold text-slate-800">
                {currentLimit}
              </span>
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* TABLE */}
        {/* ================================================= */}

        <div className="relative w-full">
          {/* Indikator kalau table bisa digeser */}
          <div className="pointer-events-none absolute right-3 top-3 z-20 flex items-center gap-1 rounded-full bg-slate-900/80 px-2 py-1 text-[10px] font-medium text-white shadow-sm md:hidden">
            Geser
            <ChevronRight className="size-3" />
          </div>

          <div
            className=" w-full
                        max-h-[520px]
                        overflow-x-auto
                        overflow-y-auto
                        scrollbar-thin
                        scrollbar-thumb-slate-300
                        scrollbar-track-slate-100"
          >
            <Table className="min-w-[1000px] text-sm">
              <TableHeader className="bg-slate-50">
                <TableRow className="border-b border-slate-200 hover:bg-transparent">
                  {header.map((column, index) => (
                    <TableHead
                      key={`th-${column}-${index}`}
                      className="
                        whitespace-nowrap
                        px-5
                        py-3.5
                        font-bold
                        text-slate-700
                      "
                    >
                      {column}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {/* LOADING */}
                {isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={header.length}
                      className="h-40 text-center"
                    >
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="size-7 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />

                        <div>
                          <p className="text-sm font-semibold text-slate-700">
                            Loading data...
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            Mengambil data dari database
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {/* DATA */}
                {!isLoading &&
                  data?.map((row, rowIndex) => (
                    <TableRow
                      key={`tr-${rowIndex}`}
                      className={`
        border-b
        transition-colors
        ${
          row.isAnomaly
            ? "border-red-200 bg-red-50 hover:bg-red-100"
            : "border-slate-100 hover:bg-blue-50/50"
        }
      `}
                    >
                      {row.data.map((column, columnIndex) => (
                        <TableCell
                          key={`tc-${rowIndex}-${columnIndex}`}
                          className={`
            whitespace-nowrap
            px-5
            py-3.5
            font-medium
            ${row.isAnomaly ? "text-red-800" : "text-slate-700"}
          `}
                        >
                          {column}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}

                {/* EMPTY */}
                {!isLoading && data?.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={header.length}
                      className="h-40 text-center"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <Database className="size-6" />
                        </div>

                        <p className="font-semibold text-slate-700">
                          No Result Data
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Tidak ada data yang dapat ditampilkan saat ini.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* ================================================= */}
        {/* KETERANGAN ANOMALI */}
        {/* ================================================= */}

        <div className="border-t border-red-200 bg-red-50 px-5 py-4">
          <p className="mb-2 text-sm font-bold text-red-800">
            Keterangan Data Anomali
          </p>

          <div className="space-y-1 text-xs text-red-700">
            <p>
              <span className="font-bold">ND-01</span> — Nomor SK belum
              tersedia.
            </p>

            <p>
              <span className="font-bold">ND-02</span> — Nomor SK kurang dari 5
              karakter.
            </p>

            <p>
              <span className="font-bold">ND-03</span> — Jumlah zona kurang dari
              30.
            </p>
          </div>
        </div>

        {/* ================================================= */}
        {/* TABLE FOOTER */}
        {/* ================================================= */}

        <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Limit */}
          <div className="flex items-center gap-3">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Rows per page
            </Label>

            <Select
              value={currentLimit.toString()}
              onValueChange={(value) => onChangeLimit(Number(value))}
            >
              <SelectTrigger className="h-9 w-[80px] border-slate-200 bg-white text-xs font-semibold">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Limit</SelectLabel>

                  {LIMIT_LISTS.map((limit) => (
                    <SelectItem
                      key={limit}
                      value={limit.toString()}
                      className="text-sm font-medium"
                    >
                      {limit}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="overflow-x-auto">
              <PaginationDataTable
                currentPage={currentPage}
                onChangePage={onChangePage}
                totalPages={totalPages}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
