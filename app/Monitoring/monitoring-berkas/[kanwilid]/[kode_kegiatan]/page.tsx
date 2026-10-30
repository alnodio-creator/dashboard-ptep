import { MonitoringCapaianIlaspp } from "@/app/Monitoring/_components-ilaspp/monitoring-capaian-ilaspp";
import { MonitoringCapaianBerkas } from "@/app/Monitoring/_components/monitoring-capaian-berkas";

type PageProps = {
  params: Promise<{
    kanwilid: string;
    kode_kegiatan: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { kanwilid, kode_kegiatan } = await params;

  return (
    <main className="w-full min-w-0 space-y-6 p-3 sm:p-5 lg:p-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">
          Detail Rekap Tahapan
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Monitoring progres dan ketepatan waktu setiap tahapan berkas.
        </p>
      </div>

      <div className="w-full min-w-0">
        <MonitoringCapaianBerkas
          kanwilid={kanwilid}
          kode_kegiatan={kode_kegiatan}
        />
      </div>
    </main>
  );
}
