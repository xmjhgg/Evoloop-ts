import type { Identity } from '../../platform/security/vault.ts';
import { AuthForm } from '../../features/account-login/AuthForm.tsx';
import { Action, Card, Copy, Page } from '../../ui/primitives.tsx';

export function LoginScreen({
  identity,
  ready,
  unlock,
  register,
  busy,
  error,
}: {
  identity: Identity | null;
  ready(identity: Identity): Promise<void>;
  unlock(): void;
  register(): void;
  busy: boolean;
  error: string;
}) {
  return (
    <Page title="EvoLoop" subtitle="把目标落在每一天">
      {identity && (
        <Card title={identity.username}>
          <Copy muted>本地记录已保留，可离线解锁。重新登录可续期云端会话。</Copy>
          <Action title="解锁本地记录" disabled={busy} onPress={unlock} />
        </Card>
      )}
      {!!error && <Copy>{error}</Copy>}
      <AuthForm registration={false} origin={identity?.origin ?? ''} ready={ready} registered={() => undefined} />
      <Action title="创建新账户" quiet onPress={register} />
    </Page>
  );
}
