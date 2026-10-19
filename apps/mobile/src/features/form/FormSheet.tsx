import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { FormSpec } from '@evoloop/client-model';
import { formSession } from '@evoloop/client-model';
import { useTheme } from '../../app/providers/ThemeProvider.tsx';
import { Action, Copy, Field, Row } from '../../ui/primitives.tsx';
import { FieldList } from './FieldList.tsx';

export function FormSheet({
  spec,
  busy,
  error,
  close,
  submit,
}: {
  spec: FormSpec;
  busy: boolean;
  error: string;
  close(): void;
  submit(values: Record<string, string>): Promise<void>;
}) {
  const { colors } = useTheme();
  const [values, setValues] = useState<Record<string, string>>(() => formSession(spec, '').initial);
  const update = (key: string, value: string) => setValues((previous) => ({ ...previous, [key]: value }));
  return (
    <Modal animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 22, gap: 18 }}>
            <Copy title>{spec.title}</Copy>
            {spec.description && <Copy muted>{spec.description}</Copy>}
            {spec.fields
              .filter((field) => !field.when || field.when.values.includes(values[field.when.key] ?? ''))
              .map((field) => (
                <View key={field.key} style={{ gap: 8 }}>
                  {field.list ? (
                    <>
                      <Copy title>{field.label}</Copy>
                      <FieldList
                        definition={field.list}
                        value={values[field.key] ?? '[]'}
                        update={(value) => update(field.key, value)}
                        busy={busy}
                      />
                    </>
                  ) : field.options ? (
                    <>
                      <Copy muted>{field.label}</Copy>
                      <Row>
                        {field.options.map((option) => (
                          <Action
                            key={option.value}
                            title={(values[field.key] === option.value ? '✓ ' : '') + option.label}
                            quiet={values[field.key] !== option.value}
                            disabled={busy}
                            onPress={() => update(field.key, option.value)}
                          />
                        ))}
                      </Row>
                    </>
                  ) : (
                    <Field
                      label={field.label}
                      value={values[field.key] ?? ''}
                      onChange={(value) => update(field.key, value)}
                      disabled={busy}
                      secret={field.secret ?? false}
                      multiline={field.multiline ?? false}
                    />
                  )}
                </View>
              ))}
            {!!error && <Copy>{error}</Copy>}
            <Action
              title={busy ? '正在保存…' : (spec.submitLabel ?? '保存')}
              disabled={busy}
              onPress={() => {
                void submit(values);
              }}
            />
            <Action title="取消" quiet disabled={busy} onPress={close} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
