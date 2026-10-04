import { prismaPenilaianTanah } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const data = await prismaPenilaianTanah.$queryRaw<
      {
        nomorzone: string;
        nomorsk: string;
        geometry: unknown;
        nilai: number;
        validsejak: Date;
        validsampai: Date;
        kelas: number;
      }[]
    >`
      SELECT
        nomorzone,
        nomorsk,
        nilai,
        validsejak,
        validsampai,
        kelas,
        ST_AsGeoJSON(bt)::json AS geometry
      FROM dashboard.dashboard_znt
      where nomorsk = '187/SK-31.74.AT.01.01/XII/2025'
    `;

    const geojson = {
      type: "FeatureCollection",
      features: data.map((item) => ({
        type: "Feature",
        geometry: item.geometry,
        properties: {
          nomorzone: item.nomorzone,
          nomorsk: item.nomorsk,
          nilai: item.nilai,
          validsejak: item.validsejak,
          validsampai: item.validsampai,
          kelas: item.kelas,
        },
      })),
    };

    return NextResponse.json(geojson);
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        message: "Gagal fetch data dashboard ZNT",
      },
      {
        status: 500,
      },
    );
  }
}
