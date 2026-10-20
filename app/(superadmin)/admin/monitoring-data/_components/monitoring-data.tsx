"use client";

import DataTable from "@/components/commons/data-table";
import { Header_Data_Monitoring } from "@/constants/data-table";
import { useDataNilai } from "@/hooks/hook-datanilai";
import useDataTable from "@/hooks/use-data-table";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";
import { FilteringDataKota } from "./filter-data";
import { TypeMonitoringAnomaliData } from "@/constants/useForm";
import { formatRupiah } from "@/constants/auth-constants";
import DataTableMonitoring from "./table-data";
import BarCharAnalisis from "./BarChart-analisis";
import { ArrowDown, ArrowUp } from "lucide-react";
import { basePath } from "@/constants/menu-sidebar";

export default function MonitoringData() {
  const { selectedKota, setKota, Tahun, setTahun } = useDataNilai();
  const {
    currentPage,
    currentLimit,
    handleChangePage,
    handleChangeLimit,
    currentSearch,
  } = useDataTable();

  const getDataKantah = async () => {
    const response = await fetch(`${basePath}/api/kantor-pertanahan`);
    if (!response.ok) {
      toast.error("Gagal Fetch Data", {
        description: response.ok,
      });
    }

    const data = await response.json();
    return data;
  };

  const { data: Data_Kantah } = useQuery({
    queryKey: ["Data_Kantah"],
    queryFn: getDataKantah,
  });

  const getDataTable = async () => {
    const params = new URLSearchParams({
      nama: selectedKota,
      page: currentPage.toString(),
      limit: currentLimit.toString(),
      search: currentSearch,
    });

    const response = await fetch(
      `/api/monitoring-anomali-data?${params.toString()}`,
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Gagal fetch data");
    }

    return response.json();
  };

  const {
    data: MonitoringData,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: [
      "MonitoringData",
      selectedKota,
      currentPage,
      currentLimit,
      currentSearch,
    ],
    queryFn: getDataTable,
    placeholderData: keepPreviousData,
  });

  console.log(MonitoringData);

  const DataKantah = useMemo(() => {
    return Data_Kantah;
  }, [Data_Kantah]);

  const formatValidSampai = (date: string | null) => {
    if (!date) {
      return (
        <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          Masih Aktif Peta
        </span>
      );
    }

    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(date));
  };

  const FilteredDataTable = useMemo(() => {
    const data = MonitoringData?.data ?? [];

    return data.map((result: TypeMonitoringAnomaliData, index: number) => {
      // Data sebelumnya
      const previousData = data[index - 1];

      let pertumbuhan = 0;

      if (
        previousData &&
        previousData.total_nilai_tanah !== null &&
        previousData.total_nilai_tanah !== undefined &&
        previousData.total_nilai_tanah !== 0
      ) {
        pertumbuhan =
          ((result.total_nilai_tanah ?? 0) - previousData.total_nilai_tanah) /
          previousData.total_nilai_tanah;
      }

      // Tampilan pertumbuhan
      const growth =
        index === 0 ? (
          "-"
        ) : (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
              pertumbuhan > 0
                ? "bg-green-100 text-green-700"
                : pertumbuhan < 0
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-600"
            }`}
          >
            {pertumbuhan > 0 ? (
              <ArrowUp className="h-3 w-3" />
            ) : pertumbuhan < 0 ? (
              <ArrowDown className="h-3 w-3" />
            ) : null}
            {(pertumbuhan * 100).toFixed(2)}%
          </span>
        );

      return {
        data: [
          currentLimit * (currentPage - 1) + index + 1,

          result.nama,

          result.nomorsk ?? "-",

          formatValidSampai(result.validsampai),

          result.jumlah_data ?? 0,

          formatRupiah(result?.rata_nilai_tanah ?? 0),

          formatRupiah(result.total_nilai_tanah ?? 0),

          // Pertumbuhan
          growth,
        ],

        isAnomaly:
          !result.nomorsk ||
          result.nomorsk.length < 5 ||
          (result.jumlah_data ?? 0) < 30,
      };
    });
  }, [MonitoringData, currentPage, currentLimit]);

  const totalDataMonitoring = MonitoringData?.totalData ?? 0;

  const totalPagesMonitoring = useMemo(() => {
    if (!totalDataMonitoring) {
      return 0;
    }

    return Math.ceil(totalDataMonitoring / currentLimit);
  }, [totalDataMonitoring, currentLimit]);

  return (
    <div className="w-full">
      <FilteringDataKota
        Kota={DataKantah}
        tahun={[2024, 2025, 2026]}
        selectedKota={selectedKota}
        selectedTahun={Number(Tahun)}
        setKota={setKota}
        setTahun={setTahun}
      />
      <div className="my-6">
        <BarCharAnalisis
          data={MonitoringData?.data ?? []}
          isLoading={isLoading || isFetching}
        />
      </div>

      <DataTableMonitoring
        title="Database Nilai Tanah"
        description="Monitoring dan pengelolaan data nilai tanah yang tersimpan dalam database."
        header={Header_Data_Monitoring}
        data={FilteredDataTable}
        isLoading={isLoading}
        totalData={totalDataMonitoring}
        totalPages={totalPagesMonitoring}
        currentPage={currentPage}
        currentLimit={currentLimit}
        onChangePage={handleChangePage}
        onChangeLimit={handleChangeLimit}
      />
    </div>
  );
}
