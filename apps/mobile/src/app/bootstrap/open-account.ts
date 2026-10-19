import { CommandBus } from '@evoloop/local-runtime';
import { LocalGateway } from '../../gateways/local.ts';
import { HttpClient } from '../../platform/network/http.ts';
import { openDatabase } from '../../platform/database/connection.ts';
import { databaseName, deviceId, saveIdentity } from '../../platform/security/vault.ts';
import type { Identity } from '../../platform/security/vault.ts';

export async function openAccount(identity: Identity) {
  const database = await openDatabase(databaseName(identity));
  let gateway: LocalGateway | undefined;
  const bus = new CommandBus(database.store, {
    accountId: identity.accountId,
    deviceId: await deviceId(),
    now: () => new Date().toISOString(),
    access: () => ({
      unlocked: gateway?.unlocked ?? true,
      healthAllowed: gateway?.identity.healthAllowed ?? identity.healthAllowed,
      aiAllowed: gateway?.identity.aiAllowed ?? identity.aiAllowed,
      rulesVersion: 'rules-v1',
    }),
    fitnessPolicy: () => 'INFORMATION_REQUIRED',
  });
  try {
    await bus.open();
    gateway = new LocalGateway(
      bus,
      identity,
      new HttpClient(identity.origin, () => gateway?.identity.credential ?? null, fetch),
      database.tasks,
      database.assets,
      saveIdentity,
    );
    await saveIdentity(identity);
    return {
      gateway,
      close: async () => {
        gateway!.unlocked = false;
        await gateway!.idle();
        await bus.serial(database.close);
      },
    };
  } catch (error) {
    await database.close();
    throw error;
  }
}
