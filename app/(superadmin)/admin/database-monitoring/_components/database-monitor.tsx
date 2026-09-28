"use client";

import DataTable from "@/components/commons/data-table";
import { Header_Data_Analisis } from "@/constants/data-table";
import useDataTable from "@/hooks/use-data-table";
import { createClient } from "@/lib/supabase/client";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";

export default function Monitoring({ nomorsk }: { nomorsk: string }) {
  const supabase = createClient();

  const {
    currentPage,
    currentLimit,
    handleChangePage,
    handleChangeLimit,
    currentSearch,
  } = useDataTable();

  const QueryData = async () => {
    const Database = await supabase
      .from("nilaitanah")
      .select("*", { count: "exact" })
      .eq("nomorsk", nomorsk)
      .range((currentPage - 1) * currentLimit, currentLimit * currentPage - 1)
      .order("tahun")
      .ilike("nama", `%${currentSearch}%`);

    if (Database.error) {
      toast.error("Gagal Fetch Data", {
        description: Database.error.message,
      });
    }

    return Database;
  };

  const { data: NilaiTanah, isLoading } = useQuery({
    queryKey: ["QueryNilaiTanah", currentLimit, currentPage, currentSearch],
    queryFn: QueryData,
    placeholderData: keepPreviousData,
  });

  const FilterDataTable = useMemo(() => {
    return (NilaiTanah?.data || []).map((result, index) => {
      return [
        currentLimit * (currentPage - 1) + index + 1,
        result.nama,
        result.gunalahan,
        result.namaobj,
        result.jumlahzona,
        result.ratanilai,
        result.tahun,
      ];
    });
  }, [NilaiTanah, currentPage, currentLimit]);

  const totalData = NilaiTanah?.count ?? 0;

  const totalPages = useMemo(() => {
    if (!NilaiTanah?.count) {
      return 0;
    }

    return Math.ceil(NilaiTanah.count / currentLimit);
  }, [NilaiTanah?.count, currentLimit]);

  return (
    <div className="w-full">
      <DataTable
        title="Database Nilai Tanah"
        description="Monitoring dan pengelolaan data nilai tanah yang tersimpan dalam database."
        header={Header_Data_Analisis}
        data={FilterDataTable}
        isLoading={isLoading}
        totalData={totalData}
        totalPages={totalPages}
        currentPage={currentPage}
        currentLimit={currentLimit}
        onChangePage={handleChangePage}
        onChangeLimit={handleChangeLimit}
      />
    </div>
  );
}
