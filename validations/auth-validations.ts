import z from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, { message: "Masukkan Email" }).email(),
  password: z.string().min(1, { message: "Masukkan Password" }),
});

export type LoginType = z.infer<typeof loginSchema>;

export const CreateAnalisis = z.object({
  nama: z.string().min(5, { message: "Masukkan Nama Kantah dengan Lengkap" }),
  kantorid: z.string().min(5, { message: "Masukkan Induk dengan Lengkap" }),
  kanwilid: z.string().min(5, { message: "Masukkan Induk dengan Lengkap" }),
  kode: z.coerce.number(),
  nomorsk: z.string().min(5, { message: "Masukkan Nomor SK" }),
  tahun: z.coerce
    .number()
    .int()
    .min(2000, { message: "Masukkan tahun yang valid" }),
  description: z.string().min(10, { message: "Masukkan Analisis" }),
});

export const UpdateAnalisisSchema = z.object({
  nama: z.string().min(5, { message: "Masukkan Nama Kantah dengan Lengkap" }),
  kantorid: z.string().min(1, { message: "Pilih Kantor Pertanahan" }),
  kanwilid: z.string().min(1, { message: "Pilih Kanwil" }),
  kode: z.coerce
    .number()
    .int()
    .positive({ message: "Kode kantor tidak valid" }),
  nomorsk: z.string().min(5, { message: "Masukkan Nomor SK" }),
  tahun: z.coerce
    .number()
    .int()
    .min(2000, { message: "Masukkan tahun yang valid" }),
  description: z.string().min(10, { message: "Masukkan Analisis" }),
});

export type TypeAnalisis = z.infer<typeof CreateAnalisis>;
export type TypeUpdateAnalisisSchema = z.infer<typeof UpdateAnalisisSchema>;
