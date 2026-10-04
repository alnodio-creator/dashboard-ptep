import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { AppleIcon, FilePlusCorner, Loader2 } from "lucide-react";
import { FormEvent } from "react";
import { FieldValues, Path, UseFormReturn } from "react-hook-form";

import { FormInput } from "./form-input";
import FormSelect, { SelectItemKantor } from "./form-select";

export default function CommonsForm<T extends FieldValues>({
  form,
  onSubmit,
  isLoading,
  type,
  selectItem,
}: {
  form: UseFormReturn<T>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  type: "Create" | "Update";
  selectItem?: SelectItemKantor[];
}) {
  return (
    <DialogContent className="sm:max-w-xl max-h-[90vh]">
      <DialogHeader>
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <FilePlusCorner className="w-6 h-6" />

            <DialogTitle>{type} Analisis</DialogTitle>
          </div>

          <DialogDescription>
            {type === "Create" ? "Tambah analisis baru" : "Ubah data analisis"}
          </DialogDescription>
        </div>
      </DialogHeader>

      <form onSubmit={onSubmit}>
        <div className="space-y-4 max-h-[50vh] px-1 overflow-y-auto">
          <FormSelect
            form={form}
            name={"kantorid" as Path<T>}
            label="Kantor Pertanahan"
            placeholder="Pilih Kantor Pertanahan"
            selectItem={selectItem}
            onSelect={(item) => {
              form.setValue("nama" as Path<T>, item.nama as never);

              form.setValue("kantorid" as Path<T>, item.kantorid as never);

              form.setValue("kanwilid" as Path<T>, item.induk as never);
              form.setValue("kode" as Path<T>, item.kode as never);
            }}
          />

          <FormInput
            form={form}
            name={"nomorsk" as Path<T>}
            label="Nomor SK"
            placeholder="Masukkan Nomor SK yang di analisis"
            type="text"
          />

          <FormInput
            form={form}
            name={"tahun" as Path<T>}
            label="Tahun"
            placeholder="Masukkan Tahun yang di analisis"
            type="text"
          />

          <FormInput
            form={form}
            name={"description" as Path<T>}
            label="Deskripsi"
            placeholder="Masukkan Deskripsi"
            type="text"
          />
        </div>

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

          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : type}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
