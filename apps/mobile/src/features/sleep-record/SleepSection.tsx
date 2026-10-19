import type { Fact } from '@evoloop/client-business-core/execution';
import { useWorkspace } from '../../app/providers/WorkspaceProvider.tsx';
import { Action, Card, Copy } from '../../ui/primitives.tsx';
import { sleepForm } from './model.ts';

export function SleepSection({ day, facts }: { day: string; facts: readonly Fact[] }) {
  const { actions, send } = useWorkspace();
  return (
    <Card title="睡眠">
      {facts.length ? (
        facts.map((fact) => (
          <Card key={fact.id}>
            <Copy>
              {fact.data.kind === 'SLEEP'
                ? fact.data.endAt
                  ? `${Math.round((Date.parse(fact.data.endAt) - Date.parse(fact.data.beginAt)) / 60000)} 分钟`
                  : '睡眠进行中'
                : ''}
            </Copy>
            <Action title="完成 / 修正睡眠" quiet onPress={() => actions.edit(sleepForm(send(), day, fact))} />
          </Card>
        ))
      ) : (
        <Copy muted>尚未登记睡眠</Copy>
      )}
      <Action title="登记睡眠" onPress={() => actions.edit(sleepForm(send(), day))} />
    </Card>
  );
}
