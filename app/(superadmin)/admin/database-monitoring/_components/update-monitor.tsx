"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Dialog } from "@/components/ui/dialog";
import { CreateAnalisisDetail } from "@/validations/auth-validations";
import z from "zod";
import { StateUpdate, typeCurrentMonitor } from "@/constants/useForm";
import { UpdateMonitoringDetail } from "./actions";
import CommonsFormMonitoring from "./form-database";

export default function UpdateMonitorDialog({
  refetch,
  open,
  currentData,
  handleCloseDialog,
}: {
  refetch: () => Promise<unknown>;
  open?: boolean;
  currentData?: typeCurrentMonitor | null;
  handleCloseDialog: (open: boolean) => void;
}) {
  const form = useForm<z.input<typeof CreateAnalisisDetail>>({
    resolver: zodResolver(CreateAnalisisDetail),
  });

  const [UpdateAnalisisState, AnalisisActions, isPendingActions] =
    useActionState(UpdateMonitoringDetail, StateUpdate);

  const onSubmit = form.handleSubmit(
    (data) => {
      if (!currentData) {
        toast.error("Data yang akan diupdate tidak ditemukan");
        return;
      }

      const formData = new FormData();

      formData.append("nama", currentData.nama ?? "");
      formData.append("kantorid", currentData.kantorid ?? "");
      formData.append("gunalahan", data.gunalahan ?? "");
      formData.append("nomorsk", data.nomorsk ?? "");
      formData.append("tahun", String(currentData.tahun ?? ""));
      formData.append("namaobj", data.namaobj ?? "");
      formData.append("jumlahzona", String(data.jumlahzona ?? 0));
      formData.append("ratanilai", String(data.ratanilai ?? 0));
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
      form.setValue("gunalahan", currentData.gunalahan);
      form.setValue("namaobj", currentData.namaobj);
      form.setValue("jumlahzona", currentData.jumlahzona);
      form.setValue("ratanilai", currentData.ratanilai);
      form.setValue("nomorsk", currentData.nomorsk);
      form.setValue("tahun", currentData.tahun);
    }
  }, [currentData]);

  return (
    <Dialog open={open} onOpenChange={handleCloseDialog}>
      <CommonsFormMonitoring
        form={form}
        onSubmit={onSubmit}
        isLoading={isPendingActions}
        type="Update"
      />
    </Dialog>
  );
}
