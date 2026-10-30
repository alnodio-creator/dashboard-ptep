import { prismaPenilaianTanah } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await prismaPenilaianTanah.$queryRaw<
      {
        no_berkas: string | null;
        kode_kegiatan: string | null;
        tgl_mulai: Date | null;
        tgl_selesai: Date | null;
        nama_kegiatan: string | null;
        Kabupaten: string | null;
        // Kolom v_combined_progress mengikuti struktur view
        [key: string]: unknown;
      }[]
    >`
      SELECT
        b.no_berkas,
        k.kode_kegiatan,
        k.tgl_mulai,
        k.tgl_selesai,
        k.nama_kegiatan,
        kl.nama AS "Kabupaten",
        vcp.*
      FROM tatausaha.berkas b

      LEFT JOIN tatausaha.kegiatan k
        ON b.kontrak_id = k.kegiatan_id

      LEFT JOIN tatausaha.kegiatan_lokasi kl
        ON k.kegiatan_id = kl.kegiatan_id

      LEFT JOIN dashboard.znt_master_kantor zmk
        ON zmk.kode = kl.kantor_id

      LEFT JOIN dashboard.znt_master_wilayah_kantor zmwk
        ON zmwk.kantorid = zmk.induk

      LEFT JOIN tatausaha.v_combined_progress vcp
        ON b.no_berkas = vcp.no_berkas

      WHERE
        k.tgl_mulai > '2026-09-07'
        AND k.tgl_mulai < '2026-09-10'
        AND b.no_berkas <> '01/2026/0071'

      ORDER BY k.tgl_mulai DESC
    `;

    return NextResponse.json({
      success: true,
      total: data.length,
      data: JSON.parse(
        JSON.stringify(data, (_key, value) =>
          typeof value === "bigint" ? value.toString() : value,
        ),
      ),
    });
  } catch (error) {
    console.error("Error API monitoring-progress:", error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
