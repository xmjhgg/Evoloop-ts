import { z } from 'zod';
import { Copy } from '../../ui/primitives.tsx';

export function CandidateDetails({ output }: { output: unknown }) {
  const result = z
    .object({
      data: z
        .object({
          lines: z
            .array(
              z.object({
                name: z.string(),
                personalFactor: z.string().nullable(),
                portionUnit: z.string(),
                energy: z.object({ state: z.string(), value: z.string().nullable() }),
              }),
            )
            .optional(),
          changes: z
            .array(
              z.object({
                businessDate: z.string(),
                prescription: z.object({ title: z.string(), minutes: z.string().nullable() }),
              }),
            )
            .optional(),
        })
        .nullable(),
    })
    .safeParse(output);
  if (!result.success || !result.data.data) return null;
  return (
    <>
      {result.data.data.lines?.map((line, index) => (
        <Copy key={index}>
          {line.name} · {line.personalFactor ?? '未核对'} 份 · 每{line.portionUnit} {line.energy.value ?? '未知'} kcal（
          {line.energy.state}）
        </Copy>
      ))}
      {result.data.data.changes?.map((item, index) => (
        <Copy key={index}>
          {item.businessDate} · {item.prescription.title} · {item.prescription.minutes ?? '未指定'} 分钟
        </Copy>
      ))}
    </>
  );
}
