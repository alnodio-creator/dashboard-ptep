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
