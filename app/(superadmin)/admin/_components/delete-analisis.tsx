import { StateUpdate, TypeSelectedKantor } from "@/constants/useForm";
import { startTransition, useActionState, useEffect } from "react";

import { toast } from "sonner";
import { DeleteKantor } from "./actions";
import { DeletePopUpKantor } from "./popup-delete-kantor";

export function DeleteKantorDialog({
  refetch,
  open,
  HandleCloseDialog,
  CurrentData,
  title,
}: {
  refetch: () => void;
  open: boolean;
  HandleCloseDialog: (open: boolean) => void;
  CurrentData?: TypeSelectedKantor | null;
  title: string;
}) {
  const InitalDeleteKantor = {
    status: "idle",
    errors: { ...StateUpdate.errors },
  };

  const [InitialDelete, DeleteKantorAction, isLoading] = useActionState(
    DeleteKantor,
    InitalDeleteKantor,
  );

  const onSubmit = () => {
    const formData = new FormData();
    formData.append("id", CurrentData!.id.toString());

    startTransition(() => {
      DeleteKantorAction(formData);
    });
  };

  useEffect(() => {
    if (InitialDelete.status == "error") {
      toast.error("Menghapus Kantor Berhasil bro", {
        description: InitialDelete.errors?._form?.[0],
      });
    }
    if (InitialDelete.status == "success") {
      toast.success("Berhasil Menghapus Kantor");
      refetch();
      HandleCloseDialog?.(false);
    }
  }, [InitialDelete]);

  return (
    <DeletePopUpKantor
      open={open}
      HandleClosePopup={HandleCloseDialog}
      isLoading={isLoading}
      onSubmit={onSubmit}
      title={title}
    />
  );
}
