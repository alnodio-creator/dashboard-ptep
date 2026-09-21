"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarDays,
  CheckCircle2,
  MapPin,
  BarChart3,
  Search,
} from "lucide-react";

type SelectKotaProps = {
  Kota?: string[];
  tahun?: number[];
  selectedKota?: string;
  selectedTahun?: number;
  setKota: (value: string) => void;
  setTahun: (value: number) => void;
};

export function SelectKota1({
  Kota = [],
  tahun = [],
  selectedKota,
  selectedTahun,
  setKota,
  setTahun,
}: SelectKotaProps) {
  const [searchKota, setSearchKota] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchKota);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchKota]);

  // Filter kota berdasarkan hasil debounce
  const filteredKota = Kota.filter((item) =>
    item.toLowerCase().includes(debouncedSearch.toLowerCase()),
  );

  return (
    <Card className="mb-5 h-full overflow-hidden border-border/50 bg-card shadow-sm transition-all duration-300 hover:shadow-md">
      <CardContent className="p-5 lg:p-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-200">
            <BarChart3 className="size-5" />
          </div>

          <div>
            <h3 className="text-base font-bold tracking-tight">Filter Data</h3>

            <p className="text-sm text-muted-foreground">
              Tentukan wilayah dan periode analisis
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="grid gap-5 md:grid-cols-2">
          {/* Kota */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="size-4 text-blue-600" />
              Local government area
            </label>

            <Select
              value={selectedKota}
              onValueChange={(value) => {
                if (value) {
                  setKota(value);
                }
              }}
              onOpenChange={(open) => {
                if (!open) {
                  setSearchKota("");
                  setDebouncedSearch("");
                }
              }}
            >
              <SelectTrigger
                className="
                  h-12
                  border-slate-200
                  bg-slate-50
                  px-4
                  font-semibold
                  text-slate-800
                  shadow-none
                  transition-all
                  hover:border-blue-300
                  hover:bg-blue-50/50
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                "
              >
                <SelectValue placeholder="Pilih Kota / Kabupaten" />
              </SelectTrigger>

              <SelectContent className="w-(--radix-select-trigger-width) p-0">
                {/* Search */}
                <div
                  className="sticky top-0 z-10 border-b bg-background p-2"
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                    <input
                      type="text"
                      value={searchKota}
                      onChange={(e) => setSearchKota(e.target.value)}
                      placeholder="Cari kota / kabupaten..."
                      className="
          h-10
          w-full
          rounded-md
          border
          border-slate-200
          bg-slate-50
          pl-9
          pr-3
          text-sm
          font-medium
          outline-none
          transition-colors
          placeholder:text-slate-400
          focus:border-blue-500
          focus:ring-2
          focus:ring-blue-100
        "
                    />
                  </div>
                </div>

                {/* List Kota */}
                <div className="max-h-70 overflow-y-auto p-1">
                  {filteredKota.length > 0 ? (
                    filteredKota.map((item, index) => (
                      <SelectItem
                        key={index}
                        value={item}
                        className="font-medium"
                      >
                        {item}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                      Kota / Kabupaten tidak ditemukan
                    </div>
                  )}
                </div>
              </SelectContent>
            </Select>
          </div>

          {/* Tahun */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="size-4 text-violet-600" />
              Base date
            </label>

            <Select
              value={selectedTahun?.toString()}
              onValueChange={(value) => setTahun(Number(value))}
            >
              <SelectTrigger
                className="
                  h-12
                  border-slate-200
                  bg-slate-50
                  px-4
                  font-semibold
                  text-slate-800
                  shadow-none
                  transition-all
                  hover:border-violet-300
                  hover:bg-violet-50/50
                  focus:border-violet-500
                  focus:ring-2
                  focus:ring-violet-100
                "
              >
                <SelectValue placeholder="Pilih Tahun" />
              </SelectTrigger>

              <SelectContent>
                {tahun.map((item) => (
                  <SelectItem
                    key={item}
                    value={item.toString()}
                    className="font-semibold"
                  >
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filter Summary */}
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="size-4" />
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Filter aktif
              </p>

              <p className="text-sm font-bold text-slate-800">
                {selectedKota || "Semua Wilayah"}
              </p>
            </div>
          </div>

          <div className="hidden h-8 w-px bg-slate-200 sm:block" />

          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
              <CalendarDays className="size-4" />
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Periode analisis
              </p>

              <p className="text-sm font-bold text-slate-800">
                Tahun {selectedTahun || "-"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
