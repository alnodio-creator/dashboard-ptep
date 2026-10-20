"use client";

import dynamic from "next/dynamic";
import PageDashboard from "./_components/dashboard-page";

const MapLibreClient = dynamic(() => import("./_components/Map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-125 items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-500">
      Memuat Peta MapLibre...
    </div>
  ),
});

export default function Page() {
  return <PageDashboard MapLibreClient={MapLibreClient} />;
}
