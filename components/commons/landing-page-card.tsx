import { ArrowUpRight, LucideIcon } from "lucide-react";
import { Badge } from "../ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import Image from "next/image";

type Application = {
  number: string;
  image: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  category: string;
};
export default function LayoutCard({
  applications,
}: {
  applications: Application[];
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {applications.map((app) => {
        const Icon = app.icon;

        return (
          <Card
            key={app.number}
            className="group relative aspect-[4/5] overflow-hidden rounded-2xl border-0 bg-slate-900 p-0 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
          >
            {/* Background image */}
            <Image
              width={1090}
              height={1350}
              src={app.image}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-slate-950/10 transition-colors duration-300 group-hover:from-slate-950/95" />

            {/* Number */}
            <span className="absolute right-5 top-5 z-10 text-sm font-semibold tracking-[0.25em] text-white/80">
              {app.number}
            </span>

            {/* Card content */}
            <div className="relative z-10 flex h-full flex-col justify-end p-6 sm:p-7">
              {/* Icon */}
              <div className="mb-5 flex size-12 items-center justify-center rounded-xl border border-white/20 bg-white/15 text-white backdrop-blur-md transition-colors group-hover:bg-white group-hover:text-[#153e75]">
                <Icon className="size-6" />
              </div>

              {/* Category */}
              <Badge
                variant="secondary"
                className="mb-3 w-fit border border-white/20 bg-white/15 text-white backdrop-blur-md hover:bg-white/20"
              >
                {app.category}
              </Badge>

              {/* Title */}
              <CardHeader className="p-0">
                <CardTitle className="text-2xl font-bold leading-tight text-white sm:text-3xl">
                  {app.title}
                </CardTitle>

                <CardDescription className="mt-3 text-sm leading-6 text-white/80">
                  {app.description}
                </CardDescription>
              </CardHeader>

              {/* Button */}
              <CardFooter className="mt-6 p-0">
                <a
                  href={app.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#153e75] transition-colors hover:bg-blue-50"
                >
                  Buka Aplikasi
                  <ArrowUpRight className="ml-2 size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              </CardFooter>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
