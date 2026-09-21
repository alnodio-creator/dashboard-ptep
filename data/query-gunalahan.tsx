"use client";
import { useDataNilai } from "@/hooks/hook-datanilai";
import { createClient } from "@/lib/supabase/client";

export const PertumbuhanNamobj = () => {
  const { selectedKota, setKota, Tahun, setTahun, Nilaitanah, setNilaiTanah } =
    useDataNilai();
  const Supabase = createClient();

  const getDataPertumbuhanNamobj = async () => {
    return;
  };

  return;
};
