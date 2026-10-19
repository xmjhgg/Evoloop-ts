import type { Fact } from '@evoloop/client-business-core/execution';
import { label } from '@evoloop/client-model';
import { Copy, Card } from '../../ui/primitives.tsx';
import { ActualSummary } from '../../ui/RecordSummary.tsx';

export function FactHistory({ fact }: { fact: Fact }) {
  return (
    <Card>
      <Copy>
        {label(fact.data.kind)} · {fact.businessDate} · 修订 {fact.version}
      </Copy>
      <Copy muted>
        {fact.status === 'REMOVED' ? '已移除，历史仍保留' : '有效记录'}
        {fact.baselineDateMismatch ? ' · 移日后与原基准日期不一致' : ''}
      </Copy>
      <ActualSummary value={fact} />
      <Copy muted>
        原计划基准：
        {fact.baselineRefs.length
          ? fact.baselineRefs.map((ref) => ref.item.prescription.title).join('、')
          : '当时无生效安排'}
      </Copy>
    </Card>
  );
}
