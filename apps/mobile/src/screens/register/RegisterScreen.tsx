import { useState } from 'react';
import { AuthForm } from '../../features/account-login/AuthForm.tsx';
import { Action, Copy, Page } from '../../ui/primitives.tsx';

export function RegisterScreen({ origin, back }: { origin: string; back(): void }) {
  const [success, setSuccess] = useState(false);
  return (
    <Page title="注册">
      {success ? (
        <Copy>账户创建成功，请返回登录。</Copy>
      ) : (
        <AuthForm registration origin={origin} ready={async () => undefined} registered={() => setSuccess(true)} />
      )}
      <Action title="返回登录" quiet onPress={back} />
    </Page>
  );
}
