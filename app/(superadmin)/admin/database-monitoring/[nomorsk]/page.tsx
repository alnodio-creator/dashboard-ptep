import { use } from "react";
import Monitoring from "../_components/database-monitor";

export const metadata = {
  title: "Database Monitoring",
  description: "Perubahan Database",
};

export default function DatabaseMonitoring({
  params,
}: {
  params: Promise<{ nomorsk: string }>;
}) {
  const { nomorsk } = use(params);

  const decodedNomorsk = decodeURIComponent(nomorsk);

  return (
    <div className="flex-1 w-full h-full p-4 md:p-6 overflow-y-auto">
      <Monitoring nomorsk={decodedNomorsk} />
    </div>
  );
}
