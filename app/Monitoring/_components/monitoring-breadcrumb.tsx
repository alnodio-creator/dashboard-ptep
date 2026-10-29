"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

export default function MonitoringBreadcrumb() {
  const pathname = usePathname();

  const basePath = "/sipenta/tatausaha-dashboard";

  // Hapus basePath jika sudah ada di pathname
  const cleanPathname = pathname.startsWith(basePath)
    ? pathname.slice(basePath.length)
    : pathname;

  const paths = cleanPathname.split("/").filter(Boolean);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {paths.map((path, index) => {
          const decodedPath = decodeURIComponent(path);

          const href = `${basePath}/${paths.slice(0, index + 1).join("/")}`;

          return (
            <Fragment key={`path-${index}`}>
              <BreadcrumbItem>
                {index < paths.length - 1 ? (
                  <BreadcrumbLink href={href}>{decodedPath}</BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{decodedPath}</BreadcrumbPage>
                )}
              </BreadcrumbItem>

              {index < paths.length - 1 && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
