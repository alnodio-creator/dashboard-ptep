import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

export function DeletePopUpMonitor({
  open,
  HandleClosePopup,
  isLoading,
  onSubmit,
  title,
}: {
  open: boolean;
  onSubmit: () => void;
  HandleClosePopup: (open: boolean) => void;
  title: string;
  isLoading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={HandleClosePopup}>
      <DialogContent className="sm:max-sm:">
        <form className="grid gap-5">
          <DialogHeader>
            <DialogTitle>Delete {title}</DialogTitle>
            <DialogDescription>
              Yakin untuk menghapus data{" "}
              <span className="font-bold">{title} ?</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              className="
              inline-flex h-9 items-center gap-2
              rounded-lg border border-gray-200
              bg-gray-50 px-4
              text-sm font-medium text-gray-600
              shadow-sm transition-all
              hover:bg-gray-100 hover:text-gray-700
            "
            >
              Cancel
            </DialogClose>
            <Button
              type="submit"
              formAction={onSubmit}
              variant={"default"}
              className="bg-red-400 hover:bg-red-700"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : "Hapus"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
