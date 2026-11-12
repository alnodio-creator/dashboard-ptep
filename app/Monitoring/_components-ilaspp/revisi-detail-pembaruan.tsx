"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  CheckCircle2,
  MapPin,
  Search,
  RefreshCw,
  FileText,
  Wallet,
  Building2,
  ChartNoAxesCombined,
  AlertCircle,
  CalendarDays,
  Clock3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { basePath } from "@/constants/menu-sidebar";
import { formatRupiah } from "@/constants/auth-constants";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ======================================================
// TYPES
// ======================================================

type Tahapan = {
  tahapan_kegiatan_id: number;
  nama_tahapan: string;
  urutan: number;
  bobot: number;
  realisasi: number;
  target_titik: number;
  total_approved: number;
  sesuai: number;
  tidak_sesuai: number;
  belum_diperiksa: number;
  total_checklist: number;
  masuk_tahapan_at: string | null;
  keluar_tahapan_at: string | null;
  tgl_mulai_timeline: string | null;
  tgl_selesai_timeline: string | null;
  status_mulai: string | null;
  status_selesai: string | null;
};

type KabupatenDetail = {
  berkas_id: number;
  no_berkas: string;
  no_kontrak: string;
  kode_kegiatan: string;
  kabupaten: string;
  anggaran: number;
  nama_anggaran: string;
  nama_perusahaan: string | null;
  realisasi_fisik: number;
  skala: string;
  seluruh_tahapan_selesai: boolean;
  tahapan: Tahapan[];
};

type ContractItem = {
  kanwilid: string;
  Kanwil: string;
  kode_kegiatan: string;
  nama_kegiatan: string;

  anggaran: string | number;
  total_berkas: string | number;
  realisasi_fisik: string | number;
  seluruh_berkas_selesai: boolean;

  detail: KabupatenDetail[];
};

type ApiResponse = {
  success: boolean;
  message: string;
  total: number;
  data: ContractItem[];
};

type StatusFilter = "Filter Status" | "selesai" | "belum";
type AnggaranFilter = "Filter Anggaran" | "PHLN" | "APBN" | "APBD";

// ======================================================
// CONSTANTS
// ======================================================

const STAGE_POINT_IDS = new Set([3, 10, 17, 25]);
const FINISHED_STAGE_IDS = new Set([29, 30]);

// Jumlah Kantor Wilayah (kontrak) per halaman.
// Pagination per kontrak supaya rowSpan tetap utuh.
const PAGE_SIZE = 5;
const SEARCH_DEBOUNCE_MS = 400;

// ======================================================
// FORMATTER (dibuat SEKALI, bukan setiap panggilan)
// ======================================================

const numberFormatter = new Intl.NumberFormat("id-ID");

const percentFormatter = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

// ======================================================
// HELPERS
// ======================================================

function toNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatPercent(value: number) {
  return `${percentFormatter.format(value)}%`;
}

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return dateFormatter.format(date);
}

function getProgressColor(value: number) {
  if (value >= 100) return "bg-green-800";
  if (value >= 80) return "bg-green-600";
  if (value >= 60) return "bg-lime-500";
  if (value >= 40) return "bg-yellow-500";
  if (value >= 20) return "bg-orange-500";
  return "bg-red-500";
}

function getProgressTextColor(value: number) {
  if (value >= 100) return "text-green-800";
  if (value >= 80) return "text-green-700";
  if (value >= 60) return "text-lime-700";
  if (value >= 40) return "text-yellow-700";
  if (value >= 20) return "text-orange-700";
  return "text-red-600";
}

function clampProgress(value: number) {
  return Math.min(100, Math.max(0, value));
}

const STATUS_BADGE_CLASS: Record<string, string> = {
  TERLAMBAT:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400",
  "TEPAT WAKTU":
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400",
  "JADWAL BELUM TERSEDIA":
    "border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

const STATUS_BADGE_FALLBACK =
  "border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400";

// ======================================================
// HOOK: DEBOUNCE
// ======================================================

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

// ======================================================
// PROGRESS BAR
// ======================================================

const ProgressBar = memo(function ProgressBar({
  value,
  compact = false,
}: {
  value: number;
  compact?: boolean;
}) {
  return (
    <div className="min-w-27.5 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`font-bold tabular-nums ${getProgressTextColor(value)} ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          {formatPercent(value)}
        </span>

        {value >= 100 && (
          <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
        )}
      </div>

      <MiniBar value={value} className="h-2" />
    </div>
  );
});

// Bar tipis tanpa label. `transition-[width]` jauh lebih murah
// dibanding `transition-all` karena hanya menganimasikan lebar.
const MiniBar = memo(function MiniBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <div
      className={cn("w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ${getProgressColor(
          value,
        )}`}
        style={{ width: `${clampProgress(value)}%` }}
      />
    </div>
  );
});

// ======================================================
// STAGE CELL
// ======================================================

const TimelineRow = memo(function TimelineRow({
  label,
  deadline,
  actual,
  status,
  tone,
}: {
  label: string;
  deadline: string | null;
  actual: string | null;
  status: string | null;
  tone: "blue" | "emerald";
}) {
  const iconWrap =
    tone === "blue"
      ? "bg-blue-100 dark:bg-blue-950"
      : "bg-emerald-100 dark:bg-emerald-950";
  const iconColor = tone === "blue" ? "text-blue-600" : "text-emerald-600";

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`flex size-4 shrink-0 items-center justify-center rounded-full ${iconWrap}`}
      >
        <CalendarDays className={`size-2.5 ${iconColor}`} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] font-semibold">{label}</span>
          <span className="text-[9px] text-muted-foreground">
            Deadline: {formatDate(deadline)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-1">
          <span className="text-[9px] text-muted-foreground">
            {formatDate(actual)}
          </span>

          <Badge
            variant="outline"
            className={cn(
              "whitespace-nowrap px-1 py-0 text-[8px] font-medium leading-4",
              (status && STATUS_BADGE_CLASS[status]) || STATUS_BADGE_FALLBACK,
            )}
          >
            {status || "-"}
          </Badge>
        </div>
      </div>
    </div>
  );
});

const StageCell = memo(function StageCell({ stage }: { stage?: Tahapan }) {
  if (!stage) {
    return (
      <TableCell className="min-w-70 border-l text-center align-middle">
        <span className="text-xs text-muted-foreground">-</span>
      </TableCell>
    );
  }

  const value = toNumber(stage.realisasi);
  const isPointStage = STAGE_POINT_IDS.has(stage.tahapan_kegiatan_id);

  return (
    <TableCell className="min-w-60 border-l p-2 align-top">
      <div className="space-y-2">
        {/* PROGRESS */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-muted-foreground">
              Realisasi tahapan
            </span>
            <span className="text-[10px] font-semibold tabular-nums">
              Bobot {stage.bobot}%
            </span>
          </div>
          <ProgressBar value={value} compact />
        </div>

        {/* CAPAIAN */}
        {isPointStage ? (
          <div className="flex flex-col items-center justify-between gap-2 rounded-md border bg-muted/20 px-2 py-1.5">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">
                Titik disetujui / Target
              </span>
              <span className="font-bold tabular-nums">
                {formatNumber(toNumber(stage.total_approved))}/
                {formatNumber(toNumber(stage.target_titik))}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[10px]">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                ✓ {stage.sesuai} Sesuai
              </span>

              <span className="font-semibold text-red-600 dark:text-red-400">
                ✕ {stage.tidak_sesuai} Tidak sesuai
              </span>

              <span className="font-semibold text-muted-foreground">
                {stage.sesuai}/{stage.total_checklist} Keseluruhan
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            <div className="rounded border bg-emerald-50/70 px-1 py-1 text-center dark:bg-emerald-950/20">
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {stage.sesuai}
              </p>
              <p className="text-[9px] text-muted-foreground">Sesuai</p>
            </div>

            <div className="rounded border bg-red-50/70 px-1 py-1 text-center dark:bg-red-950/20">
              <p className="text-xs font-bold text-red-700 dark:text-red-400">
                {stage.tidak_sesuai}
              </p>
              <p className="text-[9px] text-muted-foreground">Tidak sesuai</p>
            </div>

            <div className="rounded border bg-blue-50/70 px-1 py-1 text-center dark:bg-blue-950/20">
              <p className="text-xs font-bold text-blue-700 dark:text-blue-400">
                {stage.sesuai}/{stage.total_checklist}
              </p>
              <p className="text-[9px] text-muted-foreground">Keseluruhan</p>
            </div>
          </div>
        )}

        {/* TIMELINE */}
        <div className="space-y-1.5 border-t pt-2">
          <p className="text-[9px] font-bold tracking-wide text-muted-foreground">
            TIMELINE TAHAPAN
          </p>

          <TimelineRow
            label="Mulai"
            deadline={stage.tgl_mulai_timeline}
            actual={stage.masuk_tahapan_at}
            status={stage.status_mulai}
            tone="blue"
          />

          <TimelineRow
            label="Selesai"
            deadline={stage.tgl_selesai_timeline}
            actual={stage.keluar_tahapan_at}
            status={stage.status_selesai}
            tone="emerald"
          />
        </div>
      </div>
    </TableCell>
  );
});

// ======================================================
// SUMMARY CARD
// ======================================================

const SummaryCard = memo(function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>

          <p className="mt-2 truncate text-lg font-bold tracking-tight sm:text-xl">
            {value}
          </p>

          <p className="mt-1 text-[11px] text-muted-foreground">
            {description}
          </p>
        </div>

        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${color}`}
        >
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
});

// ======================================================
// KANWIL CELL (kolom kiri, rowSpan)
// ======================================================

const KanwilCell = memo(function KanwilCell({
  contract,
  rowSpan,
  number,
}: {
  contract: ContractItem;
  rowSpan: number;
  number: number;
}) {
  const realisasi = toNumber(contract.realisasi_fisik);

  return (
    <>
      <TableCell
        rowSpan={rowSpan}
        className="sticky left-0 z-20 border-r bg-background text-center align-middle font-bold"
      >
        {number}
      </TableCell>

      <TableCell
        rowSpan={rowSpan}
        className="min-w-52 border-r bg-background align-middle"
      >
        <div className="min-w-52 space-y-2">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 shrink-0 text-blue-600" />
            <span className="text-sm font-bold">{contract.Kanwil}</span>
          </div>

          <Badge variant="outline" className="text-[10px]">
            {contract.total_berkas} Berkas
          </Badge>

          <div className="pt-2">
            <p className="text-[10px] text-muted-foreground">Nama Kegiatan</p>
            <p className="break-all text-xs font-semibold">
              {contract.nama_kegiatan}
            </p>
          </div>

          <div>
            <p className="text-[10px] text-muted-foreground">Anggaran</p>
            <p className="text-xs font-bold tabular-nums">
              {formatRupiah(toNumber(contract.anggaran))}
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] text-muted-foreground">
                Realisasi Fisik Kantor Wilayah
              </p>

              <span
                className={`text-xs font-bold tabular-nums ${getProgressTextColor(
                  realisasi,
                )}`}
              >
                {contract.realisasi_fisik != null
                  ? formatPercent(realisasi)
                  : "-"}
              </span>
            </div>

            <MiniBar value={realisasi} className="h-1.5" />
          </div>

          <div className="pt-2">
            <p className="mb-1.5 text-[10px] text-muted-foreground">
              Status Kegiatan
            </p>

            {contract.seluruh_berkas_selesai === true ? (
              <Badge className="gap-1.5 border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-50">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Seluruh Kabupaten Selesai
              </Badge>
            ) : (
              <Badge className="gap-1.5 border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 hover:bg-amber-50">
                <Clock3 className="h-3.5 w-3.5" />
                Masih dalam Proses
              </Badge>
            )}
          </div>
        </div>
      </TableCell>
    </>
  );
});

// ======================================================
// RECORD ROW (satu baris kabupaten)
// ======================================================

const RecordRow = memo(function RecordRow({
  record,
  stages,
  kanwilCell,
}: {
  record: KabupatenDetail;
  stages: Tahapan[];
  kanwilCell: React.ReactNode;
}) {
  // Map tahapan dibuat sekali per record, bukan di setiap render.
  const stageMap = useMemo(
    () =>
      new Map((record.tahapan ?? []).map((s) => [s.tahapan_kegiatan_id, s])),
    [record.tahapan],
  );

  const progress = toNumber(record.realisasi_fisik);

  return (
    <TableRow className="hover:bg-muted/30">
      {kanwilCell}

      {/* KABUPATEN */}
      <TableCell className="sticky left-14 z-20 min-w-52 border-r bg-background align-middle">
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{record.kabupaten || "-"}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              {record.skala || "-"}
            </Badge>

            <Badge variant="secondary" className="text-[10px]">
              {record.no_berkas || "-"}
            </Badge>

            <Badge variant="secondary" className="text-[10px]">
              {record.nama_anggaran || "-"}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={
                record.seluruh_tahapan_selesai
                  ? "gap-1.5 border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
                  : "gap-1.5 border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
              }
            >
              {record.seluruh_tahapan_selesai ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Clock3 className="h-3.5 w-3.5" />
              )}

              {record.seluruh_tahapan_selesai ? "Selesai" : "Dalam Proses"}
            </Badge>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground">Anggaran</span>

            <Badge
              variant="secondary"
              className="w-fit gap-1.5 border border-green-200 bg-green-50 px-2 py-1 text-[10px] font-semibold text-green-700 hover:bg-green-50"
            >
              <Wallet className="h-3 w-3" />
              {formatRupiah(toNumber(record.anggaran))}
            </Badge>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                Realisasi Fisik
              </span>

              <span
                className={`text-sm font-bold tabular-nums ${getProgressTextColor(
                  progress,
                )}`}
              >
                {formatPercent(progress)}
              </span>
            </div>

            <MiniBar value={progress} className="h-1.5" />
          </div>
        </div>
      </TableCell>

      {/* TAHAPAN */}
      {stages.map((definition) => (
        <StageCell
          key={definition.tahapan_kegiatan_id}
          stage={stageMap.get(definition.tahapan_kegiatan_id)}
        />
      ))}
    </TableRow>
  );
});

// ======================================================
// CONTRACT GROUP (semua baris satu Kantor Wilayah)
// ======================================================

const ContractGroup = memo(function ContractGroup({
  contract,
  number,
  stages,
}: {
  contract: ContractItem;
  number: number;
  stages: Tahapan[];
}) {
  const details = contract.detail ?? [];

  return (
    <>
      {details.map((record, index) => (
        <RecordRow
          key={`${contract.kanwilid}-${record.berkas_id}`}
          record={record}
          stages={stages}
          kanwilCell={
            index === 0 ? (
              <KanwilCell
                contract={contract}
                rowSpan={details.length}
                number={number}
              />
            ) : null
          }
        />
      ))}
    </>
  );
});

// ======================================================
// MAIN COMPONENT
// ======================================================

export default function DetailPresentasePembaruan() {
  // `searchInput` mengikuti ketikan (ringan, hanya re-render input),
  // `search` baru berubah setelah user berhenti mengetik.
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, SEARCH_DEBOUNCE_MS);

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("Filter Status");
  const [anggaranFilter, setAnggaranFilter] =
    useState<AnggaranFilter>("Filter Anggaran");

  // Halaman disimpan bersama kunci filter saat halaman itu dipilih.
  // Jika filter berubah, kunci tidak cocok → halaman otomatis kembali ke 1,
  // tanpa useEffect dan tanpa render ganda.
  const filterKey = `${search}|${statusFilter}|${anggaranFilter}`;
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const page = pageState.key === filterKey ? pageState.page : 1;

  const tableRef = useRef<HTMLDivElement>(null);
  const listTopRef = useRef<HTMLDivElement>(null);

  // ====================================================
  // FETCH
  // ====================================================

  const {
    data: contracts = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["monitoring-qc-berkas3"],

    queryFn: async (): Promise<ContractItem[]> => {
      const response = await fetch(`${basePath}/api/monitoring-qc-berkas3`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Gagal mengambil data. HTTP ${response.status}`);
      }

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Gagal mengambil data");
      }

      return result.data ?? [];
    },

    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!isLoading && tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isLoading]);

  // ====================================================
  // DEFINISI TAHAPAN
  // ====================================================

  const stages = useMemo(() => {
    const stageMap = new Map<number, Tahapan>();

    for (const contract of contracts) {
      for (const record of contract.detail ?? []) {
        for (const stage of record.tahapan ?? []) {
          if (FINISHED_STAGE_IDS.has(stage.tahapan_kegiatan_id)) continue;

          if (!stageMap.has(stage.tahapan_kegiatan_id)) {
            stageMap.set(stage.tahapan_kegiatan_id, stage);
          }
        }
      }
    }

    return Array.from(stageMap.values()).sort((a, b) => a.urutan - b.urutan);
  }, [contracts]);

  // ====================================================
  // INDEX PENCARIAN
  // Dihitung sekali saat data berubah, jadi saat filter
  // cukup satu `includes` per baris (bukan 6x normalize).
  // ====================================================

  const searchIndex = useMemo(() => {
    const kanwilText = new Map<string, string>();
    const recordText = new Map<number, string>();

    for (const contract of contracts) {
      kanwilText.set(
        contract.kanwilid,
        `${normalize(contract.Kanwil)} ${normalize(contract.kanwilid)}`,
      );

      for (const record of contract.detail ?? []) {
        recordText.set(
          record.berkas_id,
          [
            record.kabupaten,
            record.no_berkas,
            record.no_kontrak,
            record.skala,
            record.nama_perusahaan,
          ]
            .map(normalize)
            .join(" "),
        );
      }
    }

    return { kanwilText, recordText };
  }, [contracts]);

  // ====================================================
  // FILTER
  // ====================================================

  const filteredContracts = useMemo(() => {
    const keyword = normalize(search);
    const anggaranKeyword =
      anggaranFilter === "Filter Anggaran" ? "" : normalize(anggaranFilter);

    const result: ContractItem[] = [];

    for (const contract of contracts) {
      const kanwilMatch =
        !!keyword &&
        (searchIndex.kanwilText.get(contract.kanwilid) ?? "").includes(keyword);

      const detail = (contract.detail ?? []).filter((record) => {
        if (statusFilter === "selesai" && !record.seluruh_tahapan_selesai) {
          return false;
        }
        if (statusFilter === "belum" && record.seluruh_tahapan_selesai) {
          return false;
        }

        if (
          anggaranKeyword &&
          !normalize(record.nama_anggaran).includes(anggaranKeyword)
        ) {
          return false;
        }

        if (!keyword || kanwilMatch) return true;

        return (searchIndex.recordText.get(record.berkas_id) ?? "").includes(
          keyword,
        );
      });

      if (detail.length > 0) result.push({ ...contract, detail });
    }

    return result;
  }, [contracts, searchIndex, search, statusFilter, anggaranFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredContracts.length / PAGE_SIZE),
  );
  const currentPage = Math.min(page, totalPages);

  const pagedContracts = useMemo(
    () =>
      filteredContracts.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
      ),
    [filteredContracts, currentPage],
  );

  const totalFilteredRows = useMemo(
    () => filteredContracts.reduce((sum, c) => sum + c.detail.length, 0),
    [filteredContracts],
  );

  const goToPage = (next: number) => {
    setPageState({ key: filterKey, page: next });
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ====================================================
  // SUMMARY
  // ====================================================

  const summary = useMemo(() => {
    let totalAnggaran = 0;
    let totalBerkas = 0;
    let totalSelesai = 0;
    let totalRealisasi = 0;
    const kabupatenSet = new Set<string>();

    for (const contract of contracts) {
      const details = contract.detail ?? [];

      totalAnggaran += toNumber(contract.anggaran);
      totalBerkas += details.length;
      totalRealisasi += toNumber(contract.realisasi_fisik) * details.length;

      for (const item of details) {
        if (item.seluruh_tahapan_selesai) totalSelesai++;

        const key = normalize(item.kabupaten);
        if (key) kabupatenSet.add(key);
      }
    }

    return {
      totalAnggaran,
      totalBerkas,
      totalSelesai,
      totalProses: totalBerkas - totalSelesai,
      totalKabupaten: kabupatenSet.size,
      realisasi: totalBerkas > 0 ? totalRealisasi / totalBerkas : 0,
    };
  }, [contracts]);

  // ====================================================
  // LOADING / ERROR
  // ====================================================

  if (isLoading) {
    return (
      <div className="flex min-h-62.5 flex-col items-center justify-center gap-3">
        <RefreshCw className="size-7 animate-spin text-blue-600" />
        <p className="text-sm text-muted-foreground">
          Mengambil seluruh data monitoring kontrak...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-62.5 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6">
        <AlertCircle className="size-9 text-red-500" />

        <div className="text-center">
          <p className="font-semibold">Gagal mengambil data monitoring</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {error instanceof Error
              ? error.message
              : "Terjadi kesalahan saat mengambil data"}
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 size-3.5" />
          Coba Lagi
        </Button>
      </div>
    );
  }

  const allDone =
    summary.totalBerkas > 0 && summary.totalSelesai === summary.totalBerkas;

  // Indikator "sedang menyaring" selama debounce berjalan
  const isTyping = searchInput !== search;

  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-blue-600" />
            <h3 className="text-base font-bold">
              Monitoring Realisasi Pembaruan Peta Nilai Tanah
            </h3>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Monitoring progres Kantor Wilayah, kabupaten, checklist, dan
            timeline Pembaruan Peta Nilai Tanah
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline">
              {formatNumber(contracts.length)} Kantor Wilayah
            </Badge>
            <Badge variant="outline">
              {formatNumber(summary.totalBerkas)} Berkas
            </Badge>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw
            className={`mr-2 size-3.5 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard
          title="Total Anggaran"
          value={formatRupiah(summary.totalAnggaran)}
          description="Akumulasi seluruh kontrak"
          icon={Wallet}
          color="bg-blue-100 text-blue-700"
        />
        <SummaryCard
          title="Total Berkas"
          value={formatNumber(summary.totalBerkas)}
          description={`${summary.totalSelesai} selesai · ${summary.totalProses} proses`}
          icon={FileText}
          color="bg-violet-100 text-violet-700"
        />
        <SummaryCard
          title="Kabupaten / Kota"
          value={formatNumber(summary.totalKabupaten)}
          description="Wilayah seluruh kontrak"
          icon={MapPin}
          color="bg-amber-100 text-amber-700"
        />
        <SummaryCard
          title="Realisasi Fisik"
          value={formatPercent(summary.realisasi)}
          description="Rata-rata berbobot jumlah berkas"
          icon={ChartNoAxesCombined}
          color="bg-emerald-100 text-emerald-700"
        />
      </div>

      {/* OVERALL PROGRESS */}
      <Card ref={tableRef} className="shadow-sm">
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">Progres Keseluruhan</p>
              <p className="text-xs text-muted-foreground">
                Akumulasi realisasi fisik seluruh berkas dari semua kontrak
              </p>
            </div>

            <Badge
              variant="outline"
              className={
                allDone
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-blue-200 bg-blue-50 text-blue-700"
              }
            >
              {allDone ? "Seluruh Berkas Selesai" : "Dalam Proses"}
            </Badge>
          </div>

          <ProgressBar value={summary.realisasi} />

          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>
              {summary.totalSelesai} dari {summary.totalBerkas} berkas selesai
            </span>
            <span>{summary.totalProses} berkas dalam proses</span>
          </div>
        </CardContent>
      </Card>

      {/* SEARCH & FILTER */}
      <div
        ref={listTopRef}
        className="flex scroll-mt-4 flex-col justify-between gap-3 sm:flex-row sm:items-center"
      >
        <div>
          <h4 className="font-bold">Rincian Capaian Kabupaten</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Perbandingan realisasi, checklist, dan timeline setiap tahapan
            seluruh kontrak.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:min-w-55 sm:flex-1">
            {isTyping ? (
              <RefreshCw className="absolute left-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            ) : (
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            )}

            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Cari Kantor Wilayah, kontrak, kabupaten..."
              className="h-10 pl-9"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
          >
            <SelectTrigger className="h-10 w-full sm:w-40">
              <SelectValue placeholder="Status Tahapan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Filter Status">Filter Status</SelectItem>
              <SelectItem value="selesai">Selesai</SelectItem>
              <SelectItem value="belum">Belum Selesai</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={anggaranFilter}
            onValueChange={(value) =>
              setAnggaranFilter(value as AnggaranFilter)
            }
          >
            <SelectTrigger className="h-10 w-full sm:w-37.5">
              <SelectValue placeholder="Sumber Anggaran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Filter Anggaran">Filter Anggaran</SelectItem>
              <SelectItem value="PHLN">PHLN</SelectItem>
              <SelectItem value="APBN">APBN</SelectItem>
              <SelectItem value="APBD">APBD</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* TABLE */}
      <div
        className={cn(
          "w-full overflow-x-auto rounded-lg border bg-background transition-opacity",
          isTyping && "opacity-70",
        )}
      >
        <Table className="w-max min-w-full">
          <TableHeader>
            <TableRow className="bg-muted/70">
              <TableHead className="sticky left-0 z-30 min-w-14 border-r bg-muted text-center">
                No
              </TableHead>

              <TableHead className="min-w-52 border-r bg-muted">
                Kantor Wilayah
              </TableHead>

              <TableHead className="sticky left-14 z-30 min-w-52 border-r bg-muted">
                Kabupaten
              </TableHead>

              {stages.map((stage) => (
                <TableHead
                  key={stage.tahapan_kegiatan_id}
                  className="min-w-70 border-l text-center"
                >
                  <div className="whitespace-normal text-xs font-bold">
                    {stage.urutan}. {stage.nama_tahapan}
                  </div>

                  <div className="mt-1 text-[10px] font-normal text-muted-foreground">
                    Bobot {stage.bobot}%
                  </div>

                  {STAGE_POINT_IDS.has(stage.tahapan_kegiatan_id) && (
                    <Badge variant="secondary" className="mt-1 text-[9px]">
                      Capaian Titik
                    </Badge>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {pagedContracts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={stages.length + 3}
                  className="h-28 text-center text-muted-foreground"
                >
                  {contracts.length === 0
                    ? "Belum ada data kontrak."
                    : "Tidak ada data yang ditemukan."}
                </TableCell>
              </TableRow>
            ) : (
              pagedContracts.map((contract, index) => (
                <ContractGroup
                  key={contract.kanwilid}
                  contract={contract}
                  number={(currentPage - 1) * PAGE_SIZE + index + 1}
                  stages={stages}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* FOOTER + PAGINATION */}
      <div className="flex flex-col items-start justify-between gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center">
        <p>
          Menampilkan {formatNumber(totalFilteredRows)} berkas dari{" "}
          {formatNumber(summary.totalBerkas)} berkas. Total{" "}
          {formatNumber(filteredContracts.length)} kontrak.
        </p>

        {filteredContracts.length > PAGE_SIZE && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => goToPage(currentPage - 1)}
            >
              <ChevronLeft className="mr-1 size-3.5" />
              Sebelumnya
            </Button>

            <span className="tabular-nums">
              Halaman {currentPage} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => goToPage(currentPage + 1)}
            >
              Berikutnya
              <ChevronRight className="ml-1 size-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
