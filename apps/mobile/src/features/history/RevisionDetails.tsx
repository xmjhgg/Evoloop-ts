import type { Goal, WeekPlan } from '@evoloop/client-business-core/planning';
import type { Observation } from '@evoloop/client-business-core/profile';
import type { ReviewDocument } from '@evoloop/client-business-core/review';
import type { Fact } from '@evoloop/client-business-core/execution';
import { Copy, Card } from '../../ui/primitives.tsx';
import { FactHistory } from './FactHistory.tsx';

export function RevisionDetails({ value }: { value: Goal | WeekPlan | Observation | ReviewDocument | Fact }) {
  if ('data' in value) return <FactHistory fact={value} />;
  return (
    <Card>
      <Copy muted>只读历史 · 修订 {value.version}</Copy>
      {'name' in value && (
        <>
          <Copy>
            {value.name} · {value.startDate} 至 {value.endDate}
          </Copy>
          <Copy>
            {value.description} · {value.measure}
          </Copy>
        </>
      )}
      {'draft' in value &&
        value.draft.map((item) => (
          <Copy key={item.id}>
            {item.businessDate} · {item.prescription.title} · {item.prescription.minutes ?? '未知'} 分钟
          </Copy>
        ))}
      {'components' in value &&
        value.components.map((component) => <Copy key={component.id}>{component.text || '事实汇总'}</Copy>)}
      {'observedAt' in value &&
        Object.entries(value.values).map(([key, measurement]) => (
          <Copy key={key}>
            {key}：{measurement.value ?? '未知'} {measurement.unit}
          </Copy>
        ))}
    </Card>
  );
}
