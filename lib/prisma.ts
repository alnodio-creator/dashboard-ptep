import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient as PenilaianTanahClient } from "../generated/penilaitanah/client";
import { PrismaClient as ZonaNilaiTanahClient } from "../generated/zonanilaitanah/client";
import { PrismaClient as BelajarSipentaClient } from "../generated/belajarsipenta/client";

// ===============================
// DATABASE: penilaitanah
// ===============================

const penilaianTanahAdapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prismaPenilaianTanah = new PenilaianTanahClient({
  adapter: penilaianTanahAdapter,
});

// ===============================
// DATABASE: kkpdb_new
// ===============================

const zonaNilaiTanahAdapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL_ZONANILAITANAH!,
});

const prismaZonaNilaiTanah = new ZonaNilaiTanahClient({
  adapter: zonaNilaiTanahAdapter,
});

// ===============================
// DATABASE: belajarsipenta
// ===============================

const belajarSipentaAdapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL_BELAJARSIPENTA!,
});

const prismaBelajarSipenta = new BelajarSipentaClient({
  adapter: belajarSipentaAdapter,
});

export { prismaPenilaianTanah, prismaZonaNilaiTanah, prismaBelajarSipenta };
