import { planCandidates } from '@evoloop/client-business-core/planning';
import type { Goal, WeekPlan } from '@evoloop/client-business-core/planning';
import { useWorkspace } from '../../app/providers/WorkspaceProvider.tsx';
import { Action, Copy } from '../../ui/primitives.tsx';
import { AiCandidatePanel } from './AiCandidatePanel.tsx';

export function GeneratePlan({ goal, start, week }: { goal: Goal; start: string; week: WeekPlan | undefined }) {
  const { gateway, actions, send } = useWorkspace();
  const candidates = planCandidates(gateway.bus.transaction(), goal.id, start);
  return (
    <>
      <Action
        title="请求 AI 生成周草案候选"
        quiet
        onPress={() => {
          void actions.run(() =>
            send()('planning.week.request-candidate', {
              goalId: goal.id,
              weekStart: start,
              expectedVersion: week?.version ?? '0',
            }),
          );
        }}
      />
      <Copy muted>生成结果需先接纳为草案，再审查和发布。健身规则未批准时仍不能发布。</Copy>
      {candidates
        .filter((candidate) => candidate.status === 'WAITING')
        .map((candidate) => (
          <AiCandidatePanel
            key={candidate.id}
            target={{
              kind: 'plan-draft',
              id: candidate.id,
              expectedVersion: candidate.version,
              componentId: null,
              input: candidate.input,
              inputDigest: candidate.inputDigest,
            }}
          />
        ))}
    </>
  );
}
