import { DarkModeToggle } from "@/components/dark-themes/dark-toggle";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function HeaderReusable({ Kota }: { Kota: string }) {
  return (
    <header className="border-b border-border bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary-foreground/10">
            {/* <LandPlot className="size-5" /> */}
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary-foreground/60"></p>
            <h1 className="text-lg font-semibold tracking-tight">
              Land value summaries
            </h1>
          </div>
        </div>
        <div className="flex gap-2 justify-between items-center">
          <Button
            onClick={() => window.print()}
            variant="outline"
            className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
          >
            <Printer data-icon="inline-start" /> Print report
          </Button>
          <DarkModeToggle />
        </div>
      </div>
    </header>
  );
}
