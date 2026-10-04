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

export const CreateAnalisisDetail = z.object({
  nama: z.string().min(5, { message: "Masukkan Nama Kantah dengan Lengkap" }),
  kantorid: z.string().min(5, { message: "Masukkan Induk dengan Lengkap" }),
  gunalahan: z
    .string()
    .min(5, { message: "Masukkan Gunalahan dengan Lengkap" }),
  namaobj: z.string().min(5, { message: "Masukkan namaobj dengan Lengkap" }),
  jumlahzona: z.coerce.number().int().positive({
    message: "Jumlah zona tidak valid",
  }),

  ratanilai: z.coerce.number().positive({
    message: "Rata-rata nilai tidak valid",
  }),

  tahun: z.coerce.number().int().min(2000, {
    message: "Tahun tidak valid",
  }),

  nomorsk: z.string().min(5, {
    message: "Masukkan Nomor SK",
  }),
});

export const CreateAnalisisDetailForm = z.object({
  gunalahan: z
    .string()
    .min(5, { message: "Masukkan Gunalahan dengan Lengkap" }),

  namaobj: z.string().min(5, { message: "Masukkan namaobj dengan Lengkap" }),

  jumlahzona: z.coerce.number().int().positive({
    message: "Jumlah zona tidak valid",
  }),

  ratanilai: z.coerce.number().positive({
    message: "Rata-rata nilai tidak valid",
  }),

  tahun: z.coerce.number().int().min(2000, {
    message: "Tahun tidak valid",
  }),
});

export type TypeAnalisisDetail = z.infer<typeof CreateAnalisisDetail>;
export type TypeAnalisis = z.infer<typeof CreateAnalisis>;
export type TypeUpdateAnalisisSchema = z.infer<typeof UpdateAnalisisSchema>;
