"use server";

import {
  INITIAL_STATE_LOGIN,
  prevStateLogin,
} from "@/constants/auth-constants";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/validations/auth-validations";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function LoginAction(
  prevState: prevStateLogin,
  formData: FormData | null,
) {
  console.log("masuk sini brow");

  if (!formData) return INITIAL_STATE_LOGIN;

  const validatedFields = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  console.log(validatedFields.data);
  if (!validatedFields.success) {
    return {
      status: "error",
      errors: { ...validatedFields.error.flatten().fieldErrors },
    };
  }

  const supabase = await createClient();

  const {
    error,
    data: { user },
  } = await supabase.auth.signInWithPassword(validatedFields.data);

  if (error) {
    return {
      status: "error",
      errors: { ...prevState.errors, _form: [error.message] },
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id)
    .single();

  if (profile) {
    console.log("PROFILE DARI DB:", profile);

    const cookiesStore = await cookies();

    cookiesStore.set("user_profile", JSON.stringify(profile), {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });

    console.log("COOKIE BERHASIL DISET");
  }

  revalidatePath("/", "layout");
  redirect("/");
}
