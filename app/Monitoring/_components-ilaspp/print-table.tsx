"use client";

import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { CircleCheck, CircleX } from "lucide-react";

// ======================================================
// TYPES
// ======================================================

type Tahapan = {
  tahapan_kegiatan_id: number;
  nama_tahapan: string;
  urutan: number;
  bobot: number;
  realisasi: number | null;
  target_titik: number;
  total_approved: number;
  sesuai: number;
  tidak_sesuai: number;
  belum_diperiksa: number;
  total_checklist: number;
  std_sesuai: string | number;
  jumlah_zona: string | number;
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
  kode_kegiatan: string;
  skala: string;
  kabupaten: string;
  realisasi_fisik: number;
  seluruh_tahapan_selesai: boolean;
  tahapan: Tahapan[];
};

type ContractItem = {
  nama_perusahaan: string;
  no_kontrak: string;
  anggaran: number;
  kanwilid: string;
  total_berkas: number;
  realisasi_fisik: string | number;
  seluruh_berkas_selesai: boolean;
  detail: KabupatenDetail[];
};

// ======================================================
// CONSTANTS
// ======================================================

const STAGE_POINT_IDS = new Set([3, 10, 17, 25]);
const STAGE_POINT_IDS2 = new Set([4, 11, 18, 26]);

// Cetak: jumlah kolom tahapan per lembar.
// A3 landscape = 7. Jika pakai A4 landscape: ubah jadi 4 dan
// ganti `size: A3 landscape` pada PRINT_CSS menjadi `size: A4 landscape`.
const PRINT_STAGES_PER_PAGE = 7;

const TERMIN_CONFIG = [
  {
    label: "Termin I  Capaian (60 %)",
    start: 1,
    end: 4,
    background: "#dbeafe",
  },
  {
    label: "Termin II  Capaian (100%)",
    start: 5,
    end: 7,
    background: "#d1fae5",
  },
];

const PRINT_CSS = `
@page { size: A3 landscape; margin: 8mm; }

[data-print-root] { display: none; }

@media print {
  body > *:not([data-print-root]) { display: none !important; }
  [data-print-root] { display: block !important; }

  html, body {
    background: #fff !important;
    height: auto !important;
    overflow: visible !important;
  }

  * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .pt-section { break-after: page; page-break-after: always; }
  .pt-section:last-child { break-after: auto; page-break-after: auto; }

  .pt-table { width: 100%; table-layout: fixed; border-collapse: collapse; }
  .pt-table thead { display: table-header-group; }
  .pt-table tr { break-inside: avoid; page-break-inside: avoid; }
}
`;

// ======================================================
// FORMATTER (dibuat sekali, bukan di setiap panggilan)
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

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return dateFormatter.format(date);
}

const printCell: React.CSSProperties = {
  border: "1px solid #9ca3af",
  padding: "3px 4px",
  verticalAlign: "top",
  fontSize: 15,
  lineHeight: 1.3,
  overflowWrap: "anywhere",
};

function printStatusColor(status: string | null) {
  if (status === "TERLAMBAT") return "#b91c1c";
  if (status === "TEPAT WAKTU") return "#047857";
  return "#6b7280";
}

function PrintStageTd({ stage }: { stage?: Tahapan }) {
  if (!stage) {
    return <td style={{ ...printCell, textAlign: "center" }}>-</td>;
  }

  const isPoint = STAGE_POINT_IDS.has(stage.tahapan_kegiatan_id);
  const isZone = STAGE_POINT_IDS2.has(stage.tahapan_kegiatan_id);

  return (
    <td style={printCell}>
      <div style={{ fontWeight: 700 }}>
        {formatPercent(toNumber(stage.realisasi))}
      </div>

      {isPoint && (
        <div>
          Titik: {formatNumber(toNumber(stage.total_approved))}/
          {formatNumber(toNumber(stage.target_titik))}
        </div>
      )}

      {isZone && (
        <div>
          Zona: {formatNumber(toNumber(stage.std_sesuai))}/
          {formatNumber(toNumber(stage.jumlah_zona))}
        </div>
      )}

      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1 text-emerald-700">
          <CircleCheck className="h-4 w-4" />
          {stage.sesuai}
        </span>

        <span className="flex items-center gap-1 text-red-700">
          <CircleX className="h-4 w-4" />
          {stage.tidak_sesuai}
        </span>

        <span style={{ color: "#6b7280" }}>
          ({stage.sesuai}/{stage.total_checklist})
        </span>
      </div>
    </td>
  );
}

function PrintContractRows({
  contract,
  number,
  chunk,
  stageMaps,
}: {
  contract: ContractItem;
  number: number;
  chunk: Tahapan[];
  stageMaps: Map<number, Map<number, Tahapan>>;
}) {
  return (
    <>
      {/* Pita perusahaan */}
      <tr>
        <td
          colSpan={chunk.length + 1}
          style={{
            ...printCell,
            background: "#dbeafe",
            fontWeight: 700,
            fontSize: 17,
          }}
        >
          {number}. {contract.nama_perusahaan}
          <span style={{ fontWeight: 400 }}>
            {" "}
            . Kontrak: {contract.no_kontrak} · Pagu Anggaran: Rp
            {toNumber(contract.anggaran).toLocaleString("id-ID")},-
          </span>
          <span
            style={{
              color: "#15803d",
              fontWeight: 800,
              fontSize: 17,
              marginLeft: 4,
            }}
          >
            · Realisasi Fisik:{" "}
            {formatPercent(toNumber(contract.realisasi_fisik))}
          </span>
        </td>
      </tr>

      {(contract.detail ?? []).map((record) => (
        <tr key={`${contract.no_kontrak}-${record.berkas_id}`}>
          <td style={printCell}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              {record.kabupaten || "-"}
            </div>
            <div>
              {record.skala || "-"} · {record.no_berkas || "-"}
            </div>
            <div>
              {record.seluruh_tahapan_selesai ? "Selesai" : "Dalam Proses"} ·
              <b>{formatPercent(toNumber(record.realisasi_fisik))}</b>
            </div>
          </td>

          {chunk.map((s) => (
            <PrintStageTd
              key={s.tahapan_kegiatan_id}
              stage={stageMaps
                .get(record.berkas_id)
                ?.get(s.tahapan_kegiatan_id)}
            />
          ))}
        </tr>
      ))}
    </>
  );
}

export default function PrintTable({
  contracts,
  stages,
  onDone,
}: {
  contracts: ContractItem[];
  stages: Tahapan[];
  onDone: () => void;
}) {
  const chunks = useMemo(() => {
    const result: Tahapan[][] = [];
    for (let i = 0; i < stages.length; i += PRINT_STAGES_PER_PAGE) {
      result.push(stages.slice(i, i + PRINT_STAGES_PER_PAGE));
    }
    return result.length ? result : [[]];
  }, [stages]);

  const stageMaps = useMemo(() => {
    const m = new Map<number, Map<number, Tahapan>>();
    for (const c of contracts) {
      for (const r of c.detail ?? []) {
        m.set(
          r.berkas_id,
          new Map((r.tahapan ?? []).map((s) => [s.tahapan_kegiatan_id, s])),
        );
      }
    }
    return m;
  }, [contracts]);

  useEffect(() => {
    const done = () => onDone();
    window.addEventListener("afterprint", done);

    // dua frame agar DOM portal sudah ter-render sebelum dialog cetak
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => window.print());
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.removeEventListener("afterprint", done);
    };
  }, [onDone]);

  const printedAt = dateFormatter.format(new Date());

  return createPortal(
    <div
      data-print-root
      style={{ color: "#111", fontFamily: "Arial, sans-serif" }}
    >
      <style>{PRINT_CSS}</style>

      {chunks.map((chunk, ci) => {
        const first = chunk[0];
        const last = chunk[chunk.length - 1];

        return (
          <section key={ci} className="pt-section">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 6,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                Monitoring Realisasi Kegiatan ILASPP
                {first && last && (
                  <span style={{ fontWeight: 400 }}>
                    — Tahapan {first.urutan}
                    {last !== first ? `–${last.urutan}` : ""}
                  </span>
                )}
              </div>

              <div style={{ fontSize: 10, color: "#4b5563" }}>
                Bagian {ci + 1}/{chunks.length} · Dicetak {printedAt}
              </div>
            </div>

            <table className="pt-table">
              <colgroup>
                <col style={{ width: "17%" }} />
                {chunk.map((s) => (
                  <col key={s.tahapan_kegiatan_id} />
                ))}
              </colgroup>

              <thead>
                {/* BARIS PERTAMA: HEADER TERMIN */}
                <tr>
                  <th
                    rowSpan={2}
                    style={{
                      ...printCell,
                      background: "#e5e7eb",
                      textAlign: "left",
                      verticalAlign: "middle",
                    }}
                  >
                    Kabupaten / Berkas
                  </th>

                  {TERMIN_CONFIG.map((termin) => {
                    // Ambil tahapan yang masuk ke termin berdasarkan urutan
                    const terminStages = chunk.filter(
                      (s) => s.urutan >= termin.start && s.urutan <= termin.end,
                    );

                    // Jangan tampilkan termin jika tidak ada tahapannya
                    if (terminStages.length === 0) return null;

                    return (
                      <th
                        key={termin.label}
                        colSpan={terminStages.length}
                        style={{
                          ...printCell,
                          background: termin.background,
                          textAlign: "center",
                          verticalAlign: "middle",
                          fontSize: 17,
                          padding: "6px 4px",
                        }}
                      >
                        {termin.label}
                      </th>
                    );
                  })}

                  {/* Untuk tahapan di luar termin 1–7 */}
                  {chunk
                    .filter((s) => s.urutan < 1 || s.urutan > 7)
                    .map((s) => (
                      <th
                        key={`extra-${s.tahapan_kegiatan_id}`}
                        rowSpan={2}
                        style={{
                          ...printCell,
                          background: "#e5e7eb",
                          textAlign: "center",
                          verticalAlign: "middle",
                        }}
                      >
                        {s.urutan}. {s.nama_tahapan}
                        <div style={{ fontWeight: 400 }}>Bobot {s.bobot}%</div>
                      </th>
                    ))}
                </tr>

                {/* BARIS KEDUA: HEADER MASING-MASING TAHAPAN */}
                <tr>
                  {chunk
                    .filter((s) => s.urutan >= 1 && s.urutan <= 7)
                    .map((s) => (
                      <th
                        key={s.tahapan_kegiatan_id}
                        style={{
                          ...printCell,
                          background: "#f3f4f6",
                          textAlign: "center",
                          verticalAlign: "middle",
                        }}
                      >
                        {s.urutan}. {s.nama_tahapan}
                        <div style={{ fontWeight: 400 }}>Bobot {s.bobot}%</div>
                      </th>
                    ))}
                </tr>
              </thead>

              <tbody>
                {contracts.map((contract, idx) => (
                  <PrintContractRows
                    key={contract.no_kontrak}
                    contract={contract}
                    number={idx + 1}
                    chunk={chunk}
                    stageMaps={stageMaps}
                  />
                ))}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>,
    document.body,
  );
}
