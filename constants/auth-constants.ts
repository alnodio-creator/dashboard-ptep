import { ChartConfig } from "@/components/ui/chart";

export const INITIAL_LOGIN = {
  email: "",
  password: "",
};

export const INITIAL_STATE_LOGIN = {
  status: "idle",
  errors: {
    email: [],
    password: [],
    _form: [],
  },
};

export type prevStateLogin = {
  status?: string;
  errors?: {
    email?: string[];
    password?: string[];
    _form?: string[];
  };
};

export type NilaiTanah = {
  id: string;
  nama: string;
  gunalahan: string;
  tahun: number;
  ratanilai: number;
};

export const formatRupiah = (value: number) => {
  if (value >= 1_000_000_000_000) {
    return `Rp${(value / 1_000_000_000_000).toFixed(2)} T`;
  }

  if (value >= 1_000_000_000) {
    return `Rp${(value / 1_000_000_000).toFixed(2)} M`;
  }

  if (value >= 1_000_000) {
    return `Rp${(value / 1_000_000).toFixed(2)} Jt`;
  }

  if (value >= 1_000) {
    return `Rp${(value / 1_000).toFixed(2)} Rb`;
  }

  return `Rp${value.toLocaleString("id-ID")}`;
};

export const chartConfig = {
  Jumlahzona: {
    label: "Jumlah Zona",
    color: "#2563EB",
  },

  Permukiman: {
    label: "Permukiman",
    color: "#2563EB",
  },

  "Perdagangan dan Jasa": {
    label: "Perdagangan dan Jasa",
    color: "#3B82F6",
  },

  Industri: {
    label: "Industri",
    color: "#60A5FA",
  },

  Pertanian: {
    label: "Pertanian",
    color: "#93C5FD",
  },

  Other: {
    label: "Other",
    color: "#BFDBFE",
  },
} satisfies ChartConfig;

export const ColorGunalahan = {
  "fill-color": [
    "match",
    ["get", "NAMOBJ"],

    "Hortikultura",
    "#65a30d",

    "Kawasan Peruntukan Industri",
    "#64748b",

    "Pemakaman",
    "#166534",

    "Pembangkitan Tenaga Listrik",
    "#dc2626",

    "Perdagangan dan Jasa Skala Kota",
    "#2563eb",

    "Perdagangan dan Jasa Skala SWP",
    "#3b82f6",

    "Perdagangan dan Jasa Skala WP",
    "#60a5fa",

    "Perikanan Budi Daya",
    "#0891b2",

    "Perkantoran",
    "#7c3aed",

    "Perlindungan Setempat",
    "#22c55e",

    "Pertahanan dan Keamanan",
    "#1e293b",

    "Perumahan Kepadatan Sangat Tinggi",
    "#f97316",

    "Perumahan Kepadatan Tinggi",
    "#fb7185",

    "Rimba Kota",
    "#15803d",

    "SPU Skala Kecamatan",
    "#a855f7",

    "SPU Skala Kelurahan",
    "#c084fc",

    "SPU Skala Kota",
    "#9333ea",

    "Taman Kecamatan",
    "#84cc16",

    "Taman Kelurahan",
    "#bef264",

    "Taman Kota",
    "#4ade80",

    "Taman RT",
    "#bbf7d0",

    "Taman RW",
    "#86efac",

    "#94a3b8",
  ],

  "fill-opacity": 0.85,
  // "fill-outline-color": "#ffffff",
};

type GeoJSONPosition = [number, number];

type GeoJSONPolygonCoordinates = GeoJSONPosition[][];

type GeoJSONMultiPolygonCoordinates = GeoJSONPosition[][][];

type GeoJSONCoordinates =
  | GeoJSONPolygonCoordinates
  | GeoJSONMultiPolygonCoordinates;

type GeoJSONFeature = {
  type: "Feature";
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: GeoJSONCoordinates;
  };
  properties: Record<string, string | number | boolean | null>;
};

type GeoJSONFeatureCollection = {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
};

export type MapLibreProps = {
  geojson?: GeoJSONFeatureCollection;
};

export type ZntProperties = {
  OBJECTID_1?: number;
  NAMOBJ?: string;
  NAMZON?: number;
  KODZON?: number;
  NAMSZN?: number;
  KODSZN?: string;
  JNSRPR?: number;
  KODEWP?: string;
  KODSWP?: string;
  KODBLK?: string;
  KODSBL?: string;

  WADMPR?: string;
  WADMKK?: string;
  WADMKC?: string;
  WADMKD?: string;

  KKOP_1?: string;
  LP2B_2?: string;
  KRB_03?: string;
  TOD_04?: string;
  TEB_05?: string;
  PUSLIT?: string;
  CAGBUD?: string;
  RESAIR?: string;
  KSMPDN?: string;
  HANKAM?: string;

  LUASHA?: number;
  KODUNK?: string;
  KDB?: string;
  KLB?: string;
  KTB?: string;
  KDH?: string;
  Luas?: number;

  objectid_c?: number;
  objectid_2?: number;
  Kode_Bangu?: number;
  Kode_Ban_1?: string;

  KODZON_1?: string;

  Shape__Are?: number;
  Shape__Len?: number;
  Shape_Leng?: number;
  Shape_Area?: number;

  Nomen?: string;
  nama?: string;
  zonanilait?: string;
  nomorzone?: number;

  nilai?: number;
  mean?: number;

  validsejak?: string;
  validsampai?: string | null;

  kantorid?: string;
  tahundibua?: number;
  bulandibua?: number;

  userupdate?: string;
  lastupdate?: string;

  nomorsk?: string;
  statusgeom?: boolean;

  rangenilai?: string;
  kelasnilai?: number;
  luasbatas?: number;
  // INI yang sesuai dengan data baru kamu
  kelas?: number | string;

  // Property tambahan yang kita buat sendiri
  _fillColor?: string;
};

export type Geometry =
  | {
      type: "Point";
      coordinates: number[];
    }
  | {
      type: "LineString";
      coordinates: number[][];
    }
  | {
      type: "Polygon";
      coordinates: number[][][];
    }
  | {
      type: "MultiPoint";
      coordinates: number[][];
    }
  | {
      type: "MultiLineString";
      coordinates: number[][][];
    }
  | {
      type: "MultiPolygon";
      coordinates: number[][][][];
    }
  | {
      type: "GeometryCollection";
      geometries: Geometry[];
    };

export type ZntFeature = {
  type: "Feature";
  properties: ZntProperties;
  geometry: Geometry;
};

export type ZntFeatureCollection = {
  type: "FeatureCollection";
  name?: string;
  crs?: {
    type: string;
    properties: {
      name: string;
    };
  };
  features: ZntFeature[];
};
