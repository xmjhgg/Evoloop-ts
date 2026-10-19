import { formatAmount } from '@evoloop/client-model';
import { useWorkspace } from '../../app/providers/WorkspaceProvider.tsx';
import { details } from '../../gateways/queries.ts';
import { Action, Card, Copy } from '../../ui/primitives.tsx';
import { foodForm } from './model.ts';
import { confirmIntake } from '../intake-confirmation/confirm.ts';
import { foodInputDigest } from '@evoloop/client-business-core/execution';
import { canonical } from '@evoloop/kernel';
import { AiCandidatePanel } from '../ai-candidate/AiCandidatePanel.tsx';
import { FoodImages } from './FoodImages.tsx';

export function NutritionSection({ day }: { day: string }) {
  const { gateway, actions, send, uuid } = useWorkspace(),
    today = gateway.today(day),
    drafts = details(gateway, day).foodDrafts;
  return (
    <Card title="饮食与营养">
      <Copy>已登记摄入热量：{formatAmount(today.intake.energy.total, ' kcal')}</Copy>
      <Copy>
        蛋白质 {formatAmount(today.intake.protein.total, ' g')} · 碳水{' '}
        {formatAmount(today.intake.carbohydrate.total, ' g')} · 脂肪 {formatAmount(today.intake.fat.total, ' g')}
      </Copy>
      <Copy muted>有未知营养时总量保持未知，已知小计 {today.intake.energy.knownSubtotal} kcal。</Copy>
      {drafts.map((draft) => (
        <Card key={draft.id} title={draft.description || '饮食草案'}>
          {draft.lines.map((line) => (
            <Copy key={line.id}>
              {line.name} · {line.personalFactor ?? '待填'} 份 · {formatAmount(line.energy.value, ' kcal/份')}
            </Copy>
          ))}
          <Copy muted>{draft.confirmedRevisionId === draft.revisionId ? '已确认摄入' : '草案尚未计入摄入'}</Copy>
          <Action title="编辑草案" quiet onPress={() => actions.edit(foodForm(send(), day, uuid(), draft))} />
          <FoodImages draft={draft} />
          <AiCandidatePanel
            target={{
              kind: 'food',
              id: draft.id,
              expectedVersion: draft.version,
              componentId: null,
              input: canonical({
                businessDate: draft.businessDate,
                mealCode: draft.mealCode,
                evidence: draft.evidence,
                description: draft.description,
                lines: draft.lines,
              }),
              inputDigest: foodInputDigest(draft),
              assetRefs: draft.evidence,
            }}
          />
          <Action
            title="核对并确认摄入"
            quiet
            onPress={() => {
              void actions.run(() =>
                confirmIntake(send(), draft, today.actual.find((fact) => fact.id === draft.factId)?.version ?? '0'),
              );
            }}
          />
        </Card>
      ))}
      <Action title="新增饮食草案" onPress={() => actions.edit(foodForm(send(), day, uuid()))} />
    </Card>
  );
}
