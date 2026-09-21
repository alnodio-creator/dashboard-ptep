"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function TanstackQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const ClientforQuery = new QueryClient();

  return (
    <QueryClientProvider client={ClientforQuery}>
      {children}
    </QueryClientProvider>
  );
}
