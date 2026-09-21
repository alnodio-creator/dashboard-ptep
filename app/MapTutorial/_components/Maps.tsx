"use client";

import { useEffect, useRef } from "react";
import {
  Map,
  NavigationControl,
  Popup,
  setWorkerUrl,
  GeoJSONSource,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { FeatureCollection } from "geojson";
import { ZntFeature, ZntFeatureCollection } from "@/constants/auth-constants";

// Set worker URL dari public/maplibre sesuai docs resmi
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

const getColorByNamobj = (namobj?: string) => {
  if (!namobj) return "#cbd5e1";
  const val = namobj.toLowerCase();
  if (val.includes("hortikultura") || val.includes("perikanan budi daya"))
    return "#16a34a";
  if (val.includes("kawasan peruntukan industri")) return "#64748b";
  if (val.includes("pemakaman") || val.includes("perlindungan setempat"))
    return "#14532d";
  if (
    val.includes("pembangkitan tenaga listrik") ||
    val.includes("pertahanan dan keamanan")
  )
    return "#dc2626";
  if (val.includes("perdagangan dan jasa")) {
    if (val.includes("skala kota")) return "#9333ea";
    if (val.includes("skala swp")) return "#a855f7";
    return "#c084fc";
  }
  if (val.includes("perkantoran")) return "#7e22ce";
  if (val.includes("perumahan")) {
    if (val.includes("sangat tinggi")) return "#c2410c";
    if (val.includes("tinggi")) return "#ea580c";
    return "#f97316";
  }
  if (val.includes("rimba kota") || val.includes("taman")) return "#22c55e";
  if (val.includes("spu")) return "#b45309";
  return "#94a3b8";
};

export default function MapLibreClient() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = new Map({
      container: mapContainerRef.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [106.8237, -6.1741],
      zoom: 11,
    });

    map.addControl(new NavigationControl(), "top-right");

    map.on("load", async () => {
      mapInstanceRef.current = map;

      try {
        const response = await fetch("/geojson/IntersectJakarta_2025.geojson");
        const data = await response.json();
        console.log(data);

        const coloredFeatures: ZntFeatureCollection = {
          ...data,
          features: data.features.map(
            (f: ZntFeature): ZntFeature => ({
              ...f,
              properties: {
                ...f.properties,
                _fillColor: getColorByNamobj(f.properties?.NAMOBJ),
              },
            }),
          ),
        };

        map.addSource("jakarta-geojson", {
          type: "geojson",
          data: coloredFeatures as FeatureCollection,
        });

        map.addLayer({
          id: "jakarta-fill",
          type: "fill",
          source: "jakarta-geojson",
          paint: {
            "fill-color": ["get", "_fillColor"],
            "fill-opacity": 0.75,
          },
        });

        map.addLayer({
          id: "jakarta-outline",
          type: "line",
          source: "jakarta-geojson",
          paint: {
            "line-color": "#ffffff",
            "line-width": 0.5,
          },
        });

        const popup = new Popup({
          closeButton: true,
          closeOnClick: true,
        });

        map.on("click", "jakarta-fill", (e) => {
          if (!e.features || e.features.length === 0) return;
          const feature = e.features[0];
          const props = feature.properties || {};

          const popupContent = `
          <div style="font-family: sans-serif; font-size: 12px; padding: 4px; min-width: 220px;">
            <strong style="font-size: 13px; color: #1f2937; display: block; margin-bottom: 4px;">
              ${props.nama || "Detail Informasi"}
            </strong>
            <hr style="margin: 4px 0; border-color: #e5e7eb;" />
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <tr>
                <td style="padding: 2px 6px 2px 0; color: #4b5563; font-weight: bold; vertical-align: top;">Kecamatan</td>
                <td style="padding: 2px 0; color: #1f2937; vertical-align: top;">: ${props.WADMKC || "-"}</td>
              </tr>
              <tr>
                <td style="padding: 2px 6px 2px 0; color: #4b5563; font-weight: bold; vertical-align: top;">Zona</td>
                <td style="padding: 2px 0; color: #1f2937; vertical-align: top;">: ${props.NAMOBJ || "-"}</td>
              </tr>
              <tr>
                <td style="padding: 2px 6px 2px 0; color: #4b5563; font-weight: bold; vertical-align: top;">Nilai</td>
                <td style="padding: 2px 0; color: #1f2937; vertical-align: top;">: ${props.nilai ? "Rp " + Number(props.nilai).toLocaleString("id-ID") : "-"}</td>
              </tr>
              <tr>
                <td style="padding: 2px 6px 2px 0; color: #4b5563; font-weight: bold; vertical-align: top;">No. SK</td>
                <td style="padding: 2px 0; color: #1f2937; vertical-align: top;">: ${props.nomorsk || "-"}</td>
              </tr>
              <tr>
                <td style="padding: 2px 6px 2px 0; color: #4b5563; font-weight: bold; vertical-align: top;">Kelas</td>
                <td style="padding: 2px 0; color: #1f2937; vertical-align: top;">: ${props.kelasnilai || "-"}</td>
              </tr>
            </table>
          </div>
`;

          popup.setLngLat(e.lngLat).setHTML(popupContent).addTo(map);
        });

        map.on("mouseenter", "jakarta-fill", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "jakarta-fill", () => {
          map.getCanvas().style.cursor = "";
        });
      } catch (err) {
        console.error("Gagal load GeoJSON MapLibre:", err);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
