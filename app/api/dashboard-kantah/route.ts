import { prismaPenilaianTanah } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const data = await prismaPenilaianTanah.$queryRaw<
      { nomorzone: string; nomorsk: string; geometry: unknown }[]
    >`
      SELECT
        nomorzone,
        nomorsk,
        ST_AsGeoJSON(bt)::json AS geometry
      FROM dashboard.dashboard_znt
      LIMIT 1
    `;

    return NextResponse.json(data);
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        message: "Gagal fetch data dashboard kantah",
      },
      {
        status: 500,
      },
    );
  }
}
