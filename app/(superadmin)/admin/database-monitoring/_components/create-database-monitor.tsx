import {
  defaultValuesCreateAnalisisDetail,
  StateAnalisisDetail,
} from "@/constants/useForm";
import {
  CreateAnalisisDetail,
  CreateAnalisisDetailForm,
} from "@/validations/auth-validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { createDatabaseFunctionDetail } from "./actions";
import CommonsFormMonitoring from "./form-database";

export default function CreateMonitorDetail({
  refetch,
  kantah,
  nomorsk,
  kantorid,
}: {
  refetch: () => void;
  kantah: string;
  nomorsk: string;
  kantorid: string;
}) {
  const form = useForm<z.input<typeof CreateAnalisisDetailForm>>({
    resolver: zodResolver(CreateAnalisisDetailForm),
    defaultValues: {
      gunalahan: "",
      namaobj: "",
      jumlahzona: undefined,
      ratanilai: undefined,
      tahun: undefined,
    },
  });

  const [stateCreateDatabase, CreateFunction, isPending] = useActionState(
    createDatabaseFunctionDetail,
    StateAnalisisDetail,
  );

  const onSubmit = form.handleSubmit(
    (data) => {
      console.log("✅ SUBMIT VALID", data);

      const formData = new FormData();

      formData.append("nama", kantah);
      formData.append("kantorid", kantorid);
      formData.append("gunalahan", data.gunalahan);
      formData.append("nomorsk", nomorsk);
      formData.append("tahun", String(data.tahun));
      formData.append("namaobj", data.namaobj);
      formData.append("jumlahzona", String(data.jumlahzona));
      formData.append("ratanilai", String(data.ratanilai));

      console.log("🚀 FORM DATA");

      for (const [key, value] of formData.entries()) {
        console.log(key, value);
      }

      startTransition(() => {
        CreateFunction(formData);
      });
    },
    (errors) => {
      console.log("❌ VALIDATION ERROR:", errors);
    },
  );

  useEffect(() => {
    if (stateCreateDatabase?.status === "error") {
      toast.error("Create Product Failed", {
        description: stateCreateDatabase.errors?._form?.[0],
      });
    }

    if (stateCreateDatabase?.status === "success") {
      toast.success("Create Product Success");
      form.reset();
      document.querySelector<HTMLButtonElement>('[data-state="open"]')?.click();
      refetch();
    }
  }, [stateCreateDatabase]);

  return (
    <div>
      <CommonsFormMonitoring
        form={form}
        onSubmit={onSubmit}
        isLoading={isPending}
        type="Create"
      />
    </div>
  );
}
