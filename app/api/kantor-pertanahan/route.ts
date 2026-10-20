import { prismaPenilaianTanah } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // 2. Tolak pengguna yang belum login atau sesinya tidak valid
  if (error || !user) {
    return NextResponse.json(
      {
        message: "Unauthorized. Silakan login terlebih dahulu.",
      },
      { status: 401 },
    );
  }
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
