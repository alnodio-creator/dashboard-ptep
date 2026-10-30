// import { Kegiatan } from "@/app/Monitoring/types/type";
// import { useMemo } from "react";

// export function RekapTahapanProvinsi({
//   data,
//   title,
//   description,
// }: {
//   data: Kegiatan[];
//   title: string;
//   description: string;
// }) {
//   const rekap = useMemo(() => {
//     const provinsiMap = new Map<
//       string,
//       {
//         kanwilid: string;
//         kode_kegiatan: string;
//         kabupatenMap: Map<
//           string,
//           { tahapan: number; tahun: number | null; noBerkas: string }
//         >;
//       }
//     >();

//     data.forEach((item) => {
//       const provinsi = getProvinsi(item.namakantor);
//       const kanwilid = String(item.kanwilid ?? "");
//       const kode_kegiatan = String(item.kode_kegiatan ?? "");

//       const kabupaten = (item.Kabupaten ?? "").trim();
//       if (!kabupaten) return;

//       if (!provinsiMap.has(provinsi)) {
//         provinsiMap.set(provinsi, {
//           kanwilid,
//           kode_kegiatan,
//           kabupatenMap: new Map(),
//         });
//       }

//       const kabupatenMap = provinsiMap.get(provinsi)!.kabupatenMap;

//       const keyKabupaten = normalizeTahapan(kabupaten);
//       const tahapIndex = getTahapanIndex(item.nama_tahapan);
//       const existing = kabupatenMap.get(keyKabupaten);

//       if (!existing || tahapIndex > existing.tahapan) {
//         kabupatenMap.set(keyKabupaten, {
//           tahapan: tahapIndex,
//           tahun: item.anggaran_tahun,
//           noBerkas: item.no_berkas ?? "",
//         });
//       }
//     });

//     return Array.from(provinsiMap.entries())
//       .map(([provinsi, { kanwilid, kode_kegiatan, kabupatenMap }]) => {
//         const totalKabupaten = kabupatenMap.size;

//         const jumlahTahapan = TAHAPAN_REKAP.map(
//           (_, index) =>
//             Array.from(kabupatenMap.values()).filter(
//               (item) => item.tahapan === index,
//             ).length,
//         );

//         const persenTahapan = jumlahTahapan.map((jumlah) =>
//           totalKabupaten > 0 ? (jumlah / totalKabupaten) * 100 : 0,
//         );

//         const jumlahTerpetakan = Array.from(kabupatenMap.values()).filter(
//           (item) => item.tahapan >= 0,
//         ).length;

//         const agregat =
//           totalKabupaten > 0
//             ? (Array.from(kabupatenMap.values()).reduce(
//                 (sum, item) =>
//                   sum +
//                   (item.tahapan >= 0
//                     ? item.tahapan / (TAHAPAN_REKAP.length - 1)
//                     : 0),
//                 0,
//               ) /
//                 totalKabupaten) *
//               100
//             : 0;

//         return {
//           kanwilid,
//           kode_kegiatan,
//           provinsi,
//           totalKabupaten,
//           jumlahTahapan,
//           persenTahapan,
//           jumlahTerpetakan,
//           agregat,
//         };
//       })
//       .sort((a, b) => a.provinsi.localeCompare(b.provinsi, "id"));
//   }, [data]);

//   const totalKabupaten = rekap.reduce(
//     (sum, item) => sum + item.totalKabupaten,
//     0,
//   );
//   const totalTerpetakan = rekap.reduce(
//     (sum, item) => sum + item.jumlahTerpetakan,
//     0,
//   );
//   const totalAgregat =
//     totalKabupaten > 0
//       ? rekap.reduce(
//           (sum, item) => sum + item.agregat * item.totalKabupaten,
//           0,
//         ) / totalKabupaten
//       : 0;

//   return (
//     <section className="w-full min-w-0 space-y-4">
//       <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//         <div className="flex items-start gap-3">
//           <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
//             <MapPinned className="size-5" />
//           </div>
//           <div className="min-w-0">
//             <h2 className="text-lg font-bold tracking-tight">{title}</h2>
//             <p className="mt-1 text-sm text-muted-foreground">{description}</p>
//           </div>
//         </div>
//         <Badge variant="outline" className="w-fit">
//           {rekap.length.toLocaleString("id-ID")} provinsi
//         </Badge>
//       </div>

//       <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
//         <Card className="border-border/60 shadow-sm">
//           <CardContent className="p-4">
//             <p className="text-xs text-muted-foreground">Jumlah Provinsi</p>
//             <p className="mt-1 text-2xl font-bold">
//               {rekap.length.toLocaleString("id-ID")}
//             </p>
//           </CardContent>
//         </Card>
//         <Card className="border-border/60 shadow-sm">
//           <CardContent className="p-4">
//             <p className="text-xs text-muted-foreground">Kabupaten/Kota Unik</p>
//             <p className="mt-1 text-2xl font-bold">
//               {totalKabupaten.toLocaleString("id-ID")}
//             </p>
//           </CardContent>
//         </Card>
//         <Card className="border-border/60 shadow-sm">
//           <CardContent className="p-4">
//             <div className="flex items-center gap-2 text-muted-foreground">
//               <TrendingUp className="size-4" />
//               <p className="text-xs">Persentase Agregat</p>
//             </div>
//             <p className="mt-1 text-2xl font-bold">
//               {formatPersen(totalAgregat)}
//             </p>
//             <p className="mt-1 text-xs text-muted-foreground">
//               {totalTerpetakan.toLocaleString("id-ID")} kabupaten/kota memiliki
//               tahapan yang dikenali
//             </p>
//           </CardContent>
//         </Card>
//       </div>

//       <Card className="min-w-0 overflow-hidden border-border/60 shadow-sm">
//         <div className="border-b bg-muted/30 px-4 py-4">
//           <h3 className="font-bold">Rekap Progres per Provinsi</h3>
//           <p className="mt-1 text-xs text-muted-foreground">
//             Persentase kolom menunjukkan proporsi kabupaten/kota pada tahapan
//             tersebut. Agregat adalah rata-rata progres tahapan.
//           </p>
//         </div>

//         <div className="w-full overflow-x-auto">
//           <Table className="min-w-[1750px]">
//             <TableHeader>
//               <TableRow className="bg-muted/40">
//                 <TableHead className="sticky left-0 z-20 min-w-50 bg-muted/95">
//                   Provinsi
//                 </TableHead>
//                 <TableHead className="min-w-27.5 text-center">
//                   Jumlah Kab/Kota
//                 </TableHead>
//                 {TAHAPAN_REKAP.map((tahap) => (
//                   <TableHead
//                     key={tahap.key}
//                     className="min-w-38.75 whitespace-normal"
//                   >
//                     {tahap.label}
//                   </TableHead>
//                 ))}
//                 <TableHead className="min-w-38.75 bg-blue-50 font-bold text-blue-800">
//                   Persentase Agregat
//                 </TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {rekap.length === 0 ? (
//                 <TableRow>
//                   <TableCell
//                     colSpan={TAHAPAN_REKAP.length + 3}
//                     className="h-32 text-center text-sm text-muted-foreground"
//                   >
//                     Tidak ada data rekap untuk filter yang dipilih.
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 rekap.map((item) => (
//                   <TableRow key={item.provinsi} className="hover:bg-muted/30">
//                     <TableCell className="sticky left-0 z-10 bg-background font-semibold text-blue-800 underline">
//                       <Link
//                         href={`/Monitoring-belajar/rekap-tahapan/${item.kanwilid}/${item.kode_kegiatan}`}
//                         className="hover:text-primary hover:underline"
//                       >
//                         {item.provinsi}
//                       </Link>
//                     </TableCell>
//                     <TableCell className="text-center font-semibold tabular-nums">
//                       {item.totalKabupaten.toLocaleString("id-ID")}
//                     </TableCell>
//                     {item.persenTahapan.map((persen, index) => (
//                       <TableCell key={TAHAPAN_REKAP[index].key}>
//                         <div className="min-w-26.25 space-y-1.5">
//                           <div className="text-xs font-semibold tabular-nums">
//                             {formatPersen(persen)}
//                           </div>
//                           <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
//                             <div
//                               className="h-full rounded-full bg-blue-600 transition-all"
//                               style={{
//                                 width: `${Math.min(100, Math.max(0, persen))}%`,
//                               }}
//                             />
//                           </div>
//                           <p className="text-[11px] text-muted-foreground">
//                             {item.jumlahTahapan[index]} dari{" "}
//                             {item.totalKabupaten}
//                           </p>
//                         </div>
//                       </TableCell>
//                     ))}
//                     <TableCell className="bg-blue-50/50">
//                       <p className="font-bold text-blue-800">
//                         {formatPersen(item.agregat)}
//                       </p>
//                       <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
//                         <div
//                           className="h-full rounded-full bg-blue-600"
//                           style={{
//                             width: `${Math.min(100, item.agregat)}%`,
//                           }}
//                         />
//                       </div>
//                     </TableCell>
//                   </TableRow>
//                 ))
//               )}
//             </TableBody>
//           </Table>
//         </div>

//         <div className="border-t px-4 py-3 text-xs text-muted-foreground">
//           Geser tabel ke kanan untuk melihat semua tahapan. Rekap menghitung
//           kabupaten/kota unik satu kali per provinsi dan menggunakan tahapan
//           paling maju jika ada beberapa berkas di kabupaten/kota yang sama.
//         </div>
//       </Card>
//     </section>
//   );
// }
