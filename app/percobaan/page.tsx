"use client";

import dynamic from "next/dynamic";
import React from "react";

// Path menggunakan ../_component/MapLibreClient karena page ada di dalam sub-folder PetaMaplibre
const MapLibreClient = dynamic(() => import("./_components/Map"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[500px] bg-gray-100 rounded-lg text-gray-500 text-sm">
      Memuat Peta MapLibre...
    </div>
  ),
});

export default function PetaMaplibrePage() {
  return (
    <div className="flex flex-col items-center gap-6 p-6 md:p-12 w-full min-h-screen bg-gray-50">
      <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm w-full max-w-5xl border">
        <h1 className="text-2xl font-bold text-gray-800">
          Hello Jakarta - MapLibre
        </h1>
      </div>
      <div className="w-full max-w-5xl h-[500px] shadow-md rounded-lg overflow-hidden bg-white">
        <MapLibreClient />
      </div>
    </div>
  );
}
