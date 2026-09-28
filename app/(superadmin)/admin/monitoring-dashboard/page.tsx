import DashboardMonitor from "./_components/dashboard-monitor";

export const metadata = {
  title: "Admin Dashboard Monitoring",
};

export default function MonitoringDashboard() {
  return (
    <div className="border-2 rounded-3xl">
      <DashboardMonitor />
    </div>
  );
}
