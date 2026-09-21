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

setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

type KoordinatPeta = {
  x: number;
  y: number;
  kantorid: string;
};

type MapLibreClientProps = {
  nomorSk: string;
  koordinat?: KoordinatPeta[];
};

const getColorByKelas = (kelas?: number | string) => {
  switch (Number(kelas)) {
    case 1:
      return "#166534";
    case 2:
      return "#15803d";
    case 3:
      return "#16a34a";
    case 4:
      return "#65a30d";
    case 5:
      return "#eab308";
    case 6:
      return "#f59e0b";
    case 7:
      return "#f97316";
    case 8:
      return "#dc2626";
    case 9:
      return "#991b1b";
    default:
      return "#cbd5e1";
  }
};

export default function MapLibreClient({
  nomorSk,
  koordinat = [],
}: MapLibreClientProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Kalau belum ada koordinat, jangan inisialisasi peta dulu
    if (koordinat.length === 0) return;

    const center = [koordinat[0].x, koordinat[0].y] as [number, number];

    const map = new Map({
      container: mapContainerRef.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center,
      zoom: 11,
    });

    mapInstanceRef.current = map;

    map.addControl(new NavigationControl(), "top-right");
    map.addControl(new FullscreenControl(), "top-left");

    map.on("load", async () => {
      try {
        // Fetch GeoJSON berdasarkan Nomor SK
        const response = await fetch(`/api/znt-nomorsk?nomorsk=${nomorSk}`);

        if (!response.ok) {
          throw new Error("Gagal fetch GeoJSON ZNT");
        }

        const data = await response.json();

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

        map.addSource("znt-geojson", {
          type: "geojson",
          data: coloredFeatures as FeatureCollection,
        });

        map.addLayer({
          id: "znt-fill",
          type: "fill",
          source: "znt-geojson",
          paint: {
            "fill-color": ["get", "_fillColor"],
            "fill-opacity": 0.75,
          },
        });

        map.addLayer({
          id: "znt-outline",
          type: "line",
          source: "znt-geojson",
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

        map.on("click", "znt-fill", (e) => {
          if (!e.features || e.features.length === 0) {
            return;
          }

          const feature = e.features[0];
          const props = feature.properties || {};

          const popupContent = getPopupContent(props);

          popup.setLngLat(e.lngLat).setHTML(popupContent).addTo(map);
        });

        map.on("mouseenter", "znt-fill", () => {
          map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", "znt-fill", () => {
          map.getCanvas().style.cursor = "";
        });
      } catch (error) {
        console.error("Gagal load GeoJSON MapLibre:", error);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [nomorSk, koordinat]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
}
