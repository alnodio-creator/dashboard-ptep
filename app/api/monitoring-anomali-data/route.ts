import { prismaZonaNilaiTanah } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const nama = searchParams.get("nama") ?? "";
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 10);
  const search = searchParams.get("search") ?? "";

  const currentPage = Math.max(1, page);
  const currentLimit = Math.max(1, limit);

  const offset = (currentPage - 1) * currentLimit;

  try {
    // ======================================
    // TOTAL DATA
    // ======================================
    const totalResult = await prismaZonaNilaiTanah.$queryRaw<
      { total: bigint }[]
    >`
      WITH data_znt AS (
        SELECT
          w.nama,
          w.kantorid,
          z.nomorsk,
          z.mean,
          z.luasbatas,
          z.validsampai,
          (z.mean * z.luasbatas) AS total_nilai
        FROM peta.zonanilaitanah AS z
        RIGHT JOIN wilayah.kantor AS w
          ON w.kantorid = z.kantorid
      )

      SELECT COUNT(*) AS total
      FROM (
        SELECT
          nama,
          kantorid,
          nomorsk,
          validsampai
        FROM data_znt
        WHERE nama = ${nama}
          AND (
            ${search} = ''
            OR COALESCE(nomorsk, '') ILIKE ${`%${search}%`}
          )
        GROUP BY
          nama,
          kantorid,
          nomorsk,
          validsampai
      ) grouped_data
    `;

    const totalData = Number(totalResult[0]?.total ?? 0);

    // ======================================
    // DATA
    // ======================================
    const data = await prismaZonaNilaiTanah.$queryRaw<
      {
        nama: string;
        kantorid: string;
        nomorsk: string | null;
        validsampai: Date | null;
        jumlah_data: bigint;
        total_nilai_tanah: number | null;
        rata_nilai_tanah: number | null;
      }[]
    >`
      WITH data_znt AS (
        SELECT
          w.nama,
          w.kantorid,
          z.nomorsk,
          z.mean,
          z.luasbatas,
          z.validsampai,
          (z.mean * z.luasbatas) AS total_nilai
        FROM peta.zonanilaitanah AS z
        RIGHT JOIN wilayah.kantor AS w
          ON w.kantorid = z.kantorid
      )

      SELECT
        nama,
        kantorid,
        nomorsk,
        validsampai,
        COUNT(*) AS jumlah_data,
        SUM(total_nilai) AS total_nilai_tanah,
        ROUND(AVG(mean), 0) AS rata_nilai_tanah
      FROM data_znt
      WHERE nama = ${nama}
        AND (
          ${search} = ''
          OR COALESCE(nomorsk, '') ILIKE ${`%${search}%`}
        )
      GROUP BY
        nama,
        kantorid,
        nomorsk,
        validsampai
      ORDER BY validsampai ASC NULLS LAST
      LIMIT ${currentLimit}
      OFFSET ${offset}
    `;

    const result = data.map((item) => ({
      ...item,
      jumlah_data: Number(item.jumlah_data),
      total_nilai_tanah:
        item.total_nilai_tanah !== null ? Number(item.total_nilai_tanah) : null,
      rata_nilai_tanah:
        item.rata_nilai_tanah !== null ? Number(item.rata_nilai_tanah) : null,
    }));

    return NextResponse.json({
      data: result,
      totalData,
      currentPage,
      currentLimit,
      totalPage: Math.ceil(totalData / currentLimit),
    });
  } catch (error) {
    console.error("Error fetching monitoring data:", error);

    return NextResponse.json(
      {
        message: "Gagal fetch data",
      },
      {
        status: 500,
      },
    );
  }
}
