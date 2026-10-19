import type { Transaction } from '../../application/ports/public.ts';
import type { Goal } from './model.ts';
import type { PlanningCollaborators } from '../ports/collaboration.ts';
import { conditionSnapshot } from '../../profile/public.ts';

/** Approval requires a reviewed code-and-policy release. No local switch/model may populate this registry. */
const approvedPolicyVersions: readonly string[] = [];
export function fitnessRestrictions(tx: Transaction, goal: Goal, rulesVersion: string, ports: PlanningCollaborators): 'ALLOWED' | 'BLOCKED' | 'INFORMATION_REQUIRED' {
  if (conditionSnapshot(tx, 'FITNESS')?.values['discomfort'] === 'PRESENT') return 'BLOCKED';
  if (!approvedPolicyVersions.includes(rulesVersion)) return 'INFORMATION_REQUIRED';
  return ports.fitnessPolicy(tx, goal, rulesVersion);
}
