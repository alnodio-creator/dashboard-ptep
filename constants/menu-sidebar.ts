import { Dices, FileChartColumn, FileChartPie, UserStar } from "lucide-react";

export const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH ?? "/sipenta/tatausaha-dashboard";

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

export const SIDEBAR_MONITORING = [
  {
    title: "Monitoring Berkas",
    path: "/Monitoring/monitoring-berkas",
    icon: FileChartColumn,
  },
  {
    title: "Rekap Tahapan",
    path: "/Monitoring/rekap-tahapan",
    icon: Dices,
  },
];
