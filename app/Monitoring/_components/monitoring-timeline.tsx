"use client";

import { Fragment, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Clock3, RefreshCw, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ======================================================
// TYPES
// ======================================================

type TimelineRecord = {
  no_berkas: string;
  tgl_mulai: string;
  tgl_selesai: string;
  nama_kegiatan: string;
  Kabupaten: string | null;
  kontrak_id: number;
  berkas_id: string;
  step_no: string;
  tahapan_kegiatan_id: number;
  nama_tahapan: string;
  masuk_tahapan_at: string | null;
  keluar_tahapan_at: string | null;
  durasi_hari: number | null;
};

type TimelineResponse = {
  success: boolean;
  total: number;
  data: TimelineRecord[];
  message?: string;
};

type StageKey =
  | "persiapan"
  | "zonaAwal"
  | "survei"
  | "sampel"
  | "analisis"
  | "peta"
  | "selesai";

type StageDefinition = {
  key: StageKey;
  label: string;
  weight: number;
  match: (name: string) => boolean;
};

type StageResult = {
  key: StageKey;
  label: string;
  weight: number;
  targetStart: number;
  targetEnd: number;
  entry: string | null;
  exit: string | null;
  isCurrent: boolean;
  exists: boolean;
};

type FileTimeline = {
  noBerkas: string;
  kabupaten: string;
  kegiatan: string;
  start: string;
  end: string;
  duration: number;
  stages: StageResult[];
};

// ======================================================
// STAGE DEFINITIONS
// Urutan dan bobot harus berjumlah 100%.
// ======================================================

const STAGES: StageDefinition[] = [
  {
    key: "persiapan",
    label: "Persiapan",
    weight: 10,
    match: (name) => /persiapan/i.test(name),
  },
  {
    key: "zonaAwal",
    label: "Pembuatan Zona Awal",
    weight: 18,
    match: (name) => /zona awal/i.test(name),
  },
  {
    key: "survei",
    label: "Survei Batas",
    weight: 18,
    match: (name) => /survei batas/i.test(name),
  },
  {
    key: "sampel",
    label: "Pengumpulan Sampel",
    weight: 18,
    match: (name) => /sampel|sample/i.test(name),
  },
  {
    key: "analisis",
    label: "Analisis dan Pengolahan",
    weight: 26,
    match: (name) => /analisis|pengolahan|delineasi/i.test(name),
  },
  {
    key: "peta",
    label: "Penyajian Peta",
    weight: 5,
    match: (name) => /penyajian peta/i.test(name),
  },
  {
    key: "selesai",
    label: "Selesai",
    weight: 5,
    match: (name) => /^selesai$/i.test(name.trim()),
  },
];

const DAY_MS = 24 * 60 * 60 * 1000;

// ======================================================
// DATE HELPERS
// Perhitungan menggunakan tanggal UTC agar konsisten.
// ======================================================

function dateNumber(value: string | null | undefined): number | null {
  if (!value) return null;

  const time = new Date(value).getTime();

  return Number.isFinite(time) ? time : null;
}

function dateOnlyNumber(value: string): number {
  const time = dateNumber(value);

  if (time === null) return 0;

  const date = new Date(time);

  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";

  const time = dateNumber(value);

  if (time === null) return "—";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(time);
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";

  const time = dateNumber(value);

  if (time === null) return "—";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(time);
}

function formatDays(days: number): string {
  return `${new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 1,
  }).format(days)} hari`;
}

function getStageKey(name: string): StageKey | null {
  return STAGES.find((stage) => stage.match(name))?.key ?? null;
}

function getStageTarget(
  start: number,
  duration: number,
  weightBefore: number,
  weightAfter: number,
) {
  return {
    start: start + Math.round((duration * weightBefore) / 100) * DAY_MS,
    end: start + Math.round((duration * weightAfter) / 100) * DAY_MS,
  };
}

// ======================================================
// AGGREGATE: MANY HISTORY ROWS -> ONE FILE
// ======================================================

function aggregateFiles(records: TimelineRecord[]): FileTimeline[] {
  const grouped = new Map<string, TimelineRecord[]>();

  for (const record of records) {
    if (!record.no_berkas) continue;

    const current = grouped.get(record.no_berkas) ?? [];
    current.push(record);
    grouped.set(record.no_berkas, current);
  }

  return Array.from(grouped.entries())
    .map(([noBerkas, rows]) => {
      const ordered = [...rows].sort(
        (a, b) => Number(a.step_no) - Number(b.step_no),
      );

      const latest = ordered[ordered.length - 1];
      const startValue = dateOnlyNumber(latest.tgl_mulai);
      const endValue = dateOnlyNumber(latest.tgl_selesai);

      // Durasi kontrak memakai selisih tanggal, bukan jumlah inklusif.
      const duration = Math.max(0, (endValue - startValue) / DAY_MS);

      const currentKey = getStageKey(latest.nama_tahapan);

      let cumulativeWeight = 0;

      const stages: StageResult[] = STAGES.map((definition) => {
        const stageRows = ordered.filter(
          (row) => getStageKey(row.nama_tahapan) === definition.key,
        );

        const entryValues = stageRows
          .map((row) => dateNumber(row.masuk_tahapan_at))
          .filter((value): value is number => value !== null);

        const exitValues = stageRows
          .map((row) => dateNumber(row.keluar_tahapan_at))
          .filter((value): value is number => value !== null);

        const target = getStageTarget(
          startValue,
          duration,
          cumulativeWeight,
          cumulativeWeight + definition.weight,
        );

        cumulativeWeight += definition.weight;

        const isCurrent = stageRows.length > 0 && currentKey === definition.key;

        return {
          key: definition.key,
          label: definition.label,
          weight: definition.weight,
          targetStart: target.start,
          targetEnd: target.end,
          entry:
            entryValues.length > 0
              ? new Date(Math.min(...entryValues)).toISOString()
              : null,
          // Tahapan terakhir dianggap masih berjalan.
          // Timestamp keluar pada catatan terakhir belum dianggap
          // sebagai waktu selesai aktual.
          exit:
            stageRows.length > 0 && !isCurrent && exitValues.length > 0
              ? new Date(Math.max(...exitValues)).toISOString()
              : null,
          isCurrent,
          exists: stageRows.length > 0,
        };
      });

      return {
        noBerkas,
        kabupaten: latest.Kabupaten ?? "—",
        kegiatan: latest.nama_kegiatan,
        start: latest.tgl_mulai,
        end: latest.tgl_selesai,
        duration,
        stages,
      };
    })
    .sort((a, b) => a.noBerkas.localeCompare(b.noBerkas));
}

// ======================================================
// STATUS TIMELINE
// ======================================================

type StatusResult = {
  label: string;
  className: string;
};

function getEntryStatus(
  actual: string | null,
  target: number,
  exists: boolean,
): StatusResult {
  const now = Date.now();

  if (!actual) {
    if (now > target + 3 * DAY_MS) {
      return {
        label: "Belum masuk",
        className: "bg-red-100 text-red-800 border-red-200",
      };
    }

    if (now >= target - 3 * DAY_MS) {
      return {
        label: "Menunggu",
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
      };
    }

    return {
      label: exists ? "Tanpa tanggal" : "Belum masuk",
      className: "bg-slate-100 text-slate-600 border-slate-200",
    };
  }

  const actualTime = dateNumber(actual);

  if (actualTime === null) {
    return {
      label: "Tanpa tanggal",
      className: "bg-slate-100 text-slate-600 border-slate-200",
    };
  }

  const deviation = (actualTime - target) / DAY_MS;

  if (deviation <= 0) {
    return {
      label: "Sesuai",
      className: "bg-green-100 text-green-800 border-green-200",
    };
  }

  if (deviation <= 3) {
    return {
      label: `Terlambat ${deviation.toFixed(1)}h`,
      className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    };
  }

  return {
    label: `Terlambat ${Math.ceil(deviation)}h`,
    className: "bg-red-100 text-red-800 border-red-200",
  };
}

function getExitStatus(stage: StageResult): StatusResult {
  const now = Date.now();

  if (!stage.exists) {
    if (now > stage.targetEnd + 3 * DAY_MS) {
      return {
        label: "Belum masuk",
        className: "bg-red-100 text-red-800 border-red-200",
      };
    }

    return {
      label: "—",
      className: "bg-slate-100 text-slate-600 border-slate-200",
    };
  }

  if (stage.exit) {
    const actualTime = dateNumber(stage.exit);

    if (actualTime === null) {
      return {
        label: "Tanpa tanggal",
        className: "bg-slate-100 text-slate-600 border-slate-200",
      };
    }

    const deviation = (actualTime - stage.targetEnd) / DAY_MS;

    if (deviation <= 0) {
      return {
        label: "Sesuai",
        className: "bg-green-100 text-green-800 border-green-200",
      };
    }

    if (deviation <= 3) {
      return {
        label: `Terlambat ${deviation.toFixed(1)}h`,
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
      };
    }

    return {
      label: `Terlambat ${Math.ceil(deviation)}h`,
      className: "bg-red-100 text-red-800 border-red-200",
    };
  }

  // Tahapan masih berjalan: cek apakah target keluar terlewati.
  if (now > stage.targetEnd + 3 * DAY_MS) {
    return {
      label: "Terlambat",
      className: "bg-red-100 text-red-800 border-red-200",
    };
  }

  if (now >= stage.targetEnd - 3 * DAY_MS) {
    return {
      label: "Mendekati batas",
      className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    };
  }

  return {
    label: "Berjalan",
    className: "bg-green-100 text-green-800 border-green-200",
  };
}

function StatusBadge({ status }: { status: StatusResult }) {
  return (
    <Badge
      variant="outline"
      className={`whitespace-nowrap ${status.className}`}
    >
      {status.label}
    </Badge>
  );
}

// ======================================================
// MAIN TABLE
// ======================================================

export function MonitoringTimelineProd({
  kanwilid,
  kode_kegiatan,
}: {
  kanwilid: string;
  kode_kegiatan: string;
}) {
  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<TimelineResponse>({
    queryKey: ["timeline-berkas", kanwilid, kode_kegiatan],
    enabled: Boolean(kanwilid && kode_kegiatan),
    queryFn: async () => {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

      const url =
        `${basePath}/api/timeline-berkas` +
        `?kanwilid=${encodeURIComponent(kanwilid)}` +
        `&kode_kegiatan=${encodeURIComponent(kode_kegiatan)}`;

      console.time("1. Total fetch timeline");

      const response = await fetch(url);

      console.timeEnd("1. Total fetch timeline");

      if (!response.ok) {
        throw new Error(`Gagal mengambil data timeline: ${response.status}`);
      }

      console.time("2. Parsing JSON timeline");

      const result: TimelineResponse = await response.json();

      console.timeEnd("2. Parsing JSON timeline");

      console.log("Total baris API:", result.total);

      return result;
    },
  });

  const [search, setSearch] = useState("");

  const files = useMemo(
    () => aggregateFiles(response?.data ?? []),
    [response?.data],
  );

  const filteredFiles = useMemo(() => {
    const keyword = (search ?? "").trim().toLowerCase();

    if (!keyword) return files;

    return files.filter((file) =>
      [file.noBerkas, file.kabupaten, file.kegiatan].some((value) =>
        value.toLowerCase().includes(keyword),
      ),
    );
  }, [files, search]);

  const overdueCount = filteredFiles.filter((file) =>
    file.stages.some((stage) => {
      const entryStatus = getEntryStatus(
        stage.entry,
        stage.targetStart,
        stage.exists,
      );

      const exitStatus = getExitStatus(stage);

      return (
        entryStatus.className.includes("red-") ||
        exitStatus.className.includes("red-")
      );
    }),
  ).length;

  if (!kanwilid) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Pilih Kanwil terlebih dahulu untuk melihat timeline berkas.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full min-w-0 max-w-full overflow-hidden">
      <CardContent className="w-full min-w-0 space-y-4 p-3 sm:p-4 md:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold">Monitoring Timeline Berkas</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Perbandingan realisasi masuk dan keluar setiap tahapan terhadap
              target kontrak.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isLoading}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw
              className={`size-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">Total Berkas</p>
            <p className="mt-1 text-2xl font-bold">
              {files.length.toLocaleString("id-ID")}
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">Berkas Terlambat</p>
            <p className="mt-1 text-2xl font-bold text-red-600">
              {overdueCount.toLocaleString("id-ID")}
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">
              Berkas Sesuai Filter
            </p>
            <p className="mt-1 text-2xl font-bold">
              {filteredFiles.length.toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search ?? ""}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nomor berkas, kabupaten, kegiatan..."
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="size-4 animate-spin" />
            Memuat data timeline...
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error instanceof Error
              ? error.message
              : "Terjadi kesalahan saat mengambil data."}
          </div>
        ) : (
          <div className="w-full max-w-full min-w-0 overflow-x-auto overscroll-x-contain rounded-lg border">
            <Table className="w-max min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead
                    rowSpan={2}
                    className="sticky left-0 z-20 min-w-48 bg-background align-middle"
                  >
                    Berkas / Wilayah
                  </TableHead>

                  <TableHead colSpan={3} className="border-l text-center">
                    Kontrak
                  </TableHead>

                  {STAGES.map((stage) => (
                    <TableHead
                      key={stage.key}
                      colSpan={2}
                      className="min-w-64 border-l text-center"
                    >
                      <div>{stage.label}</div>
                      <div className="text-xs font-normal text-muted-foreground">
                        Bobot {stage.weight}%
                      </div>
                    </TableHead>
                  ))}
                </TableRow>

                <TableRow>
                  <TableHead className="min-w-28 border-l">Mulai</TableHead>
                  <TableHead className="min-w-28">Selesai</TableHead>
                  <TableHead className="min-w-24">Durasi</TableHead>

                  {STAGES.map((stage) => (
                    <Fragment key={stage.key}>
                      <TableHead className="min-w-36 border-l">Masuk</TableHead>

                      <TableHead className="min-w-36">Keluar</TableHead>
                    </Fragment>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredFiles.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3 + STAGES.length * 2 + 1}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Tidak ada data timeline.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFiles.map((file) => (
                    <TableRow key={file.noBerkas}>
                      <TableCell className="sticky left-0 z-10 min-w-48 bg-background align-top">
                        <p className="font-semibold">{file.noBerkas}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {file.kabupaten}
                        </p>
                        <p className="mt-1 max-w-48 text-xs text-muted-foreground">
                          {file.kegiatan}
                        </p>
                      </TableCell>

                      <TableCell className="border-l align-top text-xs">
                        {formatDate(file.start)}
                      </TableCell>

                      <TableCell className="align-top text-xs">
                        {formatDate(file.end)}
                      </TableCell>

                      <TableCell className="align-top text-xs font-semibold">
                        {formatDays(file.duration)}
                      </TableCell>

                      {file.stages.map((stage) => {
                        const entryStatus = getEntryStatus(
                          stage.entry,
                          stage.targetStart,
                          stage.exists,
                        );

                        const exitStatus = getExitStatus(stage);

                        return (
                          <Fragment key={`${file.noBerkas}-${stage.key}`}>
                            <TableCell className="border-l align-top">
                              <div className="space-y-2">
                                <StatusBadge status={entryStatus} />

                                <p className="whitespace-nowrap text-xs">
                                  {formatDateTime(stage.entry)}
                                </p>

                                <p className="whitespace-nowrap text-xs text-muted-foreground">
                                  Target:{" "}
                                  {formatDate(
                                    new Date(stage.targetStart).toISOString(),
                                  )}
                                </p>
                              </div>
                            </TableCell>

                            <TableCell className="align-top">
                              <div className="space-y-2">
                                <StatusBadge status={exitStatus} />

                                <p className="whitespace-nowrap text-xs">
                                  {stage.isCurrent && !stage.exit
                                    ? "Masih berjalan"
                                    : formatDateTime(stage.exit)}
                                </p>

                                <p className="whitespace-nowrap text-xs text-muted-foreground">
                                  Target:{" "}
                                  {formatDate(
                                    new Date(stage.targetEnd).toISOString(),
                                  )}
                                </p>
                              </div>
                            </TableCell>
                          </Fragment>
                        );
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-green-600" />
            Sesuai
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-yellow-500" />
            Mendekati batas
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-red-600" />
            Terlambat
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-slate-400" />
            Belum ada data
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
