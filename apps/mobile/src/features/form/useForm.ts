import { useRef, useState } from 'react';
import { errorText } from '@evoloop/client-model';
import type { FormSpec } from '@evoloop/client-model';

export function useForm() {
  const [form, setForm] = useState<FormSpec | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const active = useRef(false);
  async function run(work: () => Promise<unknown>) {
    if (active.current) return;
    active.current = true;
    setBusy(true);
    setError('');
    try {
      await work();
    } catch (failure) {
      setError(errorText(failure));
    } finally {
      active.current = false;
      setBusy(false);
    }
  }
  function edit(spec: FormSpec) {
    if (!active.current) {
      setError('');
      setForm(spec);
    }
  }
  function open(build: () => FormSpec) {
    try {
      edit(build());
    } catch (failure) {
      setError(errorText(failure));
    }
  }
  return {
    form,
    busy,
    error,
    edit,
    open,
    run,
    close: () => {
      if (!active.current) {
        setForm(null);
        setError('');
      }
    },
    submit: (values: Readonly<Record<string, string>>) =>
      run(async () => {
        await form?.submit(values);
        setForm(null);
      }),
  };
}
