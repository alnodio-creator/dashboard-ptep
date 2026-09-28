"use client";

"use client";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";
import { useDataNilai } from "@/hooks/hook-datanilai";
import {
  CalendarFold,
  ChartNoAxesCombined,
  LayersArrowUp,
  MapPinned,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { formatRupiah } from "@/constants/auth-constants";

import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/badge";
import { HeaderDashboard } from "@/app/dashboard/_components/header";
import { JudulAnalisis } from "@/app/dashboard/_components/judul-analisis";
import { SelectKota1 } from "@/app/dashboard/_components/filter-data";
import { DescriptionCardTotalNilai } from "@/app/dashboard/_components/description-card-nilai";
import { DescriptionCardZona } from "@/app/dashboard/_components/description-card-zona";
import { DescriptionCardNilaiTanah } from "@/app/dashboard/_components/description-card-ratanilai";
import { DescriptionCardTahun } from "@/app/dashboard/_components/description-card-tahun";
import { ChartPieDonutActive } from "@/app/dashboard/_components/chartlatian";
import { ChartBarMultiple } from "@/app/dashboard/_components/barChart";
import { DataTable } from "@/app/dashboard/_components/table-data";

const MapLibreClient = dynamic(
  () => import("@/app/dashboard/_components/Map"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-125 bg-gray-100 rounded-lg text-gray-500 text-sm">
        Memuat Peta MapLibre...
      </div>
    ),
  },
);

export default function DashboardMonitor() {
  const { selectedKota, setKota, Tahun, setTahun } = useDataNilai();
  const Supabase = createClient();

  const QueryNamaKota = async () => {
    const { data: namakota, error } =
      await Supabase.from("nilaitanah").select("nama");

    if (error) {
      toast.error("Gagal Update Data", { description: error.message });
    }

    return namakota;
  };

  const { data: semuaKota } = useQuery({
    queryKey: ["SemuaKota"],
    queryFn: QueryNamaKota,
    enabled: Boolean(selectedKota && Tahun),
  });

  const DaftarKota = useMemo(() => {
    if (!semuaKota) return [];

    return [...new Set(semuaKota.map((item) => item.nama).filter(Boolean))];
  }, [semuaKota]);

  console.log(DaftarKota);

  const Queryfunction = async () => {
    const { data: Nilaitanah, error } = await Supabase.from("nilaitanah")
      .select("*", { count: "exact" })
      .eq("nama", selectedKota)
      .gte("tahun", Number(Tahun) - 1)
      .lte("tahun", Number(Tahun))
      .order("tahun", { ascending: false });

    if (error) {
      toast.error("Gagal Fetch Data", {
        description: error.message,
      });
    }

    return Nilaitanah;
  };

  // Query Semua Nilai Tanah
  const {
    isPending,
    error,
    data: Nilaitanahini,
  } = useQuery({
    queryKey: ["Nilaitanah", selectedKota, Tahun],
    queryFn: Queryfunction,
    enabled: Boolean(selectedKota && Tahun),
  });

  if (error) {
    toast.error("Gagal Fetch Data", { description: error.message });
  }

  console.log("cek nilai tanah nih:", Nilaitanahini);

  // Ambil Nomorsk Untuk fetch data di MapLibre
  const NomorSk =
    Nilaitanahini?.find((item) => item.tahun === Number(Tahun))?.nomorsk || "";

  const kantorid =
    Nilaitanahini?.find((item) => item.nama === selectedKota)?.kantorid || "";

  //   Rumus perhitungan kenaikan nilai tanah per gunalahan
  const Gunalahan = useMemo(() => {
    if (!Nilaitanahini) return [];

    const TahunSekarang = Number(Tahun);
    const TahunSebelumnya = Number(Tahun) - 1;

    const Grouped = Nilaitanahini.reduce<
      Record<
        string,
        {
          TahunSekarang: number;
          TahunSebelumnya: number;
          jumlahzonaSekarang: number;
          jumlahzonaSebelumnya: number;
        }
      >
    >((acc, item) => {
      const gunalahan = item.gunalahan;
      const tahun = Number(item.tahun);
      const nilairata = Number(item.ratanilai) || 0;
      const jumlahzona = Number(item.jumlahzona) || 0;

      if (!acc[gunalahan]) {
        acc[gunalahan] = {
          TahunSekarang: 0,
          TahunSebelumnya: 0,
          jumlahzonaSekarang: 0,
          jumlahzonaSebelumnya: 0,
        };
      }
      if (tahun === TahunSekarang) {
        acc[gunalahan].TahunSekarang += nilairata;
        acc[gunalahan].jumlahzonaSekarang += jumlahzona;
      }

      if (tahun === TahunSebelumnya) {
        acc[gunalahan].TahunSebelumnya += nilairata;
        acc[gunalahan].jumlahzonaSebelumnya += jumlahzona;
      }

      return acc;
    }, {});

    const hasilperhitungan = Object.entries(Grouped).map(
      ([gunalahan, nilai]) => {
        let kenaikan = 0;
        if (nilai.TahunSebelumnya === 0) {
          kenaikan = nilai.TahunSekarang > 0 ? 100 : 0;
        }

        if (nilai.TahunSebelumnya !== 0 && nilai.TahunSekarang > 0) {
          kenaikan =
            ((nilai.TahunSekarang - nilai.TahunSebelumnya) /
              nilai.TahunSebelumnya) *
            100;
        }

        return {
          gunalahan,
          TahunSebelumnya: nilai.TahunSebelumnya,
          TahunSekarang: nilai.TahunSekarang,
          JumlahZonaSekarang: nilai.jumlahzonaSekarang,
          JumlahZonaSebelumnya: nilai.jumlahzonaSebelumnya,
          kenaikan,
        };
      },
    );

    return hasilperhitungan;
  }, [Nilaitanahini, Tahun]);

  console.log(Gunalahan);
  // ==================================Rumus Pertumbuhan Nilai Total===========================================
  // Rumus Pertumbuhan Nilai Total

  const PertumbuhanNilai = useMemo(() => {
    const Totalnilaitanah =
      Nilaitanahini?.filter((item) => {
        return item.nama === selectedKota && item.tahun === Number(Tahun);
      }).reduce((total, item) => total + (item.ratanilai ?? 0), 0) ?? 0;

    const TotalnilaitanahSebelum =
      Nilaitanahini?.filter(
        (item) =>
          item.nama === selectedKota && item.tahun === Number(Tahun - 1),
      ).reduce((total, item) => total + (item.ratanilai ?? 0), 0) ?? 0;

    let PertumbuhanNilaitanah = 0;

    if (TotalnilaitanahSebelum === 0) {
      PertumbuhanNilaitanah = Totalnilaitanah > 0 ? 100 : 0;
    }

    if (TotalnilaitanahSebelum > 0) {
      PertumbuhanNilaitanah =
        ((Totalnilaitanah - TotalnilaitanahSebelum) / TotalnilaitanahSebelum) *
        100;
    }

    const Jumlahzona =
      Nilaitanahini?.filter(
        (item) => item.nama === selectedKota && item.tahun === Number(Tahun),
      ).reduce((totalzona, item) => totalzona + (item.jumlahzona ?? 0), 0) ?? 0;

    const DataTahunSekarang =
      Nilaitanahini?.filter(
        (item) => item.nama === selectedKota && item.tahun === Number(Tahun),
      ) ?? [];

    const RataNilaiTanah =
      DataTahunSekarang.length > 0
        ? DataTahunSekarang.reduce(
            (total, item) => total + (item.ratanilai ?? 0),
            0,
          ) / DataTahunSekarang.length
        : 0;

    return {
      Totalnilaitanah,
      TotalnilaitanahSebelum,
      PertumbuhanNilaitanah,
      Jumlahzona,
      RataNilaiTanah,
    };
  }, [Nilaitanahini, selectedKota, Tahun]);

  const { PertumbuhanNilaitanah, Totalnilaitanah, Jumlahzona, RataNilaiTanah } =
    PertumbuhanNilai;
  // ==========================================================================================================

  // ==================================Data Tabel===========================================

  // Header Tabel
  const Header = [
    "No",
    "Gunalahan",
    `${Number(Tahun) - 1}`,
    `${Number(Tahun)}`,
    "Kenaikan",
    "JumlahZona",
  ];

  // DataTabel

  const DataTable1 = useMemo(() => {
    const Datatabelgunalahan = Gunalahan.map((item, index) => {
      const positive = item.kenaikan !== undefined && item.kenaikan > 0;
      return [
        index + 1,
        item.gunalahan,
        formatRupiah(item.TahunSebelumnya),
        formatRupiah(item.TahunSekarang),
        <div key={index} className="flex min-h-6 items-center gap-2">
          <Badge
            variant="outline"
            className={
              positive
                ? "border-emerald-200 bg-emerald-50 font-medium text-emerald-700"
                : "border-rose-200 bg-rose-50 font-medium text-rose-700"
            }
          >
            {positive ? (
              <TrendingUp className="mr-1 size-3" />
            ) : (
              <TrendingDown className="mr-1 size-3" />
            )}
            {positive ? "+" : ""} {item.kenaikan.toFixed(1)}%
          </Badge>
        </div>,
        item.JumlahZonaSekarang,
      ];
    });

    return Datatabelgunalahan;
  }, [Gunalahan]);

  // ===============================================================================

  // ====================================Data Grafik NamaObject===========================================
  const PertumbuhanDetailGunalahan = useMemo(() => {
    if (!Nilaitanahini) return [];

    const TahunSekarang = Number(Tahun);
    const TahunSebelumnya = Number(Tahun) - 1;

    const Grouped = Nilaitanahini.reduce<
      Record<
        string,
        {
          TahunSekarang: number;
          TahunSebelumnya: number;
          jumlahzonaSekarang: number;
          jumlahzonaSebelumnya: number;
        }
      >
    >((acc, item) => {
      const namaobj = item.namaobj;
      const tahun = Number(item.tahun);
      const nilairata = Number(item.ratanilai) || 0;
      const jumlahzona = Number(item.jumlahzona) || 0;

      if (!acc[namaobj]) {
        acc[namaobj] = {
          TahunSekarang: 0,
          TahunSebelumnya: 0,
          jumlahzonaSekarang: 0,
          jumlahzonaSebelumnya: 0,
        };
      }
      if (tahun === TahunSekarang) {
        acc[namaobj].TahunSekarang += nilairata;
        acc[namaobj].jumlahzonaSekarang += jumlahzona;
      }

      if (tahun === TahunSebelumnya) {
        acc[namaobj].TahunSebelumnya += nilairata;
        acc[namaobj].jumlahzonaSebelumnya += jumlahzona;
      }

      return acc;
    }, {});

    const hasilperhitungan = Object.entries(Grouped).map(([namaobj, nilai]) => {
      let kenaikan = 0;
      if (nilai.TahunSebelumnya === 0) {
        kenaikan = nilai.TahunSekarang > 0 ? 100 : 0;
      }

      if (nilai.TahunSebelumnya !== 0 && nilai.TahunSekarang > 0) {
        kenaikan =
          ((nilai.TahunSekarang - nilai.TahunSebelumnya) /
            nilai.TahunSebelumnya) *
          100;
      }

      return {
        namaobj,
        TahunSebelumnya: nilai.TahunSebelumnya,
        TahunSekarang: nilai.TahunSekarang,
        JumlahZonaSekarang: nilai.jumlahzonaSekarang,
        JumlahZonaSebelumnya: nilai.jumlahzonaSebelumnya,
        kenaikan,
      };
    });

    return hasilperhitungan;
  }, [Nilaitanahini, Tahun]);

  console.log(PertumbuhanDetailGunalahan);

  // ========================Query untuk Titik Koordinat MapLibre=========================================
  // Query Koordinat Peta
  const QueryFunctionKoordinat = async () => {
    if (!kantorid) return [];

    try {
      const response = await fetch(`/api/koordinat-peta?kantorid=${kantorid}`);

      if (!response.ok) {
        throw new Error("Gagal fetch koordinat peta");
      }

      const data = await response.json();

      return data;
    } catch (error) {
      console.error("Error fetch koordinat:", error);
      throw error;
    }
  };

  const { data: KoordinatPeta, isPending: isPendingKoordinat } = useQuery({
    queryKey: ["KoordinatPeta", kantorid],
    queryFn: QueryFunctionKoordinat,
    enabled: Boolean(kantorid),
  });

  console.log("Koordinat Peta:", KoordinatPeta);

  // =====================================================================================================

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 via-white to-sky-50/60 text-foreground dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <HeaderDashboard />
      <div className="mx-auto max-w-7xl px-5 py-7 lg:px-8 lg:py-10">
        <JudulAnalisis nama={selectedKota} />
        <SelectKota1
          Kota={DaftarKota}
          tahun={[2024, 2025, 2026]}
          selectedKota={selectedKota}
          selectedTahun={Number(Tahun)}
          setKota={setKota}
          setTahun={setTahun}
        />

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DescriptionCardTotalNilai
            logo={
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <ChartNoAxesCombined className="size-5" />
              </div>
            }
            label={`Total Rata Nilai Tanah`}
            totalValue={formatRupiah(Totalnilaitanah)}
            value={PertumbuhanNilaitanah}
          />
          <DescriptionCardZona
            logo={<MapPinned className="size-5" />}
            label="Jumlah Zona"
            totalValue={Jumlahzona}
          />
          <DescriptionCardNilaiTanah
            logo={
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <LayersArrowUp className="size-5" />
              </div>
            }
            label={`Rata-rata Nilai Tanah`}
            totalValue={formatRupiah(RataNilaiTanah)}
          />
          <DescriptionCardTahun
            logo={
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                <CalendarFold className="size-5" />
              </div>
            }
            label={`Periode Tahun`}
            totalValue={Number(Tahun)}
          />
        </div>
        <div className="grid gap-8">
          <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="text-base font-semibold">Peta Nilai Tanah</h2>

                <p className="text-sm text-muted-foreground">
                  Visualisasi spasial nilai tanah {Number(Tahun)} di{" "}
                  {selectedKota}
                </p>
              </div>

              <Badge variant="outline">{Number(Tahun)}</Badge>
            </div>
            <div className="h-125 w-full">
              <MapLibreClient nomorSk={NomorSk} koordinat={KoordinatPeta} />
            </div>
          </div>
          {/* Baris Chart */}
          <div className="grid items-stretch gap-6 xl:grid-cols-2">
            {/* Kiri */}
            <div className="min-w-0">
              <ChartPieDonutActive
                Title="Jumlah Zona per Guna Lahan"
                Tahun={Number(Tahun)}
                data={Gunalahan}
              />
            </div>

            {/* Kanan */}
            <div className="min-w-0">
              <div className="h-full rounded-xl">
                <ChartBarMultiple
                  Title="Perbandingan Jumlah Zona"
                  Tahun={Number(Tahun)}
                  data={Gunalahan}
                />
              </div>
            </div>
          </div>

          {/* Tabel */}
          <div className="min-w-0">
            <DataTable header={Header} data={DataTable1} />
          </div>
        </div>
      </div>
    </main>
  );
}
