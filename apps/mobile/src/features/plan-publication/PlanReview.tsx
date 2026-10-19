import type { WeekPlan } from '@evoloop/client-business-core/planning';
import { label } from '@evoloop/client-model';
import { useWorkspace } from '../../app/providers/WorkspaceProvider.tsx';
import { AiCandidatePanel } from '../ai-candidate/AiCandidatePanel.tsx';
import { publishDay } from './actions.ts';
import { Action, Copy } from '../../ui/primitives.tsx';

export function PlanReview({ week, day, today }: { week: WeekPlan; day: string; today: string }) {
  const { actions, send } = useWorkspace();
  return (
    <>
      <Copy>审查：{week.review ? label(week.review.status) : '未审查'}</Copy>
      {week.review?.issues.map((issue) => (
        <Copy key={issue}>{label(issue)}</Copy>
      ))}
      <Action
        title="规则审查"
        quiet
        onPress={() => {
          void actions.run(() =>
            send()('planning.week.review', { weekId: week.id, expectedVersion: week.version, channel: 'RULES' }),
          );
        }}
      />
      <Action
        title="准备 AI 审查"
        quiet
        onPress={() => {
          void actions.run(() =>
            send()('planning.week.review', { weekId: week.id, expectedVersion: week.version, channel: 'AI' }),
          );
        }}
      />
      {week.review?.channel === 'AI' && (
        <AiCandidatePanel
          target={{
            kind: 'plan-review',
            id: week.id,
            expectedVersion: week.version,
            componentId: null,
            input: week.review.input,
            inputDigest: week.review.inputDigest,
          }}
        />
      )}
      <Action
        title="确认这一天生效"
        disabled={day <= today || week.review?.status !== 'READY'}
        onPress={() => {
          void actions.run(() => publishDay(send(), week, day));
        }}
      />
    </>
  );
}
