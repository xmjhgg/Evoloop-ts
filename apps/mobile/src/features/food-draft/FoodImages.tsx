import { useEffect, useState } from 'react';
import { Image } from 'react-native';
import type { FoodDraft } from '@evoloop/client-business-core/execution';
import { requireThat } from '@evoloop/kernel';
import { errorText } from '@evoloop/client-model';
import { useWorkspace } from '../../app/providers/WorkspaceProvider.tsx';
import { imageReference, parseImageReference } from '../../gateways/assets.ts';
import { registerImage, loadImage } from '../../gateways/sync-attachments.ts';
import { pickImage } from '../../platform/images/pick-image.ts';
import { Action, Copy, Row } from '../../ui/primitives.tsx';

export function FoodImages({ draft }: { draft: FoodDraft }) {
  const { gateway, actions, send } = useWorkspace();
  function add(camera: boolean) {
    void actions.run(async () => {
      requireThat(draft.evidence.length < 5, '每份草案最多 5 张照片');
      const image = await pickImage(camera);
      if (!image) return;
      await registerImage(gateway, image);
      await send()('execution.food-draft.save', {
        id: draft.id,
        expectedVersion: draft.version,
        businessDate: draft.businessDate,
        mealCode: draft.mealCode,
        description: draft.description,
        lines: draft.lines,
        evidence: [...draft.evidence, imageReference(image)],
      });
    });
  }
  return (
    <>
      <Row>
        {draft.evidence.map((reference) => (
          <ImagePreview key={reference} reference={reference} />
        ))}
      </Row>
      <Row>
        <Action title="拍摄餐食" quiet disabled={actions.busy} onPress={() => add(true)} />
        <Action title="选择照片" quiet disabled={actions.busy} onPress={() => add(false)} />
      </Row>
      <Copy muted>照片在本机加密保存。请求 AI 识别时会单独上传至已授权的云端服务。</Copy>
    </>
  );
}
function ImagePreview({ reference }: { reference: string }) {
  const { gateway } = useWorkspace(),
    [uri, setUri] = useState(''),
    [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    void (async () => {
      const asset = parseImageReference(reference),
        image = await loadImage(gateway, asset.id, asset.digest);
      if (live) setUri('data:image/jpeg;base64,' + image.dataBase64);
    })().catch((failure) => {
      if (live) setError(errorText(failure));
    });
    return () => {
      live = false;
    };
  }, [gateway, reference]);
  return uri ? (
    <Image accessibilityLabel="餐食照片" source={{ uri }} style={{ width: 104, height: 104, borderRadius: 12 }} />
  ) : (
    <Copy muted>{error || '读取照片…'}</Copy>
  );
}
