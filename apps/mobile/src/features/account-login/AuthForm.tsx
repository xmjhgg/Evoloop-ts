import { useState } from 'react';
import { errorText } from '@evoloop/client-model';
import { HttpClient, apiOrigin } from '../../platform/network/http.ts';
import type { Identity } from '../../platform/security/vault.ts';
import { signIn, register } from '../../gateways/identity.ts';
import { Action, Card, Copy, Field } from '../../ui/primitives.tsx';

export function AuthForm({
  registration,
  origin,
  ready,
  registered,
}: {
  registration: boolean;
  origin: string;
  ready(identity: Identity): Promise<void>;
  registered(): void;
}) {
  const [url, setUrl] = useState(origin),
    [username, setUsername] = useState(''),
    [password, setPassword] = useState(''),
    [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function submit() {
    setBusy(true);
    setError('');
    try {
      const http = new HttpClient(apiOrigin(url.trim(), __DEV__), () => null, fetch);
      if (registration) {
        await register(http, username.trim(), password, repeat);
        setPassword('');
        setRepeat('');
        registered();
      } else {
        const identity = await signIn(http, username.trim(), password);
        setPassword('');
        await ready(identity);
      }
    } catch (failure) {
      setError(errorText(failure));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card title={registration ? '创建账户' : '登录账户'}>
      <Field label="云端 HTTPS 根地址" value={url} onChange={setUrl} />
      <Field label="用户名" value={username} onChange={setUsername} />
      <Field label={registration ? '密码（至少 16 位）' : '密码'} value={password} onChange={setPassword} secret />
      {registration && (
        <>
          <Field label="再次输入密码" value={repeat} onChange={setRepeat} secret />
          <Copy muted>用户名使用 3–32 位小写字母、数字或下划线。创建账户后需登录；健康数据和 AI 用途另行授权。</Copy>
        </>
      )}
      {!!error && <Copy>{error}</Copy>}
      <Action
        title={busy ? '正在连接…' : registration ? '注册' : '登录并打开本地记录'}
        disabled={busy}
        onPress={() => {
          void submit();
        }}
      />
    </Card>
  );
}
