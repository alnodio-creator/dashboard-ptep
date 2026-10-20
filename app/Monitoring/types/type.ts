export type Kegiatan = {
  no_berkas: string | null;
  kode_kegiatan: string | null;
  nama: string | null;
  Kabupaten: string | null;
  nama_kegiatan: string | null;
  nama_tahapan: string | null;
  anggaran_tahun: number | null;
  anggaran: string | number | null;
  target_luasan: number | null;
  nama_anggaran: string | null;
  skala: string | null;
  nomor_kontrak: string | null;
  jenis_kontrak: string | null;
  nama_perusahaan: string | null;
  penanggung_jawab: string | null;
};

export type ApiResponse = {
  success: boolean;
  total: number;
  data: Kegiatan[];
  message?: string;
};

export type FilterState = {
  wilayah: string;
  tahun: string;
  sumber: string;
  tahapan: string;
};
