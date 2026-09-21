import { NilaiTanah } from "@/constants/auth-constants";
import { useState } from "react";

export function useDataNilai() {
  const [selectedKota, setKota] = useState<string>(
    "Kantor Pertanahan Kota Administrasi Jakarta Selatan",
  );
  const [Tahun, setTahun] = useState<number>(2025);
  const [Nilaitanah, setNilaiTanah] = useState<NilaiTanah[]>([]);

  return {
    selectedKota,
    setKota,
    Tahun,
    setTahun,
    Nilaitanah,
    setNilaiTanah,
  };
}
