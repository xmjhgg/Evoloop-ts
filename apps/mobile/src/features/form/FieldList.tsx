import type { FormField } from '@evoloop/client-model';
import { Action, Card, Copy, Field, Row } from '../../ui/primitives.tsx';

export function FieldList({
  definition,
  value,
  update,
  busy,
}: {
  definition: NonNullable<FormField['list']>;
  value: string;
  update(value: string): void;
  busy: boolean;
}) {
  const rows = JSON.parse(value) as Record<string, string>[];
  function set(index: number, key: string, text: string) {
    update(JSON.stringify(rows.map((row, position) => (position === index ? { ...row, [key]: text } : row))));
  }
  return (
    <>
      {rows.map((row, index) => (
        <Card key={index} title={`第 ${index + 1} 项`}>
          {definition.fields.map((field) =>
            field.options ? (
              <Row key={field.key}>
                <Copy muted>{field.label}</Copy>
                {field.options.map((option) => (
                  <Action
                    key={option.value}
                    title={(row[field.key] === option.value ? '✓ ' : '') + option.label}
                    quiet
                    disabled={busy}
                    onPress={() => set(index, field.key, option.value)}
                  />
                ))}
              </Row>
            ) : (
              <Field
                key={field.key}
                label={field.label}
                value={row[field.key] ?? ''}
                disabled={busy}
                onChange={(text) => set(index, field.key, text)}
              />
            ),
          )}
          <Action
            title="移除这一项"
            quiet
            disabled={busy}
            onPress={() => update(JSON.stringify(rows.filter((_, position) => position !== index)))}
          />
        </Card>
      ))}
      <Action
        title="追加一项"
        quiet
        disabled={busy || rows.length >= definition.maxRows}
        onPress={() =>
          update(
            JSON.stringify([
              ...rows,
              Object.fromEntries(definition.fields.map((field) => [field.key, field.initial ?? ''])),
            ]),
          )
        }
      />
    </>
  );
}
