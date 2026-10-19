import { BusinessError } from '@evoloop/kernel';
import type { CommandHandler } from '../application/ports/public.ts';
import type { PlanningCollaborators } from '../planning/public.ts';
import { profileHandlers } from './schemas/profile.ts';
import { planningHandlers } from './schemas/planning.ts';
import { executionHandlers } from './schemas/execution.ts';
import { reviewHandlers } from './schemas/review.ts';
export { commandSchema } from './schemas/common.ts';
export { validateDocument } from './schemas/replica.ts';

export function commandRegistry(ports: PlanningCollaborators): Readonly<Record<string, CommandHandler>> {
  return Object.freeze({ ...profileHandlers, ...planningHandlers(ports), ...executionHandlers, ...reviewHandlers(ports) });
}
export function unsupportedCommand(): never { throw new BusinessError('LOCAL_COMMAND_VERSION_UNSUPPORTED'); }
