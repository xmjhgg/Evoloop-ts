import type { Fact } from '@evoloop/client-business-core/execution';
import type { Prescription } from '@evoloop/client-business-core/planning';
import { prescriptionLines, factLines } from '@evoloop/client-model';
import { Copy } from './primitives.tsx';

export function PrescriptionSummary({ value }: { value: Prescription }) {
  return (
    <>
      {prescriptionLines(value).map((line, index) => (
        <Copy key={index}>{line}</Copy>
      ))}
    </>
  );
}
export function ActualSummary({ value }: { value: Fact }) {
  return (
    <>
      {factLines(value).map((line, index) => (
        <Copy key={index}>{line}</Copy>
      ))}
    </>
  );
}
