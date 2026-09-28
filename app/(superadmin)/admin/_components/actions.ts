"use server";

import {
  prevStateCreateDatabase,
  StateDatabase,
  StateUpdate,
} from "@/constants/useForm";
import { createClient } from "@/lib/supabase/server";
import {
  CreateAnalisis,
  UpdateAnalisisSchema,
} from "@/validations/auth-validations";

export async function createDatabaseFunction(
  prevState: prevStateCreateDatabase,
  formData: FormData | null,
) {
  if (!formData) return StateDatabase;

  const validatedFields = CreateAnalisis.safeParse({
    nama: formData.get("nama"),
    nomorsk: formData.get("nomorsk"),
    tahun: formData.get("tahun"),
    description: formData.get("description"),
    kantorid: formData.get("kantorid"),
    kanwilid: formData.get("kanwilid"),
    kode: formData.get("kode"),
  });

  if (!validatedFields.success) {
    return {
      status: "error",
      errors: {
        ...validatedFields.error.flatten().fieldErrors,
        _form: ["gagal validasi data"],
      },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("kantor")
    .insert(validatedFields.data)
    .select();

  if (error) {
    console.log(JSON.stringify(error, null, 2));

    return {
      status: "error",
      errors: {
        ...prevState.errors,
        _form: [
          `${error.code} | ${error.message} | ${error.details ?? ""} | ${error.hint ?? ""}`,
        ],
      },
    };
  }

  return {
    status: "success",
    errors: {
      ...prevState.errors,
    },
  };
}

export async function UpdateAnalisis(
  prevState: prevStateCreateDatabase,
  formData: FormData | null,
) {
  if (!formData) return StateUpdate;

  const validatedFields = UpdateAnalisisSchema.safeParse({
    nama: formData.get("nama"),
    nomorsk: formData.get("nomorsk"),
    tahun: formData.get("tahun"),
    description: formData.get("description"),
    kantorid: formData.get("kantorid"),
    kanwilid: formData.get("kanwilid"),
    kode: formData.get("kode"),
    id: formData.get("id"),
  });

  if (!validatedFields.success) {
    return {
      status: "error",
      errors: {
        ...validatedFields.error.flatten().fieldErrors,
        _form: ["gagal validasi data"],
      },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("kantor")
    .update({
      nama: validatedFields.data.nama,
      nomorsk: validatedFields.data.nomorsk,
      tahun: validatedFields.data.tahun,
      description: validatedFields.data.description,
      kantorid: validatedFields.data.kantorid,
      kanwilid: validatedFields.data.kanwilid,
      kode: validatedFields.data.kode,
    })
    .eq("id", formData.get("id"));

  if (error) {
    return {
      status: "error",
      errors: {
        ...prevState.errors,
        _form: [
          `${error.code} | ${error.message} | ${error.details ?? ""} | ${error.hint ?? ""}`,
        ],
      },
    };
  }

  return {
    status: "success",
    errors: {
      ...prevState.errors,
    },
  };
}

export async function DeleteKantor(
  prevState: prevStateCreateDatabase,
  formData: FormData,
) {
  if (!formData) return StateUpdate;
  const supabase = await createClient();

  const { error } = await supabase
    .from("kantor")
    .delete()
    .eq("id", formData.get("id"));

  if (error) {
    return {
      status: "error",
      errors: { ...prevState.errors, _form: [error.message] },
    };
  }

  return {
    status: "success",
    errors: {
      ...prevState.errors,
    },
  };
}
