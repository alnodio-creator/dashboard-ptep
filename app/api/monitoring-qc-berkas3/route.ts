import { prismaPenilaianTanah } from "@/lib/prisma";
import { NextResponse } from "next/server";

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

type MonitoringRealisasiKontrak = {
  kanwilid: string | null;
  Kanwil: string | null;
  kode_kegiatan: string | null;
  nama_kegiatan: string | null;
  anggaran: number | null;
  total_berkas: number | null;
  realisasi_fisik: number | null;
  detail: DetailBerkas[];
};

export async function GET() {
  try {
    const data = await prismaPenilaianTanah.$queryRaw<
      MonitoringRealisasiKontrak[]
    >`
select vmpk.kanwilid, 
vmpk."Kanwil",
vmpk.kode_kegiatan,
vmpk.nama_kegiatan,
vmpk.anggaran,
vmpk.total_berkas,
vmpk.realisasi_fisik,
vmpk.seluruh_berkas_selesai,
vmpk.detail
from tatausaha.v_monitoring_progress_kanwil2 vmpk 
where vmpk.kode_kegiatan = '02'
order by vmpk."Kanwil" asc;
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
