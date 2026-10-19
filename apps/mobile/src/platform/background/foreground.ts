import * as Network from 'expo-network';
import { syncScheduler } from '../../gateways/sync-scheduler.ts';
import type { LocalGateway } from '../../gateways/local.ts';

/** Unlocked foreground work only; iOS background execution is not claimed. */
export function foregroundSync(gateway: LocalGateway) {
  const scheduler = syncScheduler(gateway, {
    set: (work, delay) => setTimeout(work, delay),
    clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
  });
  const network = (state: Network.NetworkState) =>
    scheduler.network(state.isConnected === true && state.isInternetReachable !== false);
  const listener = Network.addNetworkStateListener(network);
  void Network.getNetworkStateAsync()
    .then(network)
    .catch(() => undefined);
  return () => {
    scheduler.stop();
    listener.remove();
  };
}
