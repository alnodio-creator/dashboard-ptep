import { toNumber } from "../_components/chart-monitoring";
import { Kegiatan } from "../types/type";

export function getUniqueAnggaran(data: Kegiatan[]): number {
  const kontrakMap = new Map<string, number>();

  data.forEach((item) => {
    // Jika nomor kontrak kosong, gunakan nomor berkas
    const key = item.nomor_kontrak?.trim()
      ? item.nomor_kontrak.trim()
      : `BERKAS-${item.no_berkas}`;

    if (!kontrakMap.has(key)) {
      kontrakMap.set(key, toNumber(item.anggaran));
    }
  });

  return Array.from(kontrakMap.values()).reduce(
    (total, anggaran) => total + anggaran,
    0,
  );
}
