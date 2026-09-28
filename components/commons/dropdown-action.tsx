import { ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import { EllipsisVertical } from "lucide-react";

export default function DropdownAction({
  menu,
}: {
  menu: {
    label: string | ReactNode;
    variant?: "destructive" | "default";
    action?: () => void;
    href?: string;
  }[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="
          inline-flex size-8 items-center justify-center
          rounded-lg
          text-muted-foreground
          hover:bg-muted
          hover:text-foreground
          focus:outline-none
          focus-visible:ring-2
          focus-visible:ring-ring
        "
      >
        <EllipsisVertical className="size-4" />
        <span className="sr-only">Open menu</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-36">
        {menu.map((item, index) => (
          <DropdownMenuItem
            key={`dropdown-action-${index}`}
            variant={item.variant || "default"}
            onClick={() => {
              if (item.href) {
                window.location.href = item.href;
              }

              item.action?.();
            }}
            className="cursor-pointer"
          >
            <span className="flex w-full items-center gap-2">{item.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
