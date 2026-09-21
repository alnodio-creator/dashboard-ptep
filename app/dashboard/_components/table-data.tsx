"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart3, Database, FileSearch, Loader2, Rows3 } from "lucide-react";
import { ReactNode } from "react";

export function DataTable({
  header,
  data,
  isLoading,
}: {
  header: string[];
  data: (string | number | ReactNode)[][];
  isLoading?: boolean;
}) {
  return (
    <Card className="overflow-hidden rounded-2xl border-border/50 bg-card shadow-sm">
      <CardContent className="p-0">
        {/* ================= HEADER ================= */}
        <div className="flex flex-col gap-4 border-b border-border/60 px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-6">
          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm dark:bg-blue-500/10 dark:text-blue-400">
              <Database className="size-5" />
            </div>

            <div>
              <h3 className="text-base font-bold tracking-tight">
                Data Nilai Tanah
              </h3>

              <p className="text-sm text-muted-foreground">
                Ringkasan data berdasarkan hasil analisis
              </p>
            </div>
          </div>

          {/* Data Information */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
              <Rows3 className="size-4 text-violet-600 dark:text-violet-400" />

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Total</span>

                <span className="text-sm font-bold">{data?.length ?? 0}</span>

                <span className="text-xs text-muted-foreground">data</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= TABLE ================= */}
        <div className="p-4 lg:p-5">
          <div className="overflow-hidden rounded-xl border border-border/60">
            <Table className="w-full">
              {/* Table Header */}
              <TableHeader className="bg-muted/50">
                <TableRow className="border-b border-border/70 hover:bg-transparent">
                  {header.map((column, index) => (
                    <TableHead
                      key={`th-${column}-${index}`}
                      className="
                        h-12
                        px-5
                        text-xs
                        font-bold
                        uppercase
                        tracking-wider
                        text-foreground
                      "
                    >
                      <div className="flex items-center gap-2">
                        {index === 0 ? (
                          <BarChart3 className="size-3.5 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                        )}

                        {column}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              {/* Table Body */}
              <TableBody>
                {/* Data */}
                {!isLoading &&
                  data?.map((row, rowIndex) => (
                    <TableRow
                      key={`tr-${rowIndex}`}
                      className="
                        border-b
                        border-border/50
                        transition-all
                        duration-200
                        hover:bg-blue-50/50
                        dark:hover:bg-blue-500/5
                      "
                    >
                      {row.map((column, columnIndex) => (
                        <TableCell
                          key={`tc-${rowIndex}-${columnIndex}`}
                          className="px-5 py-4 text-sm"
                        >
                          {column}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}

                {/* ================= EMPTY STATE ================= */}
                {data?.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={header.length} className="h-64">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                          <FileSearch className="size-7" />
                        </div>

                        <div className="text-center">
                          <p className="font-semibold">Data tidak ditemukan</p>

                          <p className="mt-1 text-sm text-muted-foreground">
                            Belum ada data yang tersedia untuk filter yang
                            dipilih.
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {/* ================= LOADING STATE ================= */}
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={header.length} className="h-64">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                          <Loader2 className="size-6 animate-spin" />
                        </div>

                        <div className="text-center">
                          <p className="font-semibold">Memuat data...</p>

                          <p className="mt-1 text-sm text-muted-foreground">
                            Sedang mengambil data nilai tanah.
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* ================= FOOTER ================= */}
        <div className="flex items-center justify-between border-t border-border/50 bg-muted/20 px-5 py-3 lg:px-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Database className="size-3.5" />
            <span>Data Nilai Tanah</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="size-2 rounded-full bg-emerald-500" />
            Data tersedia
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
