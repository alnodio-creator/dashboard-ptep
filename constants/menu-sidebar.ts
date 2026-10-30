import {
  Dices,
  ClipboardList,
  FileChartColumn,
  FileChartPie,
  UserStar,
} from "lucide-react";

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
  {
    title: "Progress Capaian ILASPP 2026",
    path: "/Monitoring/monitoring-ilaspp",
    icon: ClipboardList,
  },
  {
    title: "Progress Survey Titik Sample ILASPP 2026",
    path: "/Monitoring/Progres-ilaspp",
    icon: FileChartPie,
  },
];

export const SIDEBAR_MONITORING_BELAJAR = [
  {
    title: "Monitoring Berkas",
    path: "/Monitoring-belajar/monitoring-berkas",
    icon: FileChartColumn,
  },
  {
    title: "Rekap Tahapan",
    path: "/Monitoring-belajar/rekap-tahapan",
    icon: Dices,
  },
];
