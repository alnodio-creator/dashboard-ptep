import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/zonanilaitanah/schema.prisma",

  migrations: {
    path: "prisma/zonanilaitanah/migrations",
  },

  datasource: {
    url: env("DATABASE_URL_ZONANILAITANAH"),
  },
});
