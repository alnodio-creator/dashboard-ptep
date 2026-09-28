"use client";

import DataTable from "@/components/commons/data-table";
import DropdownAction from "@/components/commons/dropdown-action";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Header_admin_table } from "@/constants/data-table";
import useDataTable from "@/hooks/use-data-table";
import { createClient } from "@/lib/supabase/client";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import CreateDatabaseAnalisis from "./create-analisis";
import { SelectItemKantor } from "@/components/commons/form-select";
import UpdateKantorDialog from "./update-analisis";
import { TypeUpdateAnalisisSchema } from "@/validations/auth-validations";
import { TypeSelectedKantor } from "@/constants/useForm";
import { DeleteKantorDialog } from "./delete-analisis";
import Link from "next/link";

export default function AdminDatabase() {
  const supabase = createClient();

  const {
    currentPage,
    currentLimit,
    handleChangePage,
    handleChangeLimit,
    currentSearch,
    handleChangeSearch,
  } = useDataTable();

  const QueryData = async () => {
    const Database = await supabase
      .from("kantor")
      .select("*", { count: "exact" })
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

  const {
    data: NilaiTanah,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["QueryNilaiTanah", currentLimit, currentPage, currentSearch],
    queryFn: QueryData,
    placeholderData: keepPreviousData,
  });

  console.log(NilaiTanah);

  const [selectedAction, setSelectedAction] = useState<{
    data: TypeSelectedKantor;
    type: "Update" | "Delete";
  } | null>(null);

  console.log(selectedAction);

  const handleCloseDialog = (open: boolean) => {
    if (!open) {
      setSelectedAction(null);
    }
  };

  const FilterDataTable = useMemo(() => {
    return (NilaiTanah?.data || []).map((result, index) => {
      return [
        currentLimit * (currentPage - 1) + index + 1,

        <Link
          className="text-blue-500 hover:text-blue-800"
          key={result.nomorsk}
          href={`admin/database-monitoring/${encodeURIComponent(result.nomorsk)}`}
        >
          {result.nama}
        </Link>,

        result.nomorsk,

        result.tahun,

        <div
          key={`description-${result.nomorsk}-${index}`}
          className="max-w-xs"
        >
          <p className="text-sm text-gray-500 wrap-break-word whitespace-normal">
            {result.description}
          </p>
        </div>,

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
            <CreateDatabaseAnalisis refetch={refetch} />
          </Dialog>
        </div>
      </div>
      <DataTable
        title="Database Nilai Tanah"
        description="Monitoring dan pengelolaan data nilai tanah yang tersimpan dalam database."
        header={Header_admin_table}
        data={FilterDataTable}
        isLoading={isLoading}
        totalData={totalData}
        totalPages={totalPages}
        currentPage={currentPage}
        currentLimit={currentLimit}
        onChangePage={handleChangePage}
        onChangeLimit={handleChangeLimit}
      />
      <UpdateKantorDialog
        refetch={refetch}
        open={selectedAction !== null && selectedAction.type === "Update"}
        handleCloseDialog={handleCloseDialog}
        currentData={selectedAction?.data}
      />
      <DeleteKantorDialog
        refetch={refetch}
        open={selectedAction !== null && selectedAction?.type === "Delete"}
        HandleCloseDialog={handleCloseDialog}
        CurrentData={selectedAction?.data}
        title={selectedAction?.data?.nama ?? "product"}
      />
    </div>
  );
}
