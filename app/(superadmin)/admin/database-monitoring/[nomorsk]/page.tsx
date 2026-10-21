import Monitoring from "../_components/database-monitor";

export const metadata = {
  title: "Database Monitoring",
  description: "Perubahan Database",
};

export default async function DatabaseMonitoring({
  searchParams,
}: {
  searchParams: Promise<{ nomorsk?: string }>;
}) {
  const { nomorsk = "" } = await searchParams;

  return (
    <div className="flex-1 w-full h-full p-4 md:p-6 overflow-y-auto">
      <Monitoring nomorsk={nomorsk} />
    </div>
  );
}
