import { DarkModeToggle } from "@/components/dark-themes/dark-toggle";
import { KeyRound } from "lucide-react";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="absolute top-4 right-4">
        <DarkModeToggle />
      </div>
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-medium">
          <div className="bg-teal-500 flex p-2 items-center justify-center rounded-md">
            <KeyRound className="size-4" />
          </div>
          Login Untuk Akses Dashboard PTEP
        </div>
        {children}
      </div>
    </div>
  );
}
