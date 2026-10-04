export type GunalahanType = {
  gunalahan: string;
  detail: string[];
};

export const Gunalahan: GunalahanType[] = [
  {
    gunalahan: "Commercial",
    detail: [
      "Perdagangan dan Jasa Skala Kota",
      "Perdagangan dan Jasa Skala SWP",
      "Perdagangan dan Jasa Skala WP",
      "Perkantoran",
    ],
  },
  {
    gunalahan: "Industrial",
    detail: ["Kawasan Peruntukan Industri", "Pembangkitan Tenaga Listrik"],
  },
  {
    gunalahan: "Other",
    detail: [
      "Pemakaman",
      "Perlindungan Setempat",
      "Pertahanan dan Keamanan",
      "Rimba Kota",
      "SPU Skala Kecamatan",
      "SPU Skala Kelurahan",
      "SPU Skala Kota",
      "Taman Kecamatan",
      "Taman Kelurahan",
      "Taman Kota",
      "Taman RT",
      "Taman RW",
    ],
  },
  {
    gunalahan: "Residential",
    detail: ["Perumahan Kepadatan Sangat Tinggi", "Perumahan Kepadatan Tinggi"],
  },
  {
    gunalahan: "Rural",
    detail: ["Hortikultura", "Perikanan Budi Daya"],
  },
];
