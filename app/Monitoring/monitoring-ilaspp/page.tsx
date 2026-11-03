import { useQuery } from "@tanstack/react-query";
import MonitoringRealisasiKontrakPage from "../_components-ilaspp/revisi-percobaan";
import { basePath } from "@/constants/menu-sidebar";
type Tahapan = {
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
};

type KabupatenDetail = {
  berkas_id: number;
  no_berkas: string;
  kode_kegiatan: string;
  skala: string;
  kabupaten: string;
  realisasi_fisik: number;
  seluruh_tahapan_selesai: boolean;
  tahapan: Tahapan[];
};

type ContractItem = {
  nama_perusahaan: string;
  no_kontrak: string;
  anggaran: number;
  kanwilid: string;
  total_berkas: number;
  realisasi_fisik: string | number;
  seluruh_berkas_selesai: boolean;
  detail: KabupatenDetail[];
};

type ApiResponse = {
  success: boolean;
  message: string;
  total: number;
  data: ContractItem[];
};
export const dynamic = "force-dynamic";
export default function Page() {
  return (
    <main className="w-full min-w-0 max-w-full overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full min-w-0 max-w-[1700px]">
        <MonitoringRealisasiKontrakPage />
      </div>
    </main>
  );
}
