import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // const { searchParams } = new URL(request.url);
    // const nama = searchParams.get("nama");

    // if (!nama) {
    //   return NextResponse.json({
    //     pesan: "Nama Kantah tidak ditemukan",
    //   });
    // }

    const data = await prisma.$queryRaw<{
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
