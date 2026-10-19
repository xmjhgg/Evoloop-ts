import { useEffect, useState } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppState, StatusBar, View } from 'react-native';
import { ThemeProvider, useTheme } from './providers/ThemeProvider.tsx';
import { WorkspaceProvider } from './providers/WorkspaceProvider.tsx';
import { useAccount } from './providers/useAccount.ts';
import { WorkspaceNavigation } from './navigation/WorkspaceNavigation.tsx';
import { LoginScreen } from '../screens/login/LoginScreen.tsx';
import { RegisterScreen } from '../screens/register/RegisterScreen.tsx';

function AccountRoot() {
  const account = useAccount(),
    { colors } = useTheme(),
    [registration, setRegistration] = useState(false);
  const [privateScreen, setPrivateScreen] = useState(AppState.currentState !== 'active');
  useEffect(() => {
    const listener = AppState.addEventListener('change', (state) => setPrivateScreen(state !== 'active'));
    return () => listener.remove();
  }, []);
  if (account.opened)
    return (
      <View style={{ flex: 1 }}>
        <WorkspaceProvider gateway={account.opened.gateway}>
          <WorkspaceNavigation lock={account.lock} />
        </WorkspaceProvider>
        {privateScreen && (
          <View
            accessibilityElementsHidden
            style={{ position: 'absolute', inset: 0, backgroundColor: colors.background }}
          />
        )}
      </View>
    );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={colors.background === '#101B17' ? 'light-content' : 'dark-content'} />
      {registration ? (
        <RegisterScreen origin={account.identity?.origin ?? ''} back={() => setRegistration(false)} />
      ) : (
        <LoginScreen
          identity={account.identity}
          ready={account.unlock}
          unlock={() => {
            void account.unlock();
          }}
          register={() => setRegistration(true)}
          busy={account.busy}
          error={account.error}
        />
      )}
    </SafeAreaView>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AccountRoot />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
