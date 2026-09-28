import {
  defaultValuesCreateAnalisis,
  StateDatabase,
} from "@/constants/useForm";
import { CreateAnalisis } from "@/validations/auth-validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createDatabaseFunction } from "./actions";
import z from "zod";
import CommonsForm from "@/components/commons/form-database";

export default function CreateDatabaseAnalisis({
  refetch,
}: {
  refetch: () => void;
}) {
  const getDataKantah = async () => {
    const response = await fetch("api/kantor-pertanahan");
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

  const form = useForm<z.input<typeof CreateAnalisis>>({
    resolver: zodResolver(CreateAnalisis),
    defaultValues: defaultValuesCreateAnalisis,
  });

  const [stateCreateDatabase, CreateFunction, isPending] = useActionState(
    createDatabaseFunction,
    StateDatabase,
  );

  const onSubmit = form.handleSubmit((data) => {
    console.log(data);

    const formData = new FormData();

    formData.append("nama", data.nama);
    formData.append("kantorid", data.kantorid);
    formData.append("kanwilid", data.kanwilid);
    formData.append("nomorsk", data.nomorsk);
    formData.append("tahun", String(data.tahun));
    formData.append("description", data.description);
    formData.append("kode", String(data.kode));

    startTransition(() => {
      CreateFunction(formData);
    });
  });

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
      <CommonsForm
        form={form}
        onSubmit={onSubmit}
        isLoading={isPending}
        type="Create"
        selectItem={Data_Kantah ?? []}
      />
    </div>
  );
}
