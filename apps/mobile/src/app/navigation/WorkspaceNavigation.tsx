import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../providers/ThemeProvider.tsx';
import { useWorkspace } from '../providers/WorkspaceProvider.tsx';
import { foregroundSync } from '../../platform/background/foreground.ts';
import { TodayScreen } from '../../screens/today/TodayScreen.tsx';
import { PlanScreen } from '../../screens/plan/PlanScreen.tsx';
import { ReviewScreen } from '../../screens/review/ReviewScreen.tsx';
import { ProfileScreen } from '../../screens/profile/ProfileScreen.tsx';
import { SettingsScreen } from '../../screens/settings/SettingsScreen.tsx';
import { HistoryScreen } from '../../screens/history/HistoryScreen.tsx';
import { Action, Copy } from '../../ui/primitives.tsx';

const tabs = [
  ['today', '今日'],
  ['plan', '计划安排'],
  ['review', '复盘'],
  ['profile', '我的'],
] as const;
export function WorkspaceNavigation({ lock }: { lock(): void }) {
  const [route, navigate] = useState<string>('today'),
    { gateway, actions } = useWorkspace(),
    { colors } = useTheme();
  useEffect(() => foregroundSync(gateway), [gateway]);
  useEffect(() => {
    const timer = setInterval(() => gateway.changed(), 60000);
    return () => clearInterval(timer);
  }, [gateway]);
  const profile = () => navigate('profile');
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {!!actions.error && !actions.form && (
        <View accessibilityRole="alert" style={{ padding: 12 }}>
          <Copy>{actions.error}</Copy>
        </View>
      )}
      <View style={{ flex: 1 }}>
        {route === 'today' && <TodayScreen />}
        {route === 'plan' && <PlanScreen />}
        {route === 'review' && <ReviewScreen />}
        {route === 'profile' && (
          <ProfileScreen settings={() => navigate('settings')} history={() => navigate('history')} lock={lock} />
        )}
        {route === 'settings' && <SettingsScreen back={profile} />}
        {route === 'history' && <HistoryScreen back={profile} />}
      </View>
      <View style={{ flexDirection: 'row', padding: 10, borderTopColor: colors.line, borderTopWidth: 1, gap: 6 }}>
        {tabs.map(([key, title]) => (
          <View style={{ flex: 1 }} key={key}>
            <Action title={title} quiet={route !== key} onPress={() => navigate(key)} />
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}
