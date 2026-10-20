// import { Kegiatan } from "../types/type";

// function ActivitySection({
//   title,
//   description,
//   data,
//   type,
// }: {
//   title: string;
//   description: string;
//   data: Kegiatan[];
//   type: "01" | "02";
// }) {
//   const totalAnggaran = data.reduce(
//     (total, item) => total + toNumber(item.anggaran),
//     0,
//   );

//   const totalLuasan = data.reduce(
//     (total, item) => total + toNumber(item.target_luasan),
//     0,
//   );

//   const totalSelesai = data.filter(
//     (item) => normalize(item.nama_tahapan) === "selesai",
//   ).length;

//   const sumberAnggaran = useMemo(() => {
//     const grouped = new Map<string, { jumlah: number; anggaran: number }>();

//     data.forEach((item) => {
//       const sumber = item.nama_anggaran?.trim() || "Belum Diisi";
//       const current = grouped.get(sumber) ?? {
//         jumlah: 0,
//         anggaran: 0,
//       };

//       current.jumlah += 1;
//       current.anggaran += toNumber(item.anggaran);

//       grouped.set(sumber, current);
//     });

//     return Array.from(grouped.entries()).sort(
//       (a, b) => b[1].anggaran - a[1].anggaran,
//     );
//   }, [data]);

//   return (
//     <section className="space-y-5">
//       <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//         <div className="flex items-start gap-3">
//           <div
//             className={`flex size-12 items-center justify-center rounded-xl ${
//               type === "01"
//                 ? "bg-emerald-100 text-emerald-700"
//                 : "bg-amber-100 text-amber-700"
//             }`}
//           >
//             {type === "01" ? (
//               <MapPin className="size-6" />
//             ) : (
//               <RefreshCw className="size-6" />
//             )}
//           </div>

//           <div>
//             <h2 className="text-xl font-bold tracking-tight">{title}</h2>
//             <p className="mt-1 text-sm text-muted-foreground">{description}</p>
//           </div>
//         </div>

//         <Badge variant="outline" className="w-fit px-3 py-1.5 text-sm">
//           Kode kegiatan {type}
//         </Badge>
//       </div>

//       {/* Kartu ringkasan kegiatan */}
//       <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
//         <SummaryCard
//           title="Total Berkas"
//           value={data.length.toLocaleString("id-ID")}
//           description="Jumlah kegiatan sesuai filter"
//           icon={<FileSpreadsheet className="size-5" />}
//           color="bg-blue-100 text-blue-700"
//         />

//         <SummaryCard
//           title="Total Anggaran"
//           value={formatRupiah(totalAnggaran)}
//           description="Akumulasi anggaran kegiatan"
//           icon={<Wallet className="size-5" />}
//           color="bg-violet-100 text-violet-700"
//         />

//         <SummaryCard
//           title="Target Luasan"
//           value={`${formatNumber(totalLuasan)}`}
//           description="Akumulasi target sesuai satuan sumber"
//           icon={<Activity className="size-5" />}
//           color="bg-amber-100 text-amber-700"
//         />

//         <SummaryCard
//           title="Kegiatan Selesai"
//           value={totalSelesai.toLocaleString("id-ID")}
//           description={`${data.length ? ((totalSelesai / data.length) * 100).toFixed(1) : "0.0"}% dari total berkas`}
//           icon={<CheckCircle2 className="size-5" />}
//           color="bg-emerald-100 text-emerald-700"
//         />
//       </div>

//       {/* Rincian sumber anggaran */}
//       <div className="space-y-3">
//         <h3 className="text-base font-bold">Rincian Sumber Anggaran</h3>

//         <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
//           {sumberAnggaran.length === 0 ? (
//             <Card>
//               <CardContent className="p-5 text-sm text-muted-foreground">
//                 Belum ada data sumber anggaran.
//               </CardContent>
//             </Card>
//           ) : (
//             sumberAnggaran.map(([sumber, detail]) => (
//               <Card key={sumber} className="border-border/60 shadow-sm">
//                 <CardContent className="p-4">
//                   <div className="flex items-center justify-between gap-3">
//                     <Badge variant="outline">{sumber}</Badge>
//                     <span className="text-xs text-muted-foreground">
//                       {detail.jumlah.toLocaleString("id-ID")} berkas
//                     </span>
//                   </div>

//                   <p className="mt-3 text-xl font-bold tracking-tight">
//                     {formatRupiah(detail.anggaran)}
//                   </p>

//                   <p className="mt-1 text-xs text-muted-foreground">
//                     Total anggaran {sumber}
//                   </p>
//                 </CardContent>
//               </Card>
//             ))
//           )}
//         </div>
//       </div>

//       <MonitoringChart
//         data={data}
//         title={`Grafik ${title} berdasarkan Sumber Anggaran`}
//       />

//       <MonitoringActivityTable data={data} title={`Detail ${title}`} />
//     </section>
//   );
// }
