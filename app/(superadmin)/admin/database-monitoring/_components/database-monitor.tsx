"use client";

import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Header_Data_Analisis } from "@/constants/data-table";
import useDataTable from "@/hooks/use-data-table";
import { createClient } from "@/lib/supabase/client";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import DropdownAction from "@/components/commons/dropdown-action";
import { Pencil, Trash2 } from "lucide-react";
import UpdateMonitorDialog from "./update-monitor";
import { typeCurrentMonitor } from "@/constants/useForm";
import { DeleteMonitorDialog } from "./delete-monitor";
import CreateMonitorDetail from "./create-database-monitor";
import { formatRupiah } from "@/constants/auth-constants";
import DataTableMonitor from "./table-monitor";

export default function Monitoring({ nomorsk }: { nomorsk: string }) {
  const supabase = createClient();

  const {
    currentPage,
    currentLimit,
    handleChangePage,
    handleChangeLimit,
    currentSearch,
    handleChangeSearch,
  } = useDataTable();

  const [selectedAction, setSelectedAction] = useState<{
    data: typeCurrentMonitor;
    type: "Update" | "Delete";
  } | null>(null);

  const handleCloseDialog = (open: boolean) => {
    if (!open) {
      setSelectedAction(null);
    }
  };
  const QueryData = async () => {
    const Database = await supabase
      .from("nilaitanah")
      .select("*", { count: "exact" })
      .or(
        `nomorsk.ilike.%${currentSearch}%,nama.ilike.%${currentSearch}%,gunalahan.ilike.%${currentSearch}%,namaobj.ilike.%${currentSearch}%`,
      )
      .range((currentPage - 1) * currentLimit, currentLimit * currentPage - 1)
      .order("gunalahan");

    if (Database.error) {
      toast.error("Gagal Fetch Data", {
        description: Database.error.message,
      });
    }

    return Database;
  };

  const {
    data: NilaiTanah,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["QueryNilaiTanah", currentLimit, currentPage, currentSearch],
    queryFn: QueryData,
    placeholderData: keepPreviousData,
  });

  const namakantorquery = NilaiTanah?.data?.[0]?.nama ?? "";
  const kantoridquery = NilaiTanah?.data?.[0]?.kantorid ?? "";
  const FilterDataTable = useMemo(() => {
    return (NilaiTanah?.data || []).map((result, index) => {
      return [
        currentLimit * (currentPage - 1) + index + 1,
        result.nama,
        result.gunalahan,
        result.namaobj,
        result.jumlahzona,
        formatRupiah(result.ratanilai ?? 0),
        result.tahun,
        <DropdownAction
          key={`dropdown-action-${result.nomorsk}-${index}`}
          menu={[
            {
              label: (
                <span className="flex items-center gap-2">
                  <Pencil className="size-4" />
                  Edit
                </span>
              ),
              action: () => {
                setSelectedAction({
                  data: result,
                  type: "Update",
                });
              },
            },
            {
              label: (
                <span className="flex items-center gap-2">
                  <Trash2 className="size-4 text-red-400" />
                  Delete
                </span>
              ),
              variant: "destructive",
              action: () => {
                setSelectedAction({
                  data: result,
                  type: "Delete",
                });
              },
            },
          ]}
        />,
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
      <div className="flex flex-col lg:flex-row mb-4 gap-2 justify-between w-full">
        <div className="flex gap-2">
          <Input
            placeholder="Search by name"
            onChange={(e) => handleChangeSearch(e.target.value)}
          />
          <Dialog>
            <DialogTrigger
              className=" inline-flex h-9 items-center gap-2 rounded-lg border border-green-200
                        bg-green-50 px-4 text-sm font-medium text-green-700 shadow-sm transition-all
                        hover:bg-green-100 hover:text-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300
                        active:translate-y-px
    "
            >
              Create
            </DialogTrigger>
            <CreateMonitorDetail
              kantah={namakantorquery}
              nomorsk={nomorsk}
              kantorid={kantoridquery}
              refetch={refetch}
            />
          </Dialog>
        </div>
      </div>
      <DataTableMonitor
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
      <UpdateMonitorDialog
        refetch={refetch}
        open={selectedAction !== null && selectedAction.type === "Update"}
        handleCloseDialog={handleCloseDialog}
        currentData={selectedAction?.data}
      />
      <DeleteMonitorDialog
        refetch={refetch}
        open={selectedAction !== null && selectedAction?.type === "Delete"}
        HandleCloseDialog={handleCloseDialog}
        CurrentData={selectedAction?.data}
        title={selectedAction?.data?.nama ?? "product"}
      />
    </div>
  );
}
