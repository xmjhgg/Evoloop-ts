import { useState } from 'react';
import { date } from '@evoloop/kernel';
import { label } from '@evoloop/client-model';
import { useWorkspace } from '../../app/providers/WorkspaceProvider.tsx';
import { history, historyIndex } from '../../gateways/queries.ts';
import { FactHistory } from '../../features/history/FactHistory.tsx';
import { FactActions } from '../../features/history/FactActions.tsx';
import { RevisionDetails } from '../../features/history/RevisionDetails.tsx';
import { Action, Card, Copy, Field, Page } from '../../ui/primitives.tsx';

export function HistoryScreen({ back }: { back(): void }) {
  const { gateway, actions } = useWorkspace(),
    [input, setInput] = useState(gateway.today().businessDate),
    [day, setDay] = useState(input);
  const data = historyIndex(gateway, day);
  const indexes = [
    ...data.goals.map((value) => ({ kind: 'goal' as const, id: value.id, title: value.name })),
    ...data.weeks.map((value) => ({ kind: 'week' as const, id: value.id, title: value.weekStart + ' 周安排' })),
    ...data.reviews.map((value) => ({ kind: 'review' as const, id: value.id, title: '复盘历史' })),
    ...data.observations.map((value) => ({ kind: 'observation' as const, id: value.id, title: '测量历史' })),
  ];
  return (
    <Page title="记录与修订历史">
      <Action title="返回我的" quiet onPress={back} />
      <Field label="日期 YYYY-MM-DD" value={input} onChange={setInput} />
      <Action
        title="查看该日"
        quiet
        onPress={() => {
          void actions.run(async () => {
            date(input);
            setDay(input);
          });
        }}
      />
      {!data.facts.length && <Copy muted>这一天尚无记录。</Copy>}
      {data.facts.map((fact) => (
        <Card key={fact.id} title={label(fact.data.kind)}>
          <FactHistory fact={fact} />
          {history(gateway, 'fact', fact.id)
            .filter((old) => old.revisionId !== fact.revisionId)
            .map((old) => (
              <RevisionDetails key={old.revisionId} value={old} />
            ))}
          <FactActions fact={fact} day={day} />
        </Card>
      ))}
      {indexes.map((index) => (
        <Card key={index.id} title={index.title}>
          {history(gateway, index.kind, index.id).map((old) => (
            <RevisionDetails key={old.revisionId} value={old} />
          ))}
        </Card>
      ))}
    </Page>
  );
}
