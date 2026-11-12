import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import type { ReactNode } from "react";
import { Button } from "#/components/ui/button.tsx";
import { Spinner } from "#/components/ui/feedback.tsx";
import { Field } from "#/components/ui/field.tsx";
import { Input, Textarea } from "#/components/ui/input.tsx";
import { Select, type SelectOption } from "#/components/ui/select.tsx";

/*
 * The app's form kit: TanStack Form bound to the design system. A form is
 * built with `useAppForm` and rendered as
 *
 *   <form.AppForm>
 *     <form.Form>
 *       <form.AppField name="…">{(f) => <f.TextField label="…" />}</form.AppField>
 *       <form.SubmitButton>Save</form.SubmitButton>
 *     </form.Form>
 *   </form.AppForm>
 *
 * so every field gets the same label, error and accessibility wiring.
 */

const { fieldContext, formContext, useFieldContext, useFormContext } = createFormHookContexts();

/** Messages to show: only once the user has touched the field or tried to submit. */
const useErrors = (): ReadonlyArray<string> => {
  const field = useFieldContext<unknown>();
  const shown = field.state.meta.isTouched || field.form.state.submissionAttempts > 0;
  if (!shown) return [];
  return field.state.meta.errors.flatMap((error: unknown) =>
    typeof error === "string"
      ? [error]
      : typeof error === "object" && error !== null && "message" in error
        ? [String(error.message)]
        : [],
  );
};

interface BaseFieldProps {
  readonly label: ReactNode;
  readonly description?: ReactNode;
  readonly className?: string;
}

function TextField({
  label,
  description,
  className,
  type = "text",
  placeholder,
  autoFocus,
  autoComplete,
  inputMode,
}: BaseFieldProps & {
  readonly type?: "text" | "email" | "tel" | "url" | "date";
  readonly placeholder?: string;
  readonly autoFocus?: boolean;
  readonly autoComplete?: string;
  readonly inputMode?: "text" | "numeric" | "decimal" | "email" | "tel" | "url";
}) {
  const field = useFieldContext<string>();
  return (
    <Field label={label} description={description} errors={useErrors()} className={className}>
      <Input
        name={field.name}
        type={type}
        value={field.state.value}
        onValueChange={(value) => field.handleChange(value)}
        onBlur={field.handleBlur}
        {...(placeholder !== undefined && { placeholder })}
        {...(autoFocus !== undefined && { autoFocus })}
        {...(autoComplete !== undefined && { autoComplete })}
        {...(inputMode !== undefined && { inputMode })}
      />
    </Field>
  );
}

function TextareaField({
  label,
  description,
  className,
  placeholder,
  rows = 4,
}: BaseFieldProps & { readonly placeholder?: string; readonly rows?: number }) {
  const field = useFieldContext<string>();
  const errors = useErrors();
  return (
    <Field label={label} description={description} errors={errors} className={className}>
      <Textarea
        name={field.name}
        rows={rows}
        value={field.state.value}
        onChange={(event) => field.handleChange(event.target.value)}
        onBlur={field.handleBlur}
        aria-invalid={errors.length > 0 || undefined}
        {...(placeholder !== undefined && { placeholder })}
      />
    </Field>
  );
}

function SelectField<T extends string>({
  label,
  description,
  className,
  options,
  placeholder,
}: BaseFieldProps & {
  readonly options: ReadonlyArray<SelectOption<T>>;
  readonly placeholder?: string;
}) {
  const field = useFieldContext<T>();
  return (
    <Field label={label} description={description} errors={useErrors()} className={className}>
      <Select
        options={options}
        value={field.state.value}
        onValueChange={(value) => field.handleChange(value)}
        onBlur={field.handleBlur}
        {...(placeholder !== undefined && { placeholder })}
      />
    </Field>
  );
}

/** A `<form>` that submits through TanStack Form, with its validation instead of the browser's. */
function Form({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  const form = useFormContext();
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
      className={className}
    >
      {children}
    </form>
  );
}

function SubmitButton({
  children,
  disabled = false,
}: {
  readonly children: ReactNode;
  readonly disabled?: boolean;
}) {
  const form = useFormContext();
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button type="submit" variant="primary" disabled={disabled || isSubmitting}>
          {isSubmitting && <Spinner />}
          {children}
        </Button>
      )}
    </form.Subscribe>
  );
}

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField, TextareaField, SelectField },
  formComponents: { Form, SubmitButton },
});
