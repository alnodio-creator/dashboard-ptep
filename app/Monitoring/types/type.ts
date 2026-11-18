export type Kegiatan = {
  no_berkas: string | null;
  kode_kegiatan: string | null;
  kanwilid: string | null;
  kantorid: string | null;
  namakantor: string | null;
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

export type FilterState = {
  wilayah: string;
  tahun: string;
  sumber: string;
  tahapan: string;
};

export type Tahapan = {
  tahapan_kegiatan_id: number;
  nama_tahapan: string;
  urutan: number;
  bobot: number;
  realisasi: number | null;
  target_titik: number;
  total_approved: number;
  sesuai: number;
  tidak_sesuai: number;
  belum_diperiksa: number;
  total_checklist: number;
  std_sesuai: string | number; // tambahan
  jumlah_zona: string | number; // tambahan
  masuk_tahapan_at: string | null;
  keluar_tahapan_at: string | null;
  tgl_mulai_timeline: string | null;
  tgl_selesai_timeline: string | null;
  status_mulai: string | null;
  status_selesai: string | null;
};

export type KabupatenDetail = {
  berkas_id: number;
  no_berkas: string;
  kode_kegiatan: string;
  skala: string;
  kabupaten: string;
  realisasi_fisik: number;
  seluruh_tahapan_selesai: boolean;
  tahapan: Tahapan[];
};

export type ContractItem = {
  nama_perusahaan: string;
  no_kontrak: string;
  anggaran: number;
  kanwilid: string;
  total_berkas: number;
  realisasi_fisik: string | number;
  seluruh_berkas_selesai: boolean;
  detail: KabupatenDetail[];
};

export type ApiResponse = {
  success: boolean;
  message: string;
  total: number;
  data: ContractItem[];
};

export type StatusFilter = "Filter Status" | "selesai" | "belum";
