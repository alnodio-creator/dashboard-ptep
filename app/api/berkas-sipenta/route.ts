import { prismaPenilaianTanah } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await prismaPenilaianTanah.$queryRaw<
      {
        no_berkas: string | null;
        kode_kegiatan: string | null;
        namakantor: string | null;
        kanwilid: string | null;
        kantorid: string | null;
        Kabupaten: string | null;
        nama_kegiatan: string | null;
        nama_tahapan: string | null;
        anggaran_tahun: number | null;
        anggaran: number | null;
        target_luasan: number | null;
        nama_anggaran: string | null;
        skala: string | null;
        nomor_kontrak: string | null;
        jenis_kontrak: string | null;
        nama_perusahaan: string | null;
        penanggung_jawab: string | null;
      }[]
    >`
SELECT
        b.no_berkas,
        k.kode_kegiatan,
        zmwk.namakantor,
        zmwk.kantorid as kanwilid,
        zmk.kantorid as kantorid,
        kl.nama AS "Kabupaten",
        k.nama_kegiatan,
        tk.nama_tahapan,
        k.anggaran_tahun,
        k.anggaran,
        k.target_luasan,
        k.nama_anggaran,
        k.skala,
        kk.nomor_kontrak,
        kk.jenis_kontrak,
        kk.nama_perusahaan,
        kk.penanggung_jawab
      FROM tatausaha.berkas b
      LEFT JOIN tatausaha.kegiatan_kontrak kk
        ON b.kontrak_id = kk.kontrak_id
      LEFT JOIN tatausaha.kegiatan k
        ON kk.kegiatan_id  = k.kegiatan_id
      LEFT JOIN tatausaha.kegiatan_lokasi kl
        ON k.kegiatan_id  = kl.kegiatan_id
      LEFT JOIN tatausaha.tahapan_kegiatan tk
        ON b.tahapan_kegiatan_id = tk.tahapan_kegiatan_id
      LEFT JOIN dashboard.znt_master_kantor zmk
        ON zmk.kode = kl.wilayah_id 
      LEFT JOIN dashboard.znt_master_wilayah_kantor zmwk
        ON zmwk.kantorid = zmk.induk
      Where b.deleted_at is null
      ORDER BY b.created_at desc, zmwk.namakantor asc
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
    console.error("Error API kegiatan-kontrak:", error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
