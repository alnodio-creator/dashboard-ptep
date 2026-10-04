import { FormInput } from "@/components/commons/form-input";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Gunalahan } from "@/constants/gunalahan";
import { FilePlusCorner, Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { FieldValues, Path, UseFormReturn } from "react-hook-form";
import FormSelect from "./form-select";

export default function CommonsFormMonitoring<T extends FieldValues>({
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
  selectItem?: string[];
}) {
  const selectedGunaanLahan = form.watch("gunalahan" as Path<T>);

  const selectedData = Gunalahan.find(
    (item) => item.gunalahan === selectedGunaanLahan,
  );

  const gunalahanOptions = Gunalahan.map((item) => ({
    value: item.gunalahan,
    label: item.gunalahan,
  }));

  const detailOptions =
    selectedData?.detail.map((item) => ({
      value: item,
      label: item,
    })) ?? [];
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
          {/* Guna Lahan */}
          <FormSelect
            form={form}
            name={"gunalahan" as Path<T>}
            label="Guna Lahan"
            placeholder="Pilih guna lahan"
            items={gunalahanOptions}
          />

          {/* Detail Guna Lahan */}
          {selectedGunaanLahan && (
            <FormSelect
              form={form}
              name={"namaobj" as Path<T>}
              label="Detail Guna Lahan"
              placeholder="Pilih detail guna lahan"
              items={detailOptions}
            />
          )}

          <FormInput
            form={form}
            name={"tahun" as Path<T>}
            label="Tahun"
            placeholder="Masukkan Tahun yang di analisis"
            type="text"
          />

          <FormInput
            form={form}
            name={"jumlahzona" as Path<T>}
            label="Jumlah Zona"
            placeholder="Masukkan Jumlah Zona"
            type="text"
          />
          <FormInput
            form={form}
            name={"ratanilai" as Path<T>}
            label="Rata Nilai"
            placeholder="Masukkan Rata Nilai"
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
