import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { errorText } from '@evoloop/client-model';
import type { Identity } from '../../platform/security/vault.ts';
import { readIdentity } from '../../platform/security/vault.ts';
import { openAccount } from '../bootstrap/open-account.ts';

export function useAccount() {
  const [identity, setIdentity] = useState<Identity | null>(null),
    [opened, setOpened] = useState<Awaited<ReturnType<typeof openAccount>> | null>(null);
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const current = useRef(opened),
    closing = useRef<Promise<void>>(Promise.resolve());
  const epoch = useRef(0),
    opening = useRef(false);
  current.current = opened;
  function lock() {
    epoch.current++;
    const session = current.current;
    if (session) {
      session.gateway.unlocked = false;
      setIdentity(session.gateway.identity);
      current.current = null;
      setOpened(null);
      closing.current = session.close().catch((failure) => setError(errorText(failure)));
    }
  }
  useEffect(() => {
    void readIdentity()
      .then(setIdentity)
      .catch((failure) => setError(errorText(failure)));
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') lock();
    });
    return () => {
      subscription.remove();
      lock();
    };
  }, []);
  async function unlock(next = identity) {
    if (!next || opening.current) return;
    opening.current = true;
    const requestedEpoch = epoch.current;
    setBusy(true);
    setError('');
    try {
      await closing.current;
      const session = await openAccount(next);
      if (requestedEpoch !== epoch.current || AppState.currentState === 'background') {
        await session.close();
        return;
      }
      setIdentity(next);
      setOpened(session);
    } catch (failure) {
      setError(errorText(failure));
    } finally {
      opening.current = false;
      setBusy(false);
    }
  }
  return { identity, opened, error, busy, unlock, lock };
}
