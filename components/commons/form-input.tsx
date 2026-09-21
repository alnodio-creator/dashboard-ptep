import { Controller, FieldValues, Path, UseFormReturn } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";

export function FormInput<T extends FieldValues>({
  form,
  name,
  label,
  placeholder,
  type,
}: {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  type: "email" | "password";
}) {
  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor="form-rhf-demo-title">{label}</FieldLabel>
          <Input
            {...field}
            id="form-rhf-demo-title"
            aria-invalid={fieldState.invalid}
            placeholder={placeholder}
            autoComplete="off"
            type={type}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
