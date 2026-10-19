import { conditionSnapshot, observations, profileHistory } from '@evoloop/client-business-core/profile';
import { executionHistory, foodDrafts } from '@evoloop/client-business-core/execution';
import { planningHistory } from '@evoloop/client-business-core/planning';
import { reviewHistory } from '@evoloop/client-business-core/review';
import type { LocalGateway } from './local.ts';
import { historyWorkspace } from '@evoloop/client-business-core/workspace';

export function details(gateway: LocalGateway, day: string) {
  const tx = gateway.bus.transaction();
  return {
    foodDrafts: foodDrafts(tx, day),
    observations: observations(tx, day),
    common: conditionSnapshot(tx, 'COMMON'),
    fitness: conditionSnapshot(tx, 'FITNESS'),
    learning: conditionSnapshot(tx, 'LEARNING'),
  };
}
export function historyIndex(gateway: LocalGateway, day: string) {
  return historyWorkspace(gateway.bus.transaction(), day);
}
export function history(gateway: LocalGateway, kind: 'fact' | 'observation' | 'goal' | 'week' | 'review', id: string) {
  const tx = gateway.bus.transaction();
  switch (kind) {
    case 'fact':
      return executionHistory(tx, 'fact', id);
    case 'observation':
      return profileHistory(tx, 'observation', id);
    case 'goal':
      return planningHistory(tx, 'goal', id);
    case 'week':
      return planningHistory(tx, 'week', id);
    case 'review':
      return reviewHistory(tx, 'document', id);
  }
}
