"use client";

import { useState } from "react";

import { ChevronDown, ChartNoAxesCombined } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { RekapTahapanProvinsi } from "./rekap-tahapan-page";

type Props = {
  title: string;
  description: string;
  data: React.ComponentProps<typeof RekapTahapanProvinsi>["data"];
};

export function RekapTahapanCollapsible({ title, description, data }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow duration-300 hover:shadow-md">
      {/* HEADER */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors duration-200 hover:bg-muted/50 md:p-5"
      >
        <motion.div
          animate={{
            scale: open ? 1.05 : 1,
          }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700"
        >
          <ChartNoAxesCombined className="size-5" />
        </motion.div>

        <div className="min-w-0 flex-1">
          <h2 className="font-bold">{title}</h2>

          <p className="mt-1 text-sm text-muted-foreground">{description}</p>

          <motion.p
            key={open ? "open" : "closed"}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2 text-xs font-medium text-blue-600"
          >
            {open ? "Tutup rekap" : "Klik untuk melihat rekap"}
          </motion.p>
        </div>

        {/* ANIMASI CHEVRON */}
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{
            duration: 0.3,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="shrink-0 text-muted-foreground"
        >
          <ChevronDown className="size-5" />
        </motion.div>
      </button>

      {/* ANIMASI KONTEN */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="rekap-content"
            initial={{
              height: 0,
              opacity: 0,
            }}
            animate={{
              height: "auto",
              opacity: 1,
            }}
            exit={{
              height: 0,
              opacity: 0,
            }}
            transition={{
              height: {
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1],
              },
              opacity: {
                duration: 0.25,
                ease: "easeOut",
              },
            }}
            className="overflow-hidden"
          >
            <motion.div
              initial={{ y: -10 }}
              animate={{ y: 0 }}
              exit={{ y: -6 }}
              transition={{
                duration: 0.3,
                ease: "easeOut",
              }}
              className="border-t p-3 md:p-5"
            >
              <RekapTahapanProvinsi
                title={title}
                description={description}
                data={data}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
