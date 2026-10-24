"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ChartNoAxesCombined,
  ExternalLink,
  Layers3,
  Map,
  Menu,
  ShieldCheck,
  Landmark,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { basePath } from "@/constants/menu-sidebar";
import Image from "next/image";
import LayoutCard from "./landing-page-card";

// ==========================================
// KONFIGURASI APLIKASI
// Ubah nama, deskripsi, URL, dan ikon di sini.
// ==========================================

const applications = [
  {
    number: "01",
    image: `${basePath}/images/hero-pertanahan-1.jpg`,
    title: "Aplikasi Pertama",
    description:
      "Akses sistem dan layanan digital untuk mendukung kegiatan pertanahan.",
    href: `${basePath}/Monitoring`,
    icon: Map,
    category: "Sistem Informasi",
  },
  {
    number: "02",
    image: `${basePath}/images/hero-pertanahan-2.jpg`,
    title: "Aplikasi Kedua",
    description:
      "Pantau informasi, data, dan dashboard untuk mendukung pengambilan keputusan.",
    href: `${basePath}/dashboard`,
    icon: ChartNoAxesCombined,
    category: "Dashboard",
  },
  {
    number: "03",
    image: `${basePath}/images/hero-pertanahan-3.jpg`,
    title: "Aplikasi Ketiga",
    description:
      "Jelajahi layanan dan platform digital dalam satu portal terintegrasi.",
    href: "https://dashboard-potensi.vercel.app/Potensi-smartCity",
    icon: Layers3,
    category: "Layanan Digital",
  },
];

const heroSlides = [
  {
    image: `${basePath}/images/hero-pertanahan-1.jpg`,
    label: "LAYANAN PERTANAHAN DIGITAL",
    title: "Satu Portal,",
    highlight: "Beragam Layanan Pertanahan",
    description:
      "Akses berbagai aplikasi dan sistem informasi pertanahan dalam satu portal yang terintegrasi.",
    buttonText: "Jelajahi Aplikasi",
    target: "#aplikasi",
  },
  {
    image: `${basePath}/images/hero-pertanahan-2.jpg`,
    label: "TRANSFORMASI DIGITAL",
    title: "Data Spasial,",
    highlight: "Informasi Lebih Terarah",
    description:
      "Manfaatkan teknologi geospasial untuk mendukung pengelolaan data dan informasi pertanahan.",
    buttonText: "Lihat Aplikasi",
    target: "#aplikasi",
  },
  {
    image: `${basePath}/images/hero-pertanahan-3.jpg`,
    label: "INFORMASI TATA RUANG",
    title: "Mendukung,",
    highlight: "Pengelolaan Wilayah",
    description:
      "Temukan platform digital yang mendukung pengelolaan informasi, pemetaan, dan administrasi pertanahan.",
    buttonText: "Mulai Sekarang",
    target: "#aplikasi",
  },
];

function HeroCarousel() {
  const [activeSlide, setActiveSlide] = useState(0);

  const currentSlide = heroSlides[activeSlide];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, []);

  const previousSlide = () => {
    setActiveSlide(
      (current) => (current - 1 + heroSlides.length) % heroSlides.length,
    );
  };

  const nextSlide = () => {
    setActiveSlide((current) => (current + 1) % heroSlides.length);
  };

  return (
    <div className="absolute inset-0">
      {/* Gambar latar */}
      {heroSlides.map((slide, index) => (
        <div
          key={slide.image}
          className={`absolute inset-0 transition-opacity duration-700 ${
            activeSlide === index
              ? "opacity-100"
              : "pointer-events-none opacity-0"
          }`}
          aria-hidden={activeSlide !== index}
        >
          <Image
            width={1080}
            height={1350}
            src={slide.image}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      ))}

      {/* Overlay agar tulisan tetap terbaca */}
      <div className="absolute inset-0 bg-linear-to-r from-[#0b2854]/95 via-[#123a70]/80 to-[#123a70]/25" />
      <div className="absolute inset-0 bg-linear-to-r from-[#0b2854]/50 via-transparent to-[#0b2854]/10" />

      {/* Konten */}
      <div className="relative z-10 mx-auto flex min-h-130 max-w-7xl flex-col justify-center px-5 pb-24 pt-16 sm:min-h-140 sm:px-8 lg:min-h-150 lg:px-8">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold tracking-wider text-blue-50 backdrop-blur-sm">
            <ShieldCheck className="size-4" />
            {currentSlide.label}
          </div>

          <h1
            key={currentSlide.title}
            className="animate-in fade-in slide-in-from-bottom-3 duration-500 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-6xl"
          >
            {currentSlide.title}
            <br />
            <span className="text-blue-200">{currentSlide.highlight}</span>
          </h1>

          <p className="mt-6 max-w-2xl text-sm leading-7 text-blue-50/90 sm:text-base sm:leading-8">
            {currentSlide.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={currentSlide.target}
              className="inline-flex h-11 items-center justify-center rounded-md bg-white px-6 text-sm font-semibold text-[#153e75] shadow-lg transition hover:bg-blue-50"
            >
              {currentSlide.buttonText}
              <ArrowRight className="ml-2 size-4" />
            </a>

            <a
              href="https://www.atrbpn.go.id/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-md border border-white/40 bg-white/10 px-6 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              Situs Resmi ATR/BPN
              <ArrowUpRight className="ml-2 size-4" />
            </a>
          </div>
        </div>

        {/* Identitas portal */}
        <div className="mt-10 hidden items-center gap-3 border-t border-white/20 pt-5 sm:flex">
          <Landmark className="size-5 text-blue-200" />
          <span className="text-sm text-white/80">
            Portal Aplikasi Digital Pertanahan
          </span>
        </div>
      </div>

      {/* Navigasi carousel */}
      <div className="absolute bottom-6 right-5 z-20 flex items-center gap-3 sm:bottom-8 sm:right-8 lg:right-[max(2rem,calc((100vw-80rem)/2))]">
        <span className="mr-1 text-sm font-medium text-white">
          {String(activeSlide + 1).padStart(2, "0")}
          <span className="mx-1 text-white/50">/</span>
          {String(heroSlides.length).padStart(2, "0")}
        </span>

        <button
          type="button"
          onClick={previousSlide}
          aria-label="Slide sebelumnya"
          className="flex size-10 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/25"
        >
          <ChevronLeft className="size-5" />
        </button>

        <button
          type="button"
          onClick={nextSlide}
          aria-label="Slide berikutnya"
          className="flex size-10 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/25"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      {/* Indikator slide */}
      <div className="absolute bottom-8 left-5 z-20 flex gap-2 sm:left-8 lg:left-[max(2rem,calc((100vw-80rem)/2))]">
        {heroSlides.map((slide, index) => (
          <button
            key={slide.image}
            type="button"
            onClick={() => setActiveSlide(index)}
            aria-label={`Buka slide ${index + 1}`}
            aria-current={activeSlide === index ? "true" : undefined}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              activeSlide === index
                ? "w-10 bg-white"
                : "w-5 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#153e75] text-white shadow-sm">
              <Landmark className="size-6" />
            </div>

            <div>
              <p className="text-sm font-bold tracking-tight text-[#153e75] sm:text-base">
                Kementerian ATR/BPN
              </p>
              <p className="hidden text-xs text-slate-500 sm:block">
                Portal Aplikasi Digital
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-3 sm:flex">
            <Badge
              variant="outline"
              className="gap-2 border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700"
            >
              <span className="size-2 rounded-full bg-emerald-500" />
              Portal Aplikasi
            </Badge>

            <a
              href="https://www.atrbpn.go.id/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-100"
            >
              Situs Resmi
              <ExternalLink className="ml-2 size-4" />
            </a>
          </div>

          <div className="sm:hidden">
            <Menu className="size-6 text-[#153e75]" />
          </div>
        </div>
      </header>

      {/* HERO */}
      {/* HERO CAROUSEL */}
      <section className="relative overflow-hidden bg-[#123a70]">
        <div className="relative min-h-130 sm:min-h-140 lg:min-h-150">
          {/*
      State carousel
    */}
          <HeroCarousel />
        </div>
      </section>

      {/* DAFTAR APLIKASI */}
      <section id="aplikasi" className="scroll-mt-24 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">
                Pusat Akses
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Daftar Aplikasi
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Pilih salah satu aplikasi berikut untuk mulai mengakses layanan
                yang tersedia.
              </p>
            </div>

            <Badge
              variant="outline"
              className="w-fit border-slate-200 bg-white px-3 py-1.5 text-slate-600"
            >
              {applications.length} Aplikasi
            </Badge>
          </div>
          <LayoutCard applications={applications} />

          {/* <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {applications.map((app) => {
              const Icon = app.icon;

              return (
                <Card
                  key={app.number}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
                >
                  <div className="h-1 w-full bg-[#153e75] transition-colors group-hover:bg-blue-500" />

                  <CardHeader className="pb-3">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex size-12 items-center justify-center rounded-xl bg-blue-50 text-[#153e75] transition-colors group-hover:bg-[#153e75] group-hover:text-white">
                        <Icon className="size-6" />
                      </div>

                      <span className="text-sm font-semibold tracking-widest text-slate-300">
                        {app.number}
                      </span>
                    </div>

                    <Badge
                      variant="secondary"
                      className="mb-2 w-fit bg-slate-100 font-medium text-slate-600"
                    >
                      {app.category}
                    </Badge>

                    <CardTitle className="text-lg font-bold text-slate-900">
                      {app.title}
                    </CardTitle>

                    <CardDescription className="min-h-18 text-sm leading-6 text-slate-500">
                      {app.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1" />

                  <CardFooter className="pt-0">
                    <a
                      href={app.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 w-full items-center justify-center rounded-md bg-[#153e75] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1e4f91]"
                    >
                      Buka Aplikasi
                      <ArrowUpRight className="ml-2 size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </a>
                  </CardFooter>
                </Card>
              );
            })}
          </div> */}

          {/* INFORMASI TAMBAHAN */}
          <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#153e75] shadow-sm">
                <ShieldCheck className="size-5" />
              </div>

              <div>
                <h3 className="font-semibold text-slate-900">
                  Gunakan aplikasi sesuai kewenangan
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Pastikan kamu menggunakan akun dan akses yang sesuai dengan
                  ketentuan masing-masing sistem.
                </p>
              </div>
            </div>

            <a
              href="https://www.atrbpn.go.id/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-[#153e75] transition-colors hover:bg-blue-100"
            >
              Informasi Resmi
              <ExternalLink className="ml-2 size-4" />
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div>
            <p className="text-sm font-semibold text-[#153e75]">
              Kementerian ATR/BPN
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Portal Aplikasi Digital
            </p>
          </div>

          <p className="text-xs leading-5 text-slate-400">
            © {new Date().getFullYear()} Kementerian Agraria dan Tata Ruang /
            Badan Pertanahan Nasional.
          </p>
        </div>
      </footer>
    </main>
  );
}
