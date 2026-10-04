import { ReactNode } from "react";

export const defaultValuesCreateAnalisis = {
  nama: "",
  nomorsk: "",
  tahun: 0,
  description: "",
};

export const StateDatabase = {
  status: "idle",
  errors: {
    nama: [],
    nomorsk: [],
    tahun: [],
    description: [],
    _form: [],
  },
};

export type prevStateCreateDatabase = {
  status?: string;
  errors: {
    nama?: string[];
    nomorsk?: string[];
    tahun?: string[];
    description?: string[];
    _form?: string[];
  };
};

export const StateUpdate = {
  status: "idle",
  errors: {
    nama: [],
    nomorsk: [],
    tahun: [],
    description: [],
    _form: [],
  },
};

export type TypeUpdateAnalisis = {
  kantorid: string;
  kode: string;
  induk: string;
  nama: string;
  tipekantorid: string;
  description: string;
  tahun: number;
};

export type TypeSelectedKantor = {
  kantorid: string;
  nama: string;
  kode: number;
  kanwilid: string;
  nomorsk: string;
  description: string;
  tahun: number;
  id: number;
};

export type TypeKantorPertanahan = {
  kantorid: string;
  kode: string;
  induk: string;
  nama: string;
  tipekantorid: string;
};

export type TypeMonitoringAnomaliData = {
  nama: string;
  kantorid: string;
  nomorsk: string | null;
  validsampai: string | null;
  jumlah_data: number;
  total_nilai_tanah: number | null;
  rata_nilai_tanah: number | null;
};

export type DataTableRow = {
  cells: (string | ReactNode)[];
  isAnomaly?: boolean;
  anomalyReasons?: string[];
};

export const defaultValuesCreateAnalisisDetail = {
  nama: "",
  kantorid: "",
  gunalahan: "",
  namaobj: "",
  jumlahzona: 0,
  ratanilai: 0,
  tahun: new Date().getFullYear(),
  nomorsk: "",
};
export const StateAnalisisDetail = {
  status: "idle",
  errors: {
    nama: [],
    kantorid: [],
    gunalahan: [],
    namaobj: [],
    jumlahzona: [],
    ratanilai: [],
    tahun: [],
    nomorsk: [],
    _form: [],
  },
};

export type prevStateCreateDatabaseDetail = {
  status?: string;
  errors: {
    nama?: string[];
    kantorid?: string[];
    gunalahan?: string[];
    namaobj?: string[];
    jumlahzona?: string[];
    ratanilai?: string[];
    tahun?: string[];
    nomorsk?: string[];
    _form?: string[];
  };
};

export type typeCurrentMonitor = {
  nama: string;
  kantorid: string;
  gunalahan: string;
  namaobj: string;
  jumlahzona: number;
  ratanilai: number;
  tahun: number;
  nomorsk: string;
  id: number;
};
