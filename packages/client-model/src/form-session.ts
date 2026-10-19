export type FormValues = Readonly<Record<string, string>>;
export interface FormField {
  readonly key: string;
  readonly label: string;
  readonly initial?: string;
  readonly secret?: boolean;
  readonly multiline?: boolean;
  readonly when?: { readonly key: string; readonly values: readonly string[] };
  readonly options?: readonly { value: string; label: string }[];
  readonly list?: {
    readonly fields: readonly FormField[];
    readonly initial: readonly Readonly<Record<string, string>>[];
    readonly maxRows: number;
  };
}
export interface FormSpec {
  readonly title: string;
  readonly description?: string;
  readonly fields: readonly FormField[];
  readonly submitLabel?: string;
  submit(values: FormValues): Promise<void>;
}
/** Keeps the same idempotency identity and entered values through a failed save. */
export function formSession(spec: FormSpec, id: string) {
  return {
    spec,
    id,
    initial: Object.fromEntries(
      spec.fields.map((field) => [field.key, field.list ? JSON.stringify(field.list.initial) : (field.initial ?? '')]),
    ),
  };
}
