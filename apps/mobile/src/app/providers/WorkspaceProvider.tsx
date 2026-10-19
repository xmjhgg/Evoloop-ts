import { createContext, useContext, useSyncExternalStore } from 'react';
import type { PropsWithChildren } from 'react';
import * as Crypto from 'expo-crypto';
import type { LocalGateway } from '../../gateways/local.ts';
import { commandSession } from '../../gateways/command-session.ts';
import { useForm } from '../../features/form/useForm.ts';
import { FormSheet } from '../../features/form/FormSheet.tsx';

type Actions = ReturnType<typeof useForm>;
const WorkspaceContext = createContext<{
  gateway: LocalGateway;
  actions: Actions;
  uuid(): string;
  send: () => ReturnType<typeof commandSession>;
} | null>(null);
export function WorkspaceProvider({ gateway, children }: PropsWithChildren<{ gateway: LocalGateway }>) {
  const actions = useForm();
  return (
    <WorkspaceContext.Provider
      value={{
        gateway,
        actions,
        uuid: Crypto.randomUUID,
        send: () => commandSession(gateway, Crypto.randomUUID, () => new Date().toISOString()),
      }}
    >
      {children}
      {actions.form && (
        <FormSheet
          spec={actions.form}
          busy={actions.busy}
          error={actions.error}
          close={actions.close}
          submit={actions.submit}
        />
      )}
    </WorkspaceContext.Provider>
  );
}
export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw Error('WORKSPACE_PROVIDER_REQUIRED');
  useSyncExternalStore(value.gateway.subscribe, value.gateway.version, value.gateway.version);
  return value;
}
