import { NextRequest, NextResponse } from "next/server";
import { prismaPenilaianTanah } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ============================================
// TYPE DATA
// ============================================

export type TahapanRealisasi = {
  tahapan_kegiatan_id: number;
  nama_tahapan: string;
  urutan: number;
  bobot: number;
  total_checklist: number;
  sesuai: number;
  tidak_sesuai: number;
  belum_diperiksa: number;
  target_titik: number | null;
  jumlah_zona: number | null;
  std_sesuai: number | null;
  total_approved: number | null;
  realisasi: number | null;
  // TIMELINE
  masuk_tahapan_at: string | null;
  keluar_tahapan_at: string | null;
  tgl_mulai_timeline: string | null;
  tgl_selesai_timeline: string | null;
  status_mulai: string | null;
  status_selesai: string | null;
};

export type DetailBerkas = {
  berkas_id: number;
  no_berkas: string;
  kode_kegiatan: string;
  skala: string;
  anggaran: number;
  nama_anggaran: string;
  nomor_kontrak: string;
  nama_perusahaan: string;
  namakantor: string;
  kabupaten: string;
  kanwilid: string;
  realisasi_fisik: number;
  seluruh_tahapan_selesai: boolean;
  tahapan: TahapanRealisasi[];
};

export type MonitoringRealisasiKontrak = {
  nama_perusahaan: string;
  no_kontrak: string;
  anggaran: number;
  kanwilid: string;
  total_berkas: number;
  realisasi_fisik: number;
  seluruh_berkas_selesai: boolean;
  detail: DetailBerkas[];
};

// ============================================
// GET API
// ============================================

export async function GET() {
  try {
    const data = await prismaPenilaianTanah.$queryRaw<
      MonitoringRealisasiKontrak[]
    >`
 WITH stage_config AS (
         SELECT tk.kode AS kode_kegiatan,
            tk.tahapan_kegiatan_id,
            tk.nama_tahapan,
            tk.bobot,
            tk.ord
           FROM tatausaha.tahapan_kegiatan tk
        ), 
      -- ============================================
      -- 1. DAFTAR BERKAS
      -- ============================================
        berkas_list AS (
         SELECT DISTINCT
              b.berkas_id,
              b.no_berkas,
              k.kode_kegiatan,
              k.tgl_mulai AS tgl_mulai_kontrak,
              k.tgl_selesai AS tgl_selesai_kontrak,
              k.skala,
              k.anggaran,
              k.nama_anggaran ,
              kk.jenis_kontrak,
              kk.nomor_kontrak,
              kk.nama_perusahaan,
              zmwk.namakantor,
              kl.nama AS kabupaten,
              zmwk.kantorid AS kanwilid
          FROM tatausaha.berkas b
          INNER JOIN tatausaha.kegiatan k
              ON b.kontrak_id = k.kegiatan_id
          INNER JOIN tatausaha.kegiatan_lokasi kl
              ON k.kegiatan_id = kl.kegiatan_id
          INNER JOIN tatausaha.kegiatan_kontrak kk
              ON k.kegiatan_id = kk.kegiatan_id
          INNER JOIN dashboard.znt_master_kantor zmk
              ON zmk.kode = kl.wilayah_id
          INNER JOIN dashboard.znt_master_wilayah_kantor zmwk
              ON zmwk.kantorid = zmk.induk
          WHERE
              k.tgl_mulai >= DATE_TRUNC('year', CURRENT_DATE)
              AND k.tgl_mulai < DATE_TRUNC('year', CURRENT_DATE)
                  + INTERVAL '1 year'
              and b.deleted_at is null
        ),   
      -- ============================================
      -- 2. CHECKLIST TERBARU
      -- ============================================
        latest_checklist AS (
         SELECT DISTINCT ON (
         fc.berkas_id, 
         fc.master_checklist_id) 
            fc.berkas_id,
            fc.master_checklist_id,
            fc.status_kesesuaian,
            fc.catatan,
            fc.created_at
           FROM tatausaha.form_checklist fc
          ORDER BY fc.berkas_id, 
          fc.master_checklist_id, 
          fc.created_at DESC, 
          fc.form_checklist_id DESC
        ),   
      -- ============================================
      -- 3. HISTORY TIMELINE
      -- ============================================
        history_timeline AS (
         SELECT DISTINCT ON (
              vhtd.berkas_id,
              vhtd.nama_tahapan
          )
              vhtd.berkas_id,
              vhtd.nama_tahapan,
              vhtd.masuk_tahapan_at,
              vhtd.keluar_tahapan_at,
              vhtd.tahapan_kegiatan_id
          FROM tatausaha.v_history_timeline_durasi vhtd
          INNER JOIN berkas_list bl
              ON bl.berkas_id = vhtd.berkas_id
          ORDER BY
              vhtd.berkas_id,
              vhtd.nama_tahapan,
              vhtd.tahapan_kegiatan_id ASC,
              vhtd.masuk_tahapan_at asc,
              vhtd.keluar_tahapan_at desc --penambahan order by disini
        ),
      -- ============================================
      -- 4. TIMELINE + JADWAL PER TAHAPAN revisi ini untuk yang tahap 4 dan tahap 5
      -- ============================================
      timeline_detail AS (SELECT
		    ht.berkas_id,
		    ht.tahapan_kegiatan_id,
		    ht.masuk_tahapan_at,
		    ht.keluar_tahapan_at,
		    kt.tgl_mulai AS tgl_mulai_timeline,
		    kt.tgl_selesai AS tgl_selesai_timeline,
		    CASE
		        WHEN ht.masuk_tahapan_at IS NULL
		            THEN 'Berkas Belum Dimulai'
		        WHEN kt.tgl_mulai IS NULL
		            THEN 'Deadline Belum Tersedia'
		        WHEN ht.masuk_tahapan_at::DATE <= kt.tgl_mulai::DATE
		            THEN 'TEPAT WAKTU'
		        ELSE 'TERLAMBAT'
		    END AS status_mulai,
		    CASE
		        WHEN ht.masuk_tahapan_at IS NULL
		            THEN 'Berkas Belum Dimulai'
		        WHEN kt.tgl_selesai IS NULL
		            THEN 'Deadline Belum Tersedia'
		        WHEN ht.keluar_tahapan_at IS NULL
		             AND CURRENT_DATE < kt.tgl_selesai::DATE
		            THEN 'ON PROGRESS'
		        WHEN ht.keluar_tahapan_at IS NULL
		             AND CURRENT_DATE >= kt.tgl_selesai::DATE
		            THEN 'TERLAMBAT'
		        WHEN ht.keluar_tahapan_at::DATE <= kt.tgl_selesai::DATE
		            THEN 'TEPAT WAKTU'
		        ELSE 'TERLAMBAT'
		    END AS status_selesai
		FROM history_timeline ht
		LEFT JOIN tatausaha.kegiatan_timeline kt
		    ON kt.berkas_id = ht.berkas_id
		    AND kt.tahapan_kegiatan_id = ht.tahapan_kegiatan_id
		ORDER BY ht.tahapan_kegiatan_id
        ), 
      -- ============================================
      -- TAHAP 5 STD per berkas
      -- ============================================
      std_perberkas AS (
			    SELECT
			    bl.berkas_id,
			    bl.no_berkas,
			    -- Jumlah zona
			    COUNT(pz.smpbkrel)::INTEGER::TEXT AS jumlah_zona,
			    -- Zona standar sesuai
			    COUNT(pz.smpbkrel) FILTER (
			        WHERE pz.nilaizn <> 0
			    )::INTEGER::TEXT AS zona_std_sesuai,
			    -- Zona standar tidak sesuai
			    COUNT(pz.smpbkrel) FILTER (
			        WHERE pz.smpbkrel = 0
			    )::INTEGER::TEXT AS zona_std_tdk_sesuai,
			    -- Persentase standar sesuai
			    ROUND(
			        COUNT(pz.smpbkrel) FILTER (
			            WHERE pz.smpbkrel <> 0
			        )::NUMERIC
			        / NULLIF(COUNT(pz.smpbkrel), 0) * 100,
			        2
			    ) AS persentase_std
			FROM berkas_list bl
			LEFT JOIN tatausaha.peta_znt pz
			    ON bl.berkas_id = pz.berkas_id
			GROUP BY
			    bl.berkas_id,
			    bl.no_berkas
      ),  
      -- ============================================
      -- 5. STATISTIK CHECKLIST DAN TITIK SAMPEL
      -- ============================================
        stage_stats AS (
         SELECT bl.berkas_id,
            bl.no_berkas,
            bl.kode_kegiatan,
            bl.skala,
            bl.anggaran,
            bl.nama_anggaran,
            bl.jenis_kontrak,
            bl.nomor_kontrak,
            bl.nama_perusahaan,
            bl.namakantor,
            bl.kabupaten,
            bl.kanwilid,
            vcp.target_titik,
            vcp.total_approved,
            sp.jumlah_zona,
            sp.zona_std_sesuai,
            sp.zona_std_tdk_sesuai,
            sc.tahapan_kegiatan_id,
            sc.nama_tahapan,
            sc.bobot,
            sc.ord,
            count(mc.master_checklist_id)::integer AS total_checklist,
            count(mc.master_checklist_id) FILTER (WHERE upper(btrim(lc.status_kesesuaian::text)) = 'SESUAI'::text)::integer AS sesuai,
            count(mc.master_checklist_id) FILTER (WHERE upper(btrim(lc.status_kesesuaian::text)) = 'TIDAK_SESUAI'::text)::integer AS tidak_sesuai,
            count(mc.master_checklist_id) FILTER (WHERE lc.master_checklist_id IS NULL)::integer AS belum_diperiksa
           FROM berkas_list bl
             JOIN stage_config sc 
             ON sc.kode_kegiatan::text = bl.kode_kegiatan::text
             LEFT JOIN tatausaha.master_checklist mc 
             ON mc.tahapan_kegiatan_id = sc.tahapan_kegiatan_id 
             AND mc.is_required = true 
             AND mc.is_aktif = true 
             AND (sc.tahapan_kegiatan_id <> 7 OR sc.tahapan_kegiatan_id = 7 
             AND (NULLIF(btrim(mc.jenis_kontrak::text), ''::text) IS NULL OR upper(btrim(bl.jenis_kontrak::text)) = 'SWAKELOLA'::text 
             AND upper(btrim(mc.jenis_kontrak::text)) = 'SWAKELOLA'::text OR upper(btrim(bl.jenis_kontrak::text)) = 'PENYEDIA BARANG/JASA'::text 
             AND upper(btrim(mc.jenis_kontrak::text)) = 'PIHAK_KETIGA'::text))
             LEFT JOIN latest_checklist lc ON lc.berkas_id = bl.berkas_id AND lc.master_checklist_id = mc.master_checklist_id
             LEFT JOIN tatausaha.v_combined_progress vcp ON bl.no_berkas::text = vcp.no_berkas::text
             LEFT join std_perberkas sp
          	    on bl.berkas_id = sp.berkas_id 
          GROUP BY bl.berkas_id, 
          bl.no_berkas, 
          bl.kode_kegiatan, 
          bl.skala, 
          bl.anggaran, 
          bl.nama_anggaran, 
          bl.jenis_kontrak, 
          bl.nomor_kontrak, 
          bl.nama_perusahaan, 
          bl.namakantor, 
          bl.kabupaten, 
          bl.kanwilid, 
          vcp.target_titik, 
          vcp.total_approved,
          sp.jumlah_zona,
          sp.zona_std_sesuai,
          sp.zona_std_tdk_sesuai,
          sc.tahapan_kegiatan_id, 
          sc.nama_tahapan, 
          sc.bobot, 
          sc.ord
        ), 
      -- ============================================
      -- 6. REALISASI SETIAP TAHAPAN
      -- ============================================
        stage_progress AS (
         SELECT
              *,

              case
	              WHEN tahapan_kegiatan_id IN (4, 11, 18, 26)
				     AND total_checklist > 0
				     AND COALESCE(target_titik, 0) > 0
				
				THEN ROUND(
				    (
				        (
				            sesuai::NUMERIC
				            / NULLIF(total_checklist, 0) * 0.5
				        )
				        +
				        (
				            NULLIF(zona_std_sesuai, 'BELUM MENGOLAH STD ZONA')::NUMERIC
				            / NULLIF(
				                NULLIF(jumlah_zona, 'BELUM MENGOLAH STD ZONA')::NUMERIC,
				                0
				            ) * 0.5
				        )
				    ) * 100,
				    2
				)
	              
                  WHEN tahapan_kegiatan_id IN (3, 10, 17, 25)
				     AND total_checklist > 0
				     AND COALESCE(target_titik, 0) > 0
				
                    THEN ROUND(
                        (
                            (
                                sesuai::NUMERIC
                                / NULLIF(total_checklist, 0) * 0.05
                            )
                            +
                            (
                                LEAST(
                                    COALESCE(total_approved, 0)::NUMERIC
                                    / NULLIF(target_titik, 0)::NUMERIC,
                                    1.0
                                ) * 0.95
                            )
                        ) * 100,
                        2
                    )

                  WHEN total_checklist > 0

                  THEN ROUND(
                      sesuai::NUMERIC
                      / NULLIF(total_checklist, 0)
                      * 100,
                      2
                  )

                  ELSE 0
              END AS realisasi

          FROM stage_stats
        ),   
      -- ============================================
      -- 7. GABUNGKAN REALISASI + TIMELINE
      -- ============================================
        stage_with_timeline AS (
          SELECT
        sp.*,
        td.masuk_tahapan_at,
        td.keluar_tahapan_at,
        td.tgl_mulai_timeline,
        td.tgl_selesai_timeline,
        td.status_mulai,
        CASE
            -- TAHAP 4: total_approved vs target_titik
            WHEN sp.tahapan_kegiatan_id IN (3, 10, 17, 25) THEN
                CASE
                    WHEN td.tgl_selesai_timeline IS NULL
                        THEN 'Deadline Belum Tersedia'
                    WHEN COALESCE(sp.target_titik, 0) = 0
                        THEN 'TARGET BELUM TERSEDIA'
                    -- belum terpenuhi, deadline belum lewat
                    WHEN COALESCE(sp.total_approved, 0) < sp.target_titik
                         AND CURRENT_DATE <= td.tgl_selesai_timeline::DATE
                        THEN 'ON PROGRESS'
                    -- belum terpenuhi, deadline sudah lewat
                    WHEN COALESCE(sp.total_approved, 0) < sp.target_titik
                         AND CURRENT_DATE > td.tgl_selesai_timeline::DATE
                        THEN 'TERLAMBAT'
                    -- sisanya: target terpenuhi
                    ELSE 'TEPAT WAKTU'
                END
            -- TAHAP 5: zona_std_sesuai vs jumlah_zona
            WHEN sp.tahapan_kegiatan_id IN (4, 11, 18, 26) THEN
                CASE
                    WHEN td.tgl_selesai_timeline IS NULL
                        THEN 'Deadline Belum Tersedia'
                    when td.masuk_tahapan_at is null
                    	then 'Berkas Belum Dimulai'
                    WHEN COALESCE(sp.jumlah_zona, '0') !~ '^\d+$'
                         OR COALESCE(sp.jumlah_zona, '0')::INT = 0
                        THEN 'ON PROGRESS'
                    WHEN td.masuk_tahapan_at is not null
                    	 and COALESCE(sp.zona_std_sesuai, '0')::INT < sp.jumlah_zona::INT
                         AND CURRENT_DATE <= td.tgl_selesai_timeline::DATE
                        THEN 'ON PROGRESS'
                    WHEN td.masuk_tahapan_at is not null
                    	 and COALESCE(sp.zona_std_sesuai, '0')::INT < sp.jumlah_zona::INT
                         AND CURRENT_DATE > td.tgl_selesai_timeline::DATE
                        THEN 'TERLAMBAT'
                    ELSE 'TEPAT WAKTU'
                END
            -- Tahap lain: logika lama
            ELSE td.status_selesai
        END AS status_selesai
    FROM stage_progress sp
    LEFT JOIN timeline_detail td
        ON td.berkas_id = sp.berkas_id
        AND td.tahapan_kegiatan_id = sp.tahapan_kegiatan_id
        ), 
      -- ============================================
      -- 8. REALISASI FISIK PER BERKAS
      -- ============================================
        final_progress AS (
         SELECT
              berkas_id,
              no_berkas,
              kode_kegiatan,
              skala,
              anggaran,
              nama_anggaran,
              nomor_kontrak,
              nama_perusahaan,
              namakantor,
              kabupaten,
              kanwilid,

              ROUND(
                  SUM(
                      CASE
                          WHEN ord <= 7
                          THEN realisasi * bobot / 100
                          ELSE 0
                      END
                  ),
                  2
              ) AS realisasi_fisik,

              BOOL_AND(
                  CASE
                      WHEN ord <= 7
                      THEN realisasi = 100
                      ELSE TRUE
                  END
              ) AS seluruh_tahapan_selesai,

              JSONB_AGG(
                  JSONB_BUILD_OBJECT(
                      'tahapan_kegiatan_id', tahapan_kegiatan_id,
                      'nama_tahapan', nama_tahapan,
                      'urutan', ord,
                      'bobot', bobot,
                      'total_checklist', total_checklist,
                      'sesuai', sesuai,
                      'tidak_sesuai', tidak_sesuai,
                      'belum_diperiksa', belum_diperiksa,
                      'target_titik', target_titik,
                      'total_approved', total_approved,
                      'jumlah_zona', jumlah_zona,
                      'std_sesuai', zona_std_sesuai,
                      'realisasi',
                          CASE
                              WHEN ord = 8 AND total_checklist = 0
                              THEN NULL
                              ELSE realisasi
                          END,

                      -- DATA TIMELINE
                      'masuk_tahapan_at', masuk_tahapan_at,
                      'keluar_tahapan_at', keluar_tahapan_at,
                      'tgl_mulai_timeline', tgl_mulai_timeline,
                      'tgl_selesai_timeline', tgl_selesai_timeline,
                      'status_mulai', status_mulai,
                      'status_selesai', status_selesai
                  )
                  ORDER BY ord
              ) AS tahapan

          FROM stage_with_timeline

          GROUP BY
              berkas_id,
              no_berkas,
              kode_kegiatan,
              skala,
              anggaran,
              nama_anggaran,
              nomor_kontrak,
              nama_perusahaan,
              namakantor,
              kabupaten,
              kanwilid
          
           ORDER BY
    		  kabupaten ASC,
              realisasi_fisik DESC
              ),  
      -- ============================================
      -- 9. AGREGASI PER KANWIL
      -- ============================================
        contract_progress AS (
         SELECT final_progress.kanwilid,
            final_progress.kode_kegiatan,
            final_progress.nomor_kontrak,
            max(final_progress.nama_perusahaan::text) AS nama_perusahaan,
            max(final_progress.anggaran) AS anggaran,
            max(final_progress.nama_anggaran::text) AS nama_anggaran,
            count(*) AS total_berkas
           FROM final_progress
          GROUP BY final_progress.kanwilid, final_progress.nomor_kontrak, final_progress.kode_kegiatan
        ), 
        
        kanwil_progress AS (
         SELECT fp.kanwilid,
            fp.kode_kegiatan,
            max(fp.namakantor::text) AS nama_kanwil,
            COALESCE(kcs.total_anggaran, 0::numeric) AS anggaran,
            count(*) AS total_berkas,
            round(avg(fp.realisasi_fisik), 2) AS realisasi_fisik,
            bool_and(fp.seluruh_tahapan_selesai) AS seluruh_berkas_selesai,
            kcs.kontrak,
            jsonb_agg(jsonb_build_object('berkas_id', fp.berkas_id, 'no_berkas', fp.no_berkas, 'kode_kegiatan', fp.kode_kegiatan, 'anggaran', fp.anggaran, 'nama_anggaran', fp.nama_anggaran, 'skala', fp.skala, 'kabupaten', fp.kabupaten, 'no_kontrak', fp.nomor_kontrak, 'nama_perusahaan', fp.nama_perusahaan, 'realisasi_fisik', fp.realisasi_fisik, 'seluruh_tahapan_selesai', fp.seluruh_tahapan_selesai, 'tahapan', fp.tahapan) ORDER BY fp.nomor_kontrak, fp.kabupaten, fp.no_berkas) AS detail
           FROM final_progress fp
             LEFT JOIN ( SELECT contract_progress.kanwilid,
                    contract_progress.kode_kegiatan,
                    sum(contract_progress.anggaran) AS total_anggaran,
                    jsonb_agg(jsonb_build_object('no_kontrak', contract_progress.nomor_kontrak, 'nama_perusahaan', contract_progress.nama_perusahaan, 'anggaran', contract_progress.anggaran, 'nama_anggaran', contract_progress.nama_anggaran, 'total_berkas', contract_progress.total_berkas) ORDER BY contract_progress.nomor_kontrak) AS kontrak
                   FROM contract_progress
                  GROUP BY contract_progress.kanwilid, contract_progress.kode_kegiatan) kcs ON kcs.kanwilid::text = fp.kanwilid::text AND kcs.kode_kegiatan::text = fp.kode_kegiatan::text
          GROUP BY fp.kanwilid, fp.kode_kegiatan, kcs.total_anggaran, kcs.kontrak
        )
			 SELECT kanwil_progress.nama_kanwil AS "Kanwil",
			    kanwil_progress.kanwilid,
			    kanwil_progress.kode_kegiatan,
			        CASE
			            WHEN kanwil_progress.kode_kegiatan::text = '01'::text THEN 'Pembuatan ZNT'::text
			            WHEN kanwil_progress.kode_kegiatan::text = '02'::text THEN 'Pembaruan ZNT'::text
			            ELSE 'Lainnya'::text
			        END AS nama_kegiatan,
			    kanwil_progress.anggaran,
			    kanwil_progress.total_berkas,
			    kanwil_progress.realisasi_fisik,
			    kanwil_progress.seluruh_berkas_selesai,
			    kanwil_progress.detail
			   FROM kanwil_progress
			  WHERE kanwil_progress.kode_kegiatan::text = '01'::text
			  ORDER BY kanwil_progress.nama_kanwil asc, kanwil_progress.realisasi_fisik desc;
    `;

    // ============================================
    // SERIALISASI BIGINT
    // ============================================

    const serializedData = JSON.parse(
      JSON.stringify(data, (_key, value) =>
        typeof value === "bigint" ? Number(value) : value,
      ),
    );

    return NextResponse.json(
      {
        success: true,
        message: "Data monitoring realisasi kontrak berhasil diambil",
        total: serializedData.length,
        data: serializedData,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error("API MONITORING REALISASI KONTRAK ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data monitoring realisasi kontrak",
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
