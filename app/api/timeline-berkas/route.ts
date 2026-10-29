import { prismaBelajarSipenta, prismaPenilaianTanah } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const kanwilid = searchParams.get("kanwilid");
    const kode_kegiatan = searchParams.get("kode_kegiatan");

    // Kedua filter wajib diisi
    if (!kanwilid || !kode_kegiatan) {
      return NextResponse.json(
        {
          success: false,
          message: "Parameter kanwilid dan kode_kegiatan wajib diisi",
        },
        { status: 400 },
      );
    }

    const data = await prismaPenilaianTanah.$queryRaw<
      {
        no_berkas: string | null;
        kode_kegiatan: string | null;
        tgl_mulai: Date | null;
        tgl_selesai: Date | null;
        nama_kegiatan: string | null;
        Kabupaten: string | null;
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
        vhtd.*
      FROM tatausaha.berkas b
      LEFT JOIN tatausaha.kegiatan k
        ON b.kontrak_id = k.kegiatan_id
      LEFT JOIN tatausaha.v_history_timeline_durasi vhtd
        ON b.berkas_id = vhtd.berkas_id
      LEFT JOIN tatausaha.kegiatan_lokasi kl
        ON k.kegiatan_id = kl.kegiatan_id
      LEFT JOIN dashboard.znt_master_kantor zmk
        ON zmk.kode = kl.kantor_id
      LEFT JOIN dashboard.znt_master_wilayah_kantor zmwk
        ON zmwk.kantorid = zmk.induk
      WHERE zmwk.kantorid = ${kanwilid}
        AND k.kode_kegiatan = ${kode_kegiatan}
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
    console.error("Error API timeline-berkas-belajar:", error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
