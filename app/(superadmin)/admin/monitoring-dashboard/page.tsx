import DashboardMonitor from "./_components/dashboard-monitor";

export const metadata = {
  title: "Admin Dashboard Monitoring",
};

export default function MonitoringDashboard() {
  return (
    <div className="flex min-h-screen w-full justify-center">
      <div className="w-full max-w-[1600px]">
        <DashboardMonitor />
      </div>
    </div>
  );
}
