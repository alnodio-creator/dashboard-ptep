import { prismaPenilaianTanah } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const kantorid = searchParams.get("kantorid");

    if (!kantorid) {
      return NextResponse.json({
        pesan: "Masukkan parameter kantorid/kantorid tidak ditemukan",
      });
    }

    const data = await prismaPenilaianTanah.$queryRaw<{
      x: number;
      y: number;
      kantorid: string;
    }>`SELECT x, y FROM dashboard.znt_master_wilayah_kantor WHERE kantorid = ${kantorid}`;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching coordinate data:", error);
    return NextResponse.json(
      {
        message: "Gagal fetch data koordinat peta",
      },
      {
        status: 500,
      },
    );
  }
}
