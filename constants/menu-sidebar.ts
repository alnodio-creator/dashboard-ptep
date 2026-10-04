import { Dices, FileChartColumn, FileChartPie, UserStar } from "lucide-react";

export const SIDEBAR_DASHBOARD = [
  {
    title: "Admin Database",
    path: "/admin",
    icon: UserStar,
  },
  {
    title: "Data Analisis",
    path: "/admin/database-monitoring",
    icon: FileChartColumn,
  },
  {
    title: "Monitoring Data",
    path: "/admin/monitoring-data",
    icon: Dices,
  },
  {
    title: "Monitoring Dashboard",
    path: "/admin/monitoring-dashboard",
    icon: FileChartPie,
  },
];

export const SelectedGunalahan = [{ comersial: {} }];
