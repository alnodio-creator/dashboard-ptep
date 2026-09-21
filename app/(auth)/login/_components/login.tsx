"use client";
import { INITIAL_LOGIN, INITIAL_STATE_LOGIN } from "@/constants/auth-constants";
import { loginSchema, LoginType } from "@/validations/auth-validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { LoginAction } from "../actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Loader } from "lucide-react";
import { FieldGroup } from "@/components/ui/field";

import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/commons/form-input";
import { toast } from "sonner";

export function Login() {
  const form = useForm<LoginType>({
    resolver: zodResolver(loginSchema),
    defaultValues: INITIAL_LOGIN,
  });

  const [LoginState, LoginActionState, isPending] = useActionState(
    LoginAction,
    INITIAL_STATE_LOGIN,
  );

  const onSubmit = form.handleSubmit((data) => {
    const formData = new FormData();
    formData.append("email", data.email);
    formData.append("password", data.password);

    startTransition(() => {
      LoginActionState(formData);
    });
  });

  useEffect(() => {
    if (LoginState.status === "error") {
      toast.error("Login Gagal", {
        description: LoginState.errors?.email,
      });
      startTransition(() => {
        LoginActionState(null);
      });
    }
  }, [LoginState, LoginActionState]);

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">LOGIN DASHBOARD</CardTitle>
        <CardDescription>Login untuk akses Dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" id="form-rhf-demo" onSubmit={onSubmit}>
          <FieldGroup>
            <FormInput
              form={form}
              label="Email"
              name="email"
              placeholder="Masukkan Email Anda"
              type="email"
            />
            <FormInput
              form={form}
              label="Password"
              name="password"
              placeholder="Masukkan Password Anda"
              type="password"
            />
          </FieldGroup>
          <Button type="submit">
            {isPending ? <Loader className="animate-spin" /> : "Login"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
