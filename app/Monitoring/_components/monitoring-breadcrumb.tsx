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

  const paths = pathname.split("/").filter(Boolean);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {paths.map((path, index) => {
          const decodedPath = decodeURIComponent(path);

          return (
            <Fragment key={`path-${path}`}>
              <BreadcrumbItem>
                {index < paths.length - 1 ? (
                  <BreadcrumbLink
                    href={`/${paths.slice(0, index + 1).join("/")}`}
                  >
                    {decodedPath}
                  </BreadcrumbLink>
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
