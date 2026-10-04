"use server";

import {
  prevStateCreateDatabaseDetail,
  StateAnalisisDetail,
} from "@/constants/useForm";
import { createClient } from "@/lib/supabase/server";
import { CreateAnalisisDetail } from "@/validations/auth-validations";

export async function createDatabaseFunctionDetail(
  prevState: prevStateCreateDatabaseDetail,
  formData: FormData | null,
) {
  if (!formData) return StateAnalisisDetail;

  const validatedFields = CreateAnalisisDetail.safeParse({
    nama: formData.get("nama"),
    kantorid: formData.get("kantorid"),
    gunalahan: formData.get("gunalahan"),
    namaobj: formData.get("namaobj"),
    jumlahzona: Number(formData.get("jumlahzona")),
    ratanilai: Number(formData.get("ratanilai")),
    tahun: Number(formData.get("tahun")),
    nomorsk: formData.get("nomorsk"),
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
    .from("nilaitanah")
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

export async function UpdateMonitoringDetail(
  prevState: prevStateCreateDatabaseDetail,
  formData: FormData | null,
) {
  if (!formData) return StateAnalisisDetail;

  /**
   * =========================
   * VALIDASI FORM
   * =========================
   */
  const validatedFields = CreateAnalisisDetail.safeParse({
    nama: formData.get("nama"),
    kantorid: formData.get("kantorid"),
    gunalahan: formData.get("gunalahan"),
    nomorsk: formData.get("nomorsk"),
    tahun: Number(formData.get("tahun")),
    namaobj: formData.get("namaobj"),
    jumlahzona: Number(formData.get("jumlahzona")),
    ratanilai: Number(formData.get("ratanilai")),
    id: formData.get("id"),
  });

  /**
   * =========================
   * VALIDATION ERROR
   * =========================
   */
  if (!validatedFields.success) {
    return {
      status: "error",
      errors: {
        ...validatedFields.error.flatten().fieldErrors,
        _form: ["Gagal validasi data"],
      },
    };
  }

  /**
   * =========================
   * SUPABASE
   * =========================
   */
  const supabase = await createClient();
  /**
   * =========================
   * UPDATE DATA
   * =========================
   */
  const { error } = await supabase
    .from("nilaitanah")
    .update({
      nama: validatedFields.data.nama,
      kantorid: validatedFields.data.kantorid,
      gunalahan: validatedFields.data.gunalahan,
      nomorsk: validatedFields.data.nomorsk,
      tahun: validatedFields.data.tahun,
      namaobj: validatedFields.data.namaobj,
      jumlahzona: validatedFields.data.jumlahzona,
      ratanilai: validatedFields.data.ratanilai,
    })
    .eq("id", formData.get("id"))
    .select();
  /**
   * =========================
   * DATABASE ERROR
   * =========================
   */
  if (error) {
    return {
      status: "error",
      errors: {
        ...prevState.errors,
        _form: [
          `${error.code} | ${error.message} | ${
            error.details ?? ""
          } | ${error.hint ?? ""}`,
        ],
      },
    };
  }

  /**
   * =========================
   * SUCCESS
   * =========================
   */
  return {
    status: "success",
    errors: {
      ...prevState.errors,
    },
  };
}

export async function DeleteMonitorDetail(
  prevState: prevStateCreateDatabaseDetail,
  formData: FormData,
) {
  if (!formData) return StateAnalisisDetail;
  const supabase = await createClient();

  const { error } = await supabase
    .from("nilaitanah")
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
