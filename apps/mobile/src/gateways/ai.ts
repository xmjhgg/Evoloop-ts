import { aiRequestSchema, aiSubmissionSchema, aiTaskSchema } from '@evoloop/contracts';
import { canonical, digest, requireThat } from '@evoloop/kernel';
import type { SendCommand } from './command-session.ts';
import type { ClientSession, AiTarget, AiBookmark } from './ports.ts';
import { parseImageReference } from './assets.ts';
import { loadImage } from './sync-attachments.ts';

export type { AiTarget, AiBookmark, TaskStore } from './ports.ts';
export function targetKey(target: AiTarget): string {
  return digest(target);
}
export async function requestCandidate(gateway: ClientSession, target: AiTarget, uuid: () => string) {
  requireThat(gateway.identity.aiAllowed, 'AI_PURPOSE_REQUIRED');
  const key = targetKey(target),
    saved = await gateway.bus.serial(() => gateway.tasks.get(key));
  let bookmark: AiBookmark = saved ?? {
    key,
    target,
    taskId: null,
    request: aiRequestSchema.parse({
      clientRequestId: uuid(),
      capability: target.kind.startsWith('plan-') ? 'PLAN_REVIEW' : target.kind === 'food' ? 'FOOD_ANALYSIS' : 'REVIEW',
      input: target.input,
      inputDigest: target.inputDigest,
      sourceMetadata: canonical({
        kind: target.kind,
        id: target.id,
        componentId: target.componentId,
        outputShape:
          target.kind === 'food'
            ? 'data.lines: FoodLine[] with id, name, personalFactor, portionUnit and energy/protein/carbohydrate/fat each containing state KNOWN|ESTIMATED|UNKNOWN, value, lower, upper, unit kcal|g, source; decimal strings and nulls only'
            : target.kind === 'plan-draft'
              ? 'data.changes: array of {id:null|string,businessDate,kind,disposition,prescription:{title,startAt,minutes,actions,learning,nutrition}} following the frozen draft shape; future changes only'
              : 'text: candidate review only; data:null',
      }),
      outputSchemaVersion: 'candidate-v1',
      assetIds: (target.assetRefs ?? []).map((value) => parseImageReference(value).id),
    }),
  };
  if (!saved) await gateway.bus.serial(() => gateway.tasks.put(bookmark));
  if (!bookmark.taskId) {
    for (const reference of target.assetRefs ?? []) {
      const asset = parseImageReference(reference),
        image = await loadImage(gateway, asset.id, asset.digest);
      await gateway.http.raw('POST', '/api/v2/ai/assets', image);
    }
    const submitted = await gateway.http.call('POST', '/api/v2/ai/tasks', aiSubmissionSchema, bookmark.request);
    requireThat(submitted.inputDigest === target.inputDigest, 'AI_SOURCE_MISMATCH');
    bookmark = { ...bookmark, taskId: submitted.taskId };
    await gateway.bus.serial(() => gateway.tasks.put(bookmark));
  }
  return bookmark;
}
export async function readCandidate(gateway: ClientSession, bookmark: AiBookmark) {
  requireThat(bookmark.taskId, 'AI_TASK_NOT_SUBMITTED');
  const task = await gateway.http.call('GET', '/api/v2/ai/tasks/' + bookmark.taskId, aiTaskSchema);
  requireThat(
    task.inputDigest === bookmark.target.inputDigest && task.sourceMetadata === bookmark.request.sourceMetadata,
    'AI_SOURCE_MISMATCH',
  );
  return task;
}
export async function acceptCandidate(send: SendCommand, target: AiTarget, output: unknown) {
  requireThat(
    typeof output === 'object' && output !== null && 'text' in output && typeof output.text === 'string',
    'AI_CANDIDATE_INVALID',
  );
  if (target.kind === 'plan-review')
    return send('planning.week.accept-ai-candidate', {
      weekId: target.id,
      expectedVersion: target.expectedVersion,
      inputDigest: target.inputDigest,
      text: output.text,
    });
  if (target.kind === 'review')
    return send('review.candidate.accept', {
      documentId: target.id,
      expectedVersion: target.expectedVersion,
      componentId: target.componentId,
      inputDigest: target.inputDigest,
      text: output.text,
    });
  if (target.kind === 'plan-draft') {
    requireThat(
      'data' in output && typeof output.data === 'object' && output.data !== null && 'changes' in output.data,
      'AI_PLAN_CHANGES_REQUIRED',
    );
    return send('planning.week.accept-generated-draft', {
      candidateId: target.id,
      expectedVersion: target.expectedVersion,
      inputDigest: target.inputDigest,
      changes: output.data.changes,
    });
  }
  requireThat(
    'data' in output && typeof output.data === 'object' && output.data !== null && 'lines' in output.data,
    'AI_FOOD_LINES_REQUIRED',
  );
  return send('execution.food-draft.accept-candidate', {
    draftId: target.id,
    expectedVersion: target.expectedVersion,
    inputDigest: target.inputDigest,
    lines: output.data.lines,
  });
}
