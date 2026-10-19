import type { FoodDraft } from '@evoloop/client-business-core/execution';
import type { SendCommand } from '../../gateways/command-session.ts';
import { confirm } from '../../ui/confirm.ts';

export async function confirmIntake(send: SendCommand, draft: FoodDraft, factVersion: string) {
  const unknown = draft.lines.some((line) =>
    [line.energy, line.protein, line.carbohydrate, line.fat].some((value) => value.state === 'UNKNOWN'),
  );
  if (
    !(await confirm(
      '确认实际摄入',
      draft.lines.map((line) => `${line.name} · ${line.personalFactor ?? '份数未填'} 份`).join('\n') +
        (unknown ? '\n部分营养未知，确认后继续保留未知值。' : '') +
        '\n确认表示已实际食用并核对上述份数。',
      '已食用并核对',
    ))
  )
    return;
  await send('execution.intake.confirm', {
    draftId: draft.id,
    expectedVersion: draft.version,
    expectedFactVersion: factVersion,
    explicitConfirm: true,
    unknownAccepted: unknown,
    planItemIds: [],
  });
}
