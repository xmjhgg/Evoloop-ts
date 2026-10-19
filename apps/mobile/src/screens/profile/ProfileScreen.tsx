import { useWorkspace } from '../../app/providers/WorkspaceProvider.tsx';
import { details } from '../../gateways/queries.ts';
import { conditionForm } from '../../features/conditions-editor/model.ts';
import { measurementForm } from '../../features/measurement-record/model.ts';
import { Action, Card, Copy, Page } from '../../ui/primitives.tsx';

export function ProfileScreen({ settings, history, lock }: { settings(): void; history(): void; lock(): void }) {
  const { gateway, actions, send } = useWorkspace(),
    day = gateway.today().businessDate,
    data = details(gateway, day);
  return (
    <Page title="我的" subtitle={gateway.identity.username}>
      <Card title="我的条件">
        <Action title="作息与时间" quiet onPress={() => actions.edit(conditionForm(send(), 'COMMON', data.common))} />
        <Action title="训练条件" quiet onPress={() => actions.edit(conditionForm(send(), 'FITNESS', data.fitness))} />
        <Action title="学习条件" quiet onPress={() => actions.edit(conditionForm(send(), 'LEARNING', data.learning))} />
      </Card>
      <Card title="今日身体测量">
        {data.observations.map((value) => (
          <Card key={value.id}>
            {Object.entries(value.values).map(([key, measurement]) => (
              <Copy key={key}>
                {{ weight: '体重', waist: '腰围' }[key as 'weight' | 'waist'] ?? key}：{measurement.value ?? '未知'}{' '}
                {measurement.unit}
              </Copy>
            ))}
            <Action title="修正测量" quiet onPress={() => actions.edit(measurementForm(send(), day, value))} />
          </Card>
        ))}
        <Action title="新增测量" onPress={() => actions.edit(measurementForm(send(), day))} />
      </Card>
      <Action title="记录与修订历史" quiet onPress={history} />
      <Action title="系统设置" quiet onPress={settings} />
      <Action title="锁定 / 切换账户" quiet onPress={lock} />
      <Copy muted>切换账户保留本机原账户数据、未同步操作和历史。</Copy>
    </Page>
  );
}
