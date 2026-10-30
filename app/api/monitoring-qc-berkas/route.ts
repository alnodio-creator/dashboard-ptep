import { NextRequest, NextResponse } from "next/server";
import { prismaPenilaianTanah } from "@/lib/prisma";

export type TahapanRealisasiFisik = {
  tahapan_kegiatan_id: number;
  nama_tahapan: string;
  urutan: number;
  bobot: number;

  total_checklist: number;
  sesuai: number;
  tidak_sesuai: number;
  belum_diperiksa: number;

  // NULL untuk tahapan Selesai jika tidak memiliki checklist
  realisasi: number | null;
};

export type MonitoringRealisasiFisik = {
  berkas_id: number;
  no_berkas: string;
  kode_kegiatan: "01" | "02";
  skala: string;
  kabupaten: string;
  nama_perusahaan: string;
  kanwilid: string;

  realisasi_fisik: number;
  seluruh_tahapan_selesai: boolean;

  tahapan: TahapanRealisasiFisik[];
};

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const kanwilid = searchParams.get("kanwilid");
    const kodeKegiatan = searchParams.get("kode_kegiatan");

    if (!kanwilid || !kodeKegiatan) {
      return NextResponse.json(
        {
          success: false,
          message: "Parameter kanwilid dan kode_kegiatan wajib diisi.",
        },
        { status: 400 },
      );
    }

    if (!["01", "02"].includes(kodeKegiatan)) {
      return NextResponse.json(
        {
          success: false,
          message: "kode_kegiatan harus 01 atau 02.",
        },
        { status: 400 },
      );
    }

    const data = await prismaPenilaianTanah.$queryRawUnsafe<
      MonitoringRealisasiFisik[]
    >(
      `
      WITH stage_config AS (
          SELECT *
          FROM (
              VALUES
              ('01', 1,  'Persiapan', 10::numeric, 1),
              ('01', 2,  'Pembuatan Zona Awal', 18::numeric, 2),
              ('01', 33, 'Survei Batas Zona Awal Nilai Tanah', 18::numeric, 3),
              ('01', 3,  'Pengumpulan Data Sampel Nilai Tanah', 18::numeric, 4),
              ('01', 4,  'Analisis dan Pengolahan Data', 26::numeric, 5),
              ('01', 5,  'Penyajian Peta', 5::numeric, 6),
              ('01', 6,  'Pelaporan', 5::numeric, 7),
              ('01', 29, 'Selesai', 100::numeric, 8),

              ('02', 7,  'Persiapan', 10::numeric, 1),
              ('02', 8,  'Analisis dan Delineasi Zona yang Mengalami Perubahan', 20::numeric, 2),
              ('02', 9,  'Survei Batas Zona Nilai Tanah yang Akan Diperbarui', 20::numeric, 3),
              ('02', 10, 'Pengumpulan Data Sampel Nilai Tanah', 20::numeric, 4),
              ('02', 11, 'Analisis dan Pengolahan Data', 20::numeric, 5),
              ('02', 12, 'Penyajian Peta', 5::numeric, 6),
              ('02', 13, 'Pelaporan', 5::numeric, 7),
              ('02', 30, 'Selesai', 100::numeric, 8)
          ) AS s(kode_kegiatan, tahapan_kegiatan_id, nama_tahapan, bobot, urutan)
          WHERE s.kode_kegiatan = $2
      ),

      berkas_list AS (
          SELECT DISTINCT
              b.berkas_id,
              b.no_berkas,
              k.kode_kegiatan,
              k.skala,
              kl.nama AS kabupaten,
              kk.nama_perusahaan,
              zmwk.kantorid AS kanwilid
          FROM tatausaha.berkas b
          INNER JOIN tatausaha.kegiatan k
              ON b.kontrak_id = k.kegiatan_id
          INNER JOIN tatausaha.kegiatan_lokasi kl
              ON k.kegiatan_id = kl.kegiatan_id
          INNER JOIN tatausaha.kegiatan_kontrak kk
              ON k.kegiatan_id = kk.kegiatan_id
          INNER JOIN dashboard.znt_master_kantor zmk
              ON zmk.kode = kl.kantor_id
          INNER JOIN dashboard.znt_master_wilayah_kantor zmwk
              ON zmwk.kantorid = zmk.induk
          WHERE zmwk.kantorid = $1
            AND k.kode_kegiatan = $2
      ),

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

      stage_stats AS (
          SELECT
              bl.berkas_id,
              bl.no_berkas,
              bl.kode_kegiatan,
              bl.skala,
              bl.kabupaten,
              bl.nama_perusahaan,
              bl.kanwilid,

              sc.tahapan_kegiatan_id,
              sc.nama_tahapan,
              sc.bobot,
              sc.urutan,

              COUNT(mc.master_checklist_id) AS total_checklist,

              COUNT(mc.master_checklist_id) FILTER (
                  WHERE UPPER(TRIM(lc.status_kesesuaian)) = 'SESUAI'
              ) AS sesuai,

              COUNT(mc.master_checklist_id) FILTER (
                  WHERE UPPER(TRIM(lc.status_kesesuaian)) = 'TIDAK_SESUAI'
              ) AS tidak_sesuai,

              COUNT(mc.master_checklist_id) FILTER (
                  WHERE lc.master_checklist_id IS NULL
              ) AS belum_diperiksa

          FROM berkas_list bl
          CROSS JOIN stage_config sc

          LEFT JOIN tatausaha.master_checklist mc
              ON mc.tahapan_kegiatan_id = sc.tahapan_kegiatan_id
             AND mc.is_required = TRUE
             AND mc.is_aktif = TRUE

          LEFT JOIN latest_checklist lc
              ON lc.berkas_id = bl.berkas_id
             AND lc.master_checklist_id = mc.master_checklist_id

          GROUP BY
              bl.berkas_id,
              bl.no_berkas,
              bl.kode_kegiatan,
              bl.skala,
              bl.kabupaten,
              bl.nama_perusahaan,
              bl.kanwilid,
              sc.tahapan_kegiatan_id,
              sc.nama_tahapan,
              sc.bobot,
              sc.urutan
      ),

      stage_progress AS (
          SELECT
              *,
              CASE
                  WHEN total_checklist > 0
                  THEN ROUND(sesuai::numeric / total_checklist * 100, 2)
                  ELSE 0
              END AS realisasi
          FROM stage_stats
      ),

      final_progress AS (
          SELECT
              berkas_id,
              no_berkas,
              kode_kegiatan,
              skala,
              kabupaten,
              nama_perusahaan,
              kanwilid,

              ROUND(
                  SUM(
                      CASE
                          WHEN urutan <= 7
                          THEN realisasi * bobot / 100
                          ELSE 0
                      END
                  ),
                  2
              ) AS realisasi_fisik,

              BOOL_AND(
                  CASE
                      WHEN urutan <= 7 THEN realisasi = 100
                      ELSE TRUE
                  END
              ) AS seluruh_tahapan_selesai,

              JSONB_AGG(
                  JSONB_BUILD_OBJECT(
                      'tahapan_kegiatan_id', tahapan_kegiatan_id,
                      'nama_tahapan', nama_tahapan,
                      'urutan', urutan,
                      'bobot', bobot,
                      'total_checklist', total_checklist,
                      'sesuai', sesuai,
                      'tidak_sesuai', tidak_sesuai,
                      'belum_diperiksa', belum_diperiksa,
                      'realisasi', CASE
                          WHEN urutan = 8 AND total_checklist = 0 THEN NULL
                          ELSE realisasi
                      END
                  )
                  ORDER BY urutan
              ) AS tahapan

          FROM stage_progress
          GROUP BY
              berkas_id,
              no_berkas,
              kode_kegiatan,
              skala,
              kabupaten,
              nama_perusahaan,
              kanwilid
      )

      SELECT *
      FROM final_progress
      ORDER BY
          kabupaten,
          nama_perusahaan,
          no_berkas;
      `,
      kanwilid,
      kodeKegiatan,
    );

    const serializedData = JSON.parse(
      JSON.stringify(data, (_, value) =>
        typeof value === "bigint" ? Number(value) : value,
      ),
    );

    return NextResponse.json({
      success: true,
      message: "Berhasil mengambil monitoring realisasi fisik.",
      total: serializedData.length,
      data: serializedData,
    });
  } catch (error) {
    console.error("MONITORING REALISASI FISIK ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data monitoring realisasi fisik.",
        error:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan tidak diketahui.",
      },
      { status: 500 },
    );
  }
}
