import Link from "next/link";
import ContractDetail from "../../_components-ilaspp/revisi-contract-detail";
import { ArrowLeft } from "lucide-react";

type PageProps = {
  searchParams: Promise<{
    nomor_kontrak?: string;
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  const { nomor_kontrak } = await searchParams;

  return (
    <main className="w-full min-w-0 space-y-6 p-3 sm:p-5 lg:p-6">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="flex items-center gap-4 px-3 py-3 sm:px-5 lg:px-6">
          <Link
            href="/Monitoring/monitoring-ilaspp"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">
              Detail Rekap Tahapan
            </h1>

            <p className="hidden text-xs text-muted-foreground sm:block">
              Monitoring progres dan ketepatan waktu setiap tahapan berkas.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full min-w-0">
        {nomor_kontrak ? (
          <ContractDetail nomor_kontrak={nomor_kontrak} />
        ) : (
          <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
            Nomor kontrak tidak ditemukan.
          </div>
        )}
      </div>
    </main>
  );
}
