"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";

import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Dialog } from "@/components/ui/dialog";
import {
  UpdateAnalisisSchema,
} from "@/validations/auth-validations";
import z from "zod";
import { StateUpdate, TypeSelectedKantor } from "@/constants/useForm";
import { UpdateAnalisis } from "./actions";
import FormDatabaseUpdate from "./form-database-update";

export default function UpdateKantorDialog({
  refetch,
  open,
  currentData,
  handleCloseDialog,
}: {
  refetch: () => void;
  open?: boolean;
  currentData?: TypeSelectedKantor | null;
  handleCloseDialog: (open: boolean) => void;
}) {
  // Query Data disini

  const supabase = createClient();

  const GetDataType = async () => {
    const DataKantorUpdate = await supabase
      .from("kantor")
      .select("*", { count: "exact" })
      .order("id");
    if (DataKantorUpdate.error) {
      toast.error("Gagal dalam fetch data Tipe Product", {
        description: DataKantorUpdate?.error?.message,
      });
    }
    return DataKantorUpdate;
  };

  const { data: DataKantorUpdateQuery } = useQuery({
    queryKey: ["product_types"],
    queryFn: GetDataType,
  });

  console.log(DataKantorUpdateQuery);

  const SelectedDataKantorUpdate = useMemo(() => {
    return DataKantorUpdateQuery?.data ?? [];
  }, [DataKantorUpdateQuery]);

  const form = useForm<z.input<typeof UpdateAnalisisSchema>>({
    resolver: zodResolver(UpdateAnalisisSchema),
  });

  const [UpdateAnalisisState, AnalisisActions, isPendingActions] =
    useActionState(UpdateAnalisis, StateUpdate);

  const onSubmit = form.handleSubmit(
    (data) => {
      console.log("✅ SUBMIT VALID", data);

      const formData = new FormData();

      formData.append("nama", data.nama);
      formData.append("kantorid", data.kantorid);
      formData.append("kanwilid", data.kanwilid);
      formData.append("nomorsk", data.nomorsk);
      formData.append("tahun", String(data.tahun));
      formData.append("description", data.description);
      formData.append("kode", String(data.kode));
      formData.append("id", String(currentData!.id));

      startTransition(() => {
        AnalisisActions(formData);
      });
    },
    (errors) => {
      console.log("❌ SUBMIT INVALID");
      console.log(errors);
    },
  );

  useEffect(() => {
    if (UpdateAnalisisState?.status === "error") {
      toast.error("Update Product Gagal", {
        description: UpdateAnalisisState?.errors?._form?.[0],
      });
    }
    if (UpdateAnalisisState.status === "success") {
      toast.success("Create Product Success");
      form.reset();

      document.querySelector<HTMLButtonElement>('[data-state="open"]')?.click();
      refetch();
    }
  }, [UpdateAnalisisState]);

  useEffect(() => {
    if (currentData) {
      form.setValue("nama", currentData.nama);
      form.setValue("kantorid", currentData.kantorid);
      form.setValue("kanwilid", currentData.kanwilid);
      form.setValue("nomorsk", currentData.nomorsk);
      form.setValue("description", currentData.description);
      form.setValue("kode", currentData.kode);
      form.setValue("tahun", currentData.tahun);
    }
  }, [currentData]);

  return (
    <Dialog open={open} onOpenChange={handleCloseDialog}>
      <FormDatabaseUpdate
        form={form}
        onSubmit={onSubmit}
        isLoading={isPendingActions}
        type="Update"
        selectItem={SelectedDataKantorUpdate ?? []}
      />
    </Dialog>
  );
}
