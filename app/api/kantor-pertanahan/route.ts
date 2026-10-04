import { prismaPenilaianTanah } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await prismaPenilaianTanah.$queryRaw<{
      kantorid: string;
      kode: string;
      induk: string;
      nama: string;
      tipekantorid: string;
    }>`SELECT * FROM dashboard.znt_master_kantor`;

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
