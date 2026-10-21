"use client";

import { useEffect, useRef } from "react";
import {
  Map,
  NavigationControl,
  Popup,
  setWorkerUrl,
  FullscreenControl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { FeatureCollection } from "geojson";
import { ZntFeature, ZntFeatureCollection } from "@/constants/auth-constants";
import { getPopupContent } from "../types/popup-contents";
import { basePath } from "@/constants/menu-sidebar";

// Set worker URL dari public/maplibre sesuai docs resmi
setWorkerUrl(`${basePath}/maplibre/maplibre-gl-worker.mjs`);

const getColorByKelas = (kelas?: number | string) => {
  switch (Number(kelas)) {
    case 1:
      return "#166534"; // hijau tua
    case 2:
      return "#15803d";
    case 3:
      return "#16a34a";
    case 4:
      return "#65a30d";
    case 5:
      return "#eab308"; // kuning
    case 6:
      return "#f59e0b";
    case 7:
      return "#f97316";
    case 8:
      return "#dc2626";
    case 9:
      return "#991b1b"; // merah tua
    default:
      return "#cbd5e1"; // abu-abu jika kelas kosong
  }
};

export default function MapLibreClient() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = new Map({
      container: mapContainerRef.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [106.810055371167, -6.27260137008532], // ini masukkan koordinat yang sudah dibuat tadi
      zoom: 11,
    });

    map.addControl(new NavigationControl(), "top-right");
    map.addControl(new FullscreenControl(), "top-left");

    map.on("load", async () => {
      mapInstanceRef.current = map;

      try {
        const response = await fetch(`${basePath}/api/znt-zona`);
        const data = await response.json();
        console.log(data);

        const coloredFeatures: ZntFeatureCollection = {
          ...data,
          features: data.features.map(
            (f: ZntFeature): ZntFeature => ({
              ...f,
              properties: {
                ...f.properties,
                _fillColor: getColorByKelas(f.properties?.kelas),
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
          maxWidth: "380px",
        });

        map.on("click", "jakarta-fill", (e) => {
          if (!e.features || e.features.length === 0) return;
          const feature = e.features[0];
          const props = feature.properties || {};

          const popupContent = getPopupContent(props);

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
