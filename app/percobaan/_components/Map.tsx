"use client";

import { useEffect, useRef } from "react";
import { Map, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { basePath } from "@/constants/menu-sidebar";

// Required for MapLibre v6: tells the bundler where the worker file is
setWorkerUrl(`${basePath}/maplibre/maplibre-gl-worker.mjs`);

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new Map({
      container: containerRef.current,
      style: "https://demotiles.maplibre.org/globe.json",
      center: [106.8456, -6.2088], // Jakarta [lng, lat]
      zoom: 10,
    });

    return () => map.remove(); // cleanup (important in React Strict Mode)
  }, []);

  return <div ref={containerRef} style={{ width: "100%", height: "100vh" }} />;
}
