import MonitoringDataMain from "./_components/database-monitor-main";

export const metadata = {
  title: "Database Monitoring",
  description: "Monitoring Data Anomali",
};

export default function DatabaseMonitoringMain() {
  return (
    <div className="flex-1 w-full h-full p-4 md:p-6 overflow-y-auto">
      <MonitoringDataMain />
    </div>
  );
}
