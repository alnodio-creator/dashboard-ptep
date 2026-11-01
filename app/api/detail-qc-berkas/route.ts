import { NextRequest, NextResponse } from "next/server";
import { prismaPenilaianTanah } from "@/lib/prisma";

export type MonitoringDetailBerkas = {
  berkas_id: number;
  no_berkas: string;
  anggaran: number | null;

  namakantor: string | null;
  kanwilid: string | null;
  kantorid: string | null;
  Kabupaten: string | null;

  kode_kegiatan: string;
  nomor_kontrak: string | null;
  jenis_kontrak: string | null;
  penanggung_jawab: string | null;

  status_kesesuaian: string | null;
  kelompok: string | null;
  nama_tahapan: string | null;
  nama_item: string | null;
  deskripsi: string | null;
  catatan: string | null;
  created_at: Date | null;
  role_pemeriksa: string | null;
  created_by: string | null;
  bobot: number | null;
  tahapan_kegiatan_id: number | null;
  urutan: number | null;
};

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const kantorid = searchParams.get("kantorid");
    const berkas = searchParams.get("berkas");

    // Validasi parameter
    if (!kantorid || !berkas) {
      return NextResponse.json(
        {
          success: false,
          message: "Parameter kantorid dan berkas wajib diisi.",
        },
        { status: 400 },
      );
    }

    const data = await prismaPenilaianTanah.$queryRawUnsafe<
      MonitoringDetailBerkas[]
    >(
      `
        WITH berkas_list AS (
            SELECT DISTINCT
                b.berkas_id,
                b.no_berkas,
                k.anggaran,
                zmwk.namakantor,
                zmwk.kantorid AS kanwilid,
                zmk.kantorid AS kantorid,
                kl.nama AS "Kabupaten",
                k.kode_kegiatan,
                kk.nomor_kontrak,
                kk.jenis_kontrak,
                kk.penanggung_jawab

            FROM tatausaha.berkas b

            INNER JOIN tatausaha.kegiatan_kontrak kk
                ON b.kontrak_id = kk.kontrak_id

            INNER JOIN tatausaha.kegiatan k
                ON k.kegiatan_id = kk.kegiatan_id

            INNER JOIN tatausaha.kegiatan_lokasi kl
                ON k.kegiatan_id = kl.kegiatan_id

            LEFT JOIN tatausaha.tahapan_kegiatan tk
                ON b.tahapan_kegiatan_id = tk.tahapan_kegiatan_id

            LEFT JOIN dashboard.znt_master_kantor zmk
                ON zmk.kode = kl.wilayah_id

            LEFT JOIN dashboard.znt_master_wilayah_kantor zmwk
                ON zmwk.kantorid = zmk.induk
        ),

        monitoring_form AS (
            SELECT
                fc.berkas_id,
                fc.status_kesesuaian,
                tk.kelompok,
                tk.nama_tahapan,
                mc.nama_item,
                mc.deskripsi,
                fc.catatan,
                fc.created_at,
                fc.role_pemeriksa,
                fc.created_by,
                tk.bobot,
                mc.tahapan_kegiatan_id,
                mc.urutan

            FROM tatausaha.form_checklist fc

            INNER JOIN tatausaha.master_checklist mc
                ON fc.master_checklist_id = mc.master_checklist_id

            INNER JOIN tatausaha.tahapan_kegiatan tk
                ON tk.tahapan_kegiatan_id = mc.tahapan_kegiatan_id
        )

        SELECT
            bl.*,
            mf.*

        FROM berkas_list bl

        LEFT JOIN monitoring_form mf
            ON bl.berkas_id = mf.berkas_id

        WHERE bl.kantorid = $1
          AND bl.no_berkas = $2

        ORDER BY
            bl."Kabupaten" ASC,
            mf.tahapan_kegiatan_id ASC,
            mf.urutan ASC,
            mf.created_at ASC;
        `,
      kantorid,
      berkas,
    );

    // Konversi BigInt agar dapat diserialisasi menjadi JSON
    const serializedData = JSON.parse(
      JSON.stringify(data, (_, value) =>
        typeof value === "bigint" ? Number(value) : value,
      ),
    );

    return NextResponse.json({
      success: true,
      message: "Berhasil mengambil detail monitoring berkas.",
      total: serializedData.length,
      data: serializedData,
    });
  } catch (error) {
    console.error("MONITORING DETAIL BERKAS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil detail monitoring berkas.",
        error:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan tidak diketahui.",
      },
      { status: 500 },
    );
  }
}
