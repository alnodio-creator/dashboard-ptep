import { Controller, FieldValues, Path, UseFormReturn } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "../ui/field";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { TypeUpdateAnalisisSchema } from "@/validations/auth-validations";
import { TypeSelectedKantor } from "@/constants/useForm";

type FormSelectProps<T extends FieldValues> = {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  selectItem?: TypeSelectedKantor[];
  onSelect?: (item: TypeSelectedKantor) => void;
};

export default function FormSelectUpdate<T extends FieldValues>({
  form,
  name,
  label,
  placeholder,
  selectItem = [],
  onSelect,
}: FormSelectProps<T>) {
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) return selectItem;

    return selectItem.filter((item) =>
      item.nama.toLowerCase().includes(keyword),
    );
  }, [selectItem, search]);

  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => {
        const selectedItem = selectItem.find(
          (item) => String(item.id) === String(field.value),
        );

        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>

            <Select
              value={field.value ? String(field.value) : ""}
              onValueChange={(id) => {
                const selected = selectItem.find(
                  (item) => String(item.id) === id,
                );

                if (!selected) return;

                // value Select = ID
                field.onChange(selected.id);

                // Data lainnya dikirim ke form
                onSelect?.(selected);

                setSearch("");
              }}
            >
              <SelectTrigger
                id={field.name}
                aria-invalid={fieldState.invalid}
                className={cn("w-full")}
              >
                <SelectValue placeholder={placeholder ?? `Pilih ${label}`}>
                  {selectedItem?.nama}
                </SelectValue>
              </SelectTrigger>

              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{label}</SelectLabel>

                  <div className="p-2">
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={`Cari ${label.toLowerCase()}...`}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                      }}
                    />
                  </div>

                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.nama}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Data tidak ditemukan
                    </div>
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>

            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
}
