import { NextRequest, NextResponse } from "next/server";
import { prismaPenilaianTanah } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ============================================
// TYPE DATA
// ============================================

export type TahapanRealisasi = {
  tahapan_kegiatan_id: number;
  nama_tahapan: string;
  urutan: number;
  bobot: number;
  total_checklist: number;
  sesuai: number;
  tidak_sesuai: number;
  belum_diperiksa: number;
  target_titik: number | null;
  total_approved: number | null;
  realisasi: number | null;

  // TIMELINE
  masuk_tahapan_at: string | null;
  keluar_tahapan_at: string | null;
  tgl_mulai_timeline: string | null;
  tgl_selesai_timeline: string | null;
  status_mulai: string | null;
  status_selesai: string | null;
};

export type DetailBerkas = {
  berkas_id: number;
  no_berkas: string;
  kode_kegiatan: string;
  skala: string;
  kabupaten: string;
  realisasi_fisik: number;
  seluruh_tahapan_selesai: boolean;
  tahapan: TahapanRealisasi[];
};

export type MonitoringRealisasiKontrak = {
  nama_perusahaan: string;
  no_kontrak: string;
  anggaran: number;
  kanwilid: string;
  total_berkas: number;
  realisasi_fisik: number;
  seluruh_berkas_selesai: boolean;
  detail: DetailBerkas[];
};

// ============================================
// GET API
// ============================================

export async function GET(request: NextRequest) {
  try {
    const data = await prismaPenilaianTanah.$queryRaw<
      MonitoringRealisasiKontrak[]
    >`

      WITH stage_config AS (
          SELECT
              tk.kode AS kode_kegiatan,
              tk.tahapan_kegiatan_id,
              tk.nama_tahapan,
              tk.bobot,
              tk.ord
          FROM tatausaha.tahapan_kegiatan tk
      ),

      -- ============================================
      -- 1. DAFTAR BERKAS
      -- ============================================

      berkas_list AS (
          SELECT DISTINCT
              b.berkas_id,
              b.no_berkas,
              k.kode_kegiatan,
              k.tgl_mulai AS tgl_mulai_kontrak,
              k.tgl_selesai AS tgl_selesai_kontrak,
              k.skala,
              k.anggaran,
              kk.nomor_kontrak,
              kk.nama_perusahaan,
              zmwk.namakantor,
              kl.nama AS kabupaten,
              zmwk.kantorid AS kanwilid

          FROM tatausaha.berkas b

          INNER JOIN tatausaha.kegiatan k
              ON b.kontrak_id = k.kegiatan_id

          INNER JOIN tatausaha.kegiatan_lokasi kl
              ON k.kegiatan_id = kl.kegiatan_id

          INNER JOIN tatausaha.kegiatan_kontrak kk
              ON k.kegiatan_id = kk.kegiatan_id

          INNER JOIN dashboard.znt_master_kantor zmk
              ON zmk.kode = kl.wilayah_id

          INNER JOIN dashboard.znt_master_wilayah_kantor zmwk
              ON zmwk.kantorid = zmk.induk

          WHERE
              k.tgl_mulai >= DATE_TRUNC('year', CURRENT_DATE)

              AND k.tgl_mulai < DATE_TRUNC('year', CURRENT_DATE)
                  + INTERVAL '1 year'

              AND b.no_berkas <> '01/2026/0071'

              AND k.nama_anggaran = 'PHLN'
      ),

      -- ============================================
      -- 2. CHECKLIST TERBARU
      -- ============================================

      latest_checklist AS (
          SELECT DISTINCT ON (
              fc.berkas_id,
              fc.master_checklist_id
          )
              fc.berkas_id,
              fc.master_checklist_id,
              fc.status_kesesuaian,
              fc.catatan,
              fc.created_at

          FROM tatausaha.form_checklist fc

          ORDER BY
              fc.berkas_id,
              fc.master_checklist_id,
              fc.created_at DESC,
              fc.form_checklist_id DESC
      ),

      -- ============================================
      -- 3. HISTORY TIMELINE
      -- ============================================

      history_timeline AS (
          SELECT DISTINCT ON (
              vhtd.berkas_id,
              vhtd.nama_tahapan
          )
              vhtd.berkas_id,
              vhtd.nama_tahapan,
              vhtd.masuk_tahapan_at,
              vhtd.keluar_tahapan_at,
              vhtd.tahapan_kegiatan_id

          FROM tatausaha.v_history_timeline_durasi vhtd

          INNER JOIN berkas_list bl
              ON bl.berkas_id = vhtd.berkas_id

          ORDER BY
              vhtd.berkas_id,
              vhtd.nama_tahapan,
              vhtd.tahapan_kegiatan_id ASC,
              vhtd.masuk_tahapan_at ASC
      ),

      -- ============================================
      -- 4. TIMELINE + JADWAL PER TAHAPAN
      -- ============================================

      timeline_detail AS (
          SELECT
              ht.berkas_id,
              ht.tahapan_kegiatan_id,
              ht.masuk_tahapan_at,
              ht.keluar_tahapan_at,
              kt.tgl_mulai AS tgl_mulai_timeline,
              kt.tgl_selesai AS tgl_selesai_timeline,

              CASE
                  WHEN ht.masuk_tahapan_at IS NULL
                      THEN 'BELUM DIMULAI'

                  WHEN kt.tgl_mulai IS NULL
                      THEN 'JADWAL BELUM TERSEDIA'

                  WHEN ht.masuk_tahapan_at::DATE <= kt.tgl_mulai::DATE
                      THEN 'TEPAT WAKTU'

                  ELSE 'TERLAMBAT'
              END AS status_mulai,

              CASE
                  WHEN ht.keluar_tahapan_at IS NULL
                      THEN 'BELUM SELESAI'

                  WHEN kt.tgl_selesai IS NULL
                      THEN 'JADWAL BELUM TERSEDIA'

                  WHEN ht.keluar_tahapan_at::DATE <= kt.tgl_selesai::DATE
                      THEN 'TEPAT WAKTU'

                  ELSE 'TERLAMBAT'
              END AS status_selesai

          FROM history_timeline ht

          LEFT JOIN tatausaha.kegiatan_timeline kt
              ON ht.tahapan_kegiatan_id = kt.tahapan_kegiatan_id
              AND ht.berkas_id = kt.berkas_id
      ),

      -- ============================================
      -- 5. STATISTIK CHECKLIST DAN TITIK SAMPEL
      -- ============================================

      stage_stats AS (
          SELECT
              bl.berkas_id,
              bl.no_berkas,
              bl.kode_kegiatan,
              bl.skala,
              bl.anggaran,
              bl.nomor_kontrak,
              bl.nama_perusahaan,
              bl.namakantor,
              bl.kabupaten,
              bl.kanwilid,

              vcp.target_titik,
              vcp.total_approved,

              sc.tahapan_kegiatan_id,
              sc.nama_tahapan,
              sc.bobot,
              sc.ord,

              COUNT(mc.master_checklist_id)::INT
                  AS total_checklist,

              COUNT(mc.master_checklist_id) FILTER (
                  WHERE UPPER(TRIM(lc.status_kesesuaian)) = 'SESUAI'
              )::INT AS sesuai,

              COUNT(mc.master_checklist_id) FILTER (
                  WHERE UPPER(TRIM(lc.status_kesesuaian)) = 'TIDAK_SESUAI'
              )::INT AS tidak_sesuai,

              COUNT(mc.master_checklist_id) FILTER (
                  WHERE lc.master_checklist_id IS NULL
              )::INT AS belum_diperiksa

          FROM berkas_list bl

          INNER JOIN stage_config sc
              ON sc.kode_kegiatan = bl.kode_kegiatan

          LEFT JOIN tatausaha.master_checklist mc
              ON mc.tahapan_kegiatan_id = sc.tahapan_kegiatan_id
              AND mc.is_required = TRUE
              AND mc.is_aktif = TRUE

          LEFT JOIN latest_checklist lc
              ON lc.berkas_id = bl.berkas_id
              AND lc.master_checklist_id = mc.master_checklist_id

          LEFT JOIN tatausaha.v_combined_progress vcp
              ON bl.no_berkas = vcp.no_berkas

          GROUP BY
              bl.berkas_id,
              bl.no_berkas,
              bl.kode_kegiatan,
              bl.skala,
              bl.anggaran,
              bl.nomor_kontrak,
              bl.nama_perusahaan,
              bl.namakantor,
              bl.kabupaten,
              bl.kanwilid,
              vcp.target_titik,
              vcp.total_approved,
              sc.tahapan_kegiatan_id,
              sc.nama_tahapan,
              sc.bobot,
              sc.ord
      ),

      -- ============================================
      -- 6. REALISASI SETIAP TAHAPAN
      -- ============================================

      stage_progress AS (
          SELECT
              *,

              CASE
                  WHEN tahapan_kegiatan_id IN (3, 10, 17, 25)
                      AND total_checklist > 0
                      AND COALESCE(target_titik, 0) > 0

                  THEN ROUND(
                      (
                          (
                              sesuai::NUMERIC
                              / NULLIF(total_checklist, 0) * 0.5
                          )
                          +
                          (
                              COALESCE(total_approved, 0)::NUMERIC
                              / NULLIF(target_titik, 0)::NUMERIC * 0.5
                          )
                      ) * 100,
                      2
                  )

                  WHEN total_checklist > 0

                  THEN ROUND(
                      sesuai::NUMERIC
                      / NULLIF(total_checklist, 0)
                      * 100,
                      2
                  )

                  ELSE 0
              END AS realisasi

          FROM stage_stats
      ),

      -- ============================================
      -- 7. GABUNGKAN REALISASI + TIMELINE
      -- ============================================

      stage_with_timeline AS (
          SELECT
              sp.*,
              td.masuk_tahapan_at,
              td.keluar_tahapan_at,
              td.tgl_mulai_timeline,
              td.tgl_selesai_timeline,
              td.status_mulai,
              td.status_selesai

          FROM stage_progress sp

          LEFT JOIN timeline_detail td
              ON td.berkas_id = sp.berkas_id
              AND td.tahapan_kegiatan_id = sp.tahapan_kegiatan_id
      ),

      -- ============================================
      -- 8. REALISASI FISIK PER BERKAS
      -- ============================================

      final_progress AS (
          SELECT
              berkas_id,
              no_berkas,
              kode_kegiatan,
              skala,
              anggaran,
              nomor_kontrak,
              nama_perusahaan,
              namakantor,
              kabupaten,
              kanwilid,

              ROUND(
                  SUM(
                      CASE
                          WHEN ord <= 7
                          THEN realisasi * bobot / 100
                          ELSE 0
                      END
                  ),
                  2
              ) AS realisasi_fisik,

              BOOL_AND(
                  CASE
                      WHEN ord <= 7
                      THEN realisasi = 100
                      ELSE TRUE
                  END
              ) AS seluruh_tahapan_selesai,

              JSONB_AGG(
                  JSONB_BUILD_OBJECT(
                      'tahapan_kegiatan_id', tahapan_kegiatan_id,
                      'nama_tahapan', nama_tahapan,
                      'urutan', ord,
                      'bobot', bobot,
                      'total_checklist', total_checklist,
                      'sesuai', sesuai,
                      'tidak_sesuai', tidak_sesuai,
                      'belum_diperiksa', belum_diperiksa,
                      'target_titik', target_titik,
                      'total_approved', total_approved,

                      'realisasi',
                          CASE
                              WHEN ord = 8 AND total_checklist = 0
                              THEN NULL
                              ELSE realisasi
                          END,

                      -- DATA TIMELINE
                      'masuk_tahapan_at', masuk_tahapan_at,
                      'keluar_tahapan_at', keluar_tahapan_at,
                      'tgl_mulai_timeline', tgl_mulai_timeline,
                      'tgl_selesai_timeline', tgl_selesai_timeline,
                      'status_mulai', status_mulai,
                      'status_selesai', status_selesai
                  )
                  ORDER BY ord
              ) AS tahapan

          FROM stage_with_timeline

          GROUP BY
              berkas_id,
              no_berkas,
              kode_kegiatan,
              skala,
              anggaran,
              nomor_kontrak,
              nama_perusahaan,
              namakantor,
              kabupaten,
              kanwilid
      ),

      -- ============================================
      -- 9. AGREGASI PERUSAHAAN / KONTRAK
      -- ============================================

      company_progress AS (
          SELECT
              nomor_kontrak,

              MAX(nama_perusahaan) AS nama_perusahaan,
              MAX(kanwilid) AS kanwilid,
              MAX(anggaran) AS anggaran,

              COUNT(*) AS total_berkas,

              ROUND(
                  AVG(realisasi_fisik),
                  2
              ) AS realisasi_fisik,

              BOOL_AND(seluruh_tahapan_selesai)
                  AS seluruh_berkas_selesai,

              JSONB_AGG(
                  JSONB_BUILD_OBJECT(
                      'berkas_id', berkas_id,
                      'no_berkas', no_berkas,
                      'kode_kegiatan', kode_kegiatan,
                      'skala', skala,
                      'kabupaten', kabupaten,
                      'realisasi_fisik', realisasi_fisik,
                      'seluruh_tahapan_selesai',
                          seluruh_tahapan_selesai,
                      'tahapan', tahapan
                  )
                  ORDER BY kabupaten, no_berkas
              ) AS detail

          FROM final_progress

          GROUP BY nomor_kontrak
      )

      -- ============================================
      -- 10. HASIL AKHIR
      -- ============================================

      SELECT
          nama_perusahaan,
          nomor_kontrak AS no_kontrak,
          anggaran,
          kanwilid,
          total_berkas,
          realisasi_fisik,
          seluruh_berkas_selesai,
          detail

      FROM company_progress

      ORDER BY
          nama_perusahaan,
          nomor_kontrak;

    `;

    // ============================================
    // SERIALISASI BIGINT
    // ============================================

    const serializedData = JSON.parse(
      JSON.stringify(data, (_key, value) =>
        typeof value === "bigint" ? Number(value) : value,
      ),
    );

    return NextResponse.json(
      {
        success: true,
        message: "Data monitoring realisasi kontrak berhasil diambil",
        total: serializedData.length,
        data: serializedData,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error("API MONITORING REALISASI KONTRAK ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data monitoring realisasi kontrak",
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
