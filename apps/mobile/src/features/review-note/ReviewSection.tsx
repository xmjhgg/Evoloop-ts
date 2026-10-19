import { confirmedComponents } from '@evoloop/client-business-core/review';
import type { ReviewScope } from '@evoloop/client-business-core/review';
import { label } from '@evoloop/client-model';
import { useWorkspace } from '../../app/providers/WorkspaceProvider.tsx';
import { Action, Card, Copy } from '../../ui/primitives.tsx';
import { confirmReview } from '../review-confirmation/actions.ts';
import { reviewForm } from './model.ts';
import { AiCandidatePanel } from '../ai-candidate/AiCandidatePanel.tsx';
import { AdjustmentSection } from '../review-adjustment/AdjustmentSection.tsx';

export function ReviewSection({ scope }: { scope: ReviewScope }) {
  const { gateway, actions, send } = useWorkspace();
  const id = scope.period === 'DAILY' ? 'daily|' + scope.date : 'weekly|' + scope.goalId + '|' + scope.date;
  const document = gateway.reviews().find((value) => value.id === id),
    component = document?.components.find((value) => value.slot === scope.slot);
  const confirmed = document ? confirmedComponents(gateway.bus.transaction(), document) : [];
  return (
    <Card
      title={
        scope.period === 'DAILY'
          ? scope.date === gateway.today().businessDate
            ? '今天的复盘结论'
            : scope.date + ' 的复盘结论'
          : '本周复盘结论'
      }
    >
      <Copy>{component?.text || '尚未补充判断'}</Copy>
      {component && (
        <Copy muted>
          {component.stale
            ? '来源已变化，需更新'
            : confirmed.includes(component.id)
              ? '已确认'
              : label(component.state)}{' '}
          · 截止 {component.cutoff.slice(0, 16).replace('T', ' ')} UTC
        </Copy>
      )}
      <Copy muted>汇总依据已登记事实，未记录不表示未执行。确认结论与调整未来计划分别进行。</Copy>
      <Action
        title="更新事实汇总"
        quiet
        onPress={() => {
          void actions.run(() =>
            send()('review.refresh', {
              scope,
              expectedVersion: document?.version ?? '0',
              manualText: null,
              manualFinal: false,
            }),
          );
        }}
      />
      <Action title="补充人工判断" onPress={() => actions.edit(reviewForm(send(), scope, document))} />
      {component?.state === 'SUMMARY_ONLY' && (
        <AiCandidatePanel
          target={{
            kind: 'review',
            id: document!.id,
            expectedVersion: document!.version,
            componentId: component.id,
            input: component.input,
            inputDigest: component.inputDigest,
          }}
        />
      )}
      {component && (
        <Action
          title="确认本段复盘"
          quiet
          disabled={component.stale || component.state === 'SUMMARY_ONLY'}
          onPress={() => {
            void actions.run(() => confirmReview(send(), document!, component.id));
          }}
        />
      )}
      {component && confirmed.includes(component.id) && (
        <AdjustmentSection document={document!} componentId={component.id} />
      )}
    </Card>
  );
}
