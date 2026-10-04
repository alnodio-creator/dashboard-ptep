import {
  StateUpdate,
  typeCurrentMonitor,
  TypeSelectedKantor,
} from "@/constants/useForm";
import { startTransition, useActionState, useEffect } from "react";

import { toast } from "sonner";
import { DeleteMonitorDetail } from "./actions";

import { DeletePopUpMonitor } from "./popup-delete-monitor";

export function DeleteMonitorDialog({
  refetch,
  open,
  HandleCloseDialog,
  CurrentData,
  title,
}: {
  refetch: () => void;
  open: boolean;
  HandleCloseDialog: (open: boolean) => void;
  CurrentData?: typeCurrentMonitor | null;
  title: string;
}) {
  const InitalDeleteMonitor = {
    status: "idle",
    errors: { ...StateUpdate.errors },
  };

  const [InitialDelete, DeleteMonitorAction, isLoading] = useActionState(
    DeleteMonitorDetail,
    InitalDeleteMonitor,
  );

  const onSubmit = () => {
    const formData = new FormData();
    formData.append("id", CurrentData!.id.toString());

    startTransition(() => {
      DeleteMonitorAction(formData);
    });
  };

  useEffect(() => {
    if (InitialDelete.status == "error") {
      toast.error("Menghapus Monitor Berhasil bro", {
        description: InitialDelete.errors?._form?.[0],
      });
    }
    if (InitialDelete.status == "success") {
      toast.success("Berhasil Menghapus Monitor");
      refetch();
      HandleCloseDialog?.(false);
    }
  }, [InitialDelete]);

  return (
    <DeletePopUpMonitor
      open={open}
      HandleClosePopup={HandleCloseDialog}
      isLoading={isLoading}
      onSubmit={onSubmit}
      title={title}
    />
  );
}
