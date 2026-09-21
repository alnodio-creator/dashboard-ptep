import z from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, { message: "Masukkan Email" }).email(),
  password: z.string().min(1, { message: "Masukkan Password" }),
});

export type LoginType = z.infer<typeof loginSchema>;
