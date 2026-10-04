import MonitoringData from "./_components/monitoring-data";

export const metadata = {
  title: "Database Monitoring",
  description: "Monitoring Data Anomali",
};

export default function Admin() {
  return (
    <div className="flex-1 w-full h-full p-4 md:p-6 overflow-y-auto">
      <MonitoringData />
    </div>
  );
}
