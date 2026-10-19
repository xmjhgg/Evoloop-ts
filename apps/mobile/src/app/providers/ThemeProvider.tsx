import { createContext, useContext, useEffect, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import { palettes } from '@evoloop/design-tokens';
import type { Palette, ThemePreference } from '@evoloop/design-tokens';
import { preference } from '../../platform/security/vault.ts';

const ThemeContext = createContext<{
  colors: Palette;
  mode: ThemePreference;
  setMode(mode: ThemePreference): Promise<void>;
} | null>(null);
export function ThemeProvider({ children }: PropsWithChildren) {
  const system = useColorScheme(),
    [mode, update] = useState<ThemePreference>('system');
  useEffect(() => {
    void preference('theme')
      .then((saved) => {
        if (saved === 'light' || saved === 'dark') update(saved);
      })
      .catch(() => undefined);
  }, []);
  async function setMode(next: ThemePreference) {
    await preference('theme', next);
    update(next);
  }
  return (
    <ThemeContext.Provider
      value={{ colors: palettes[mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode], mode, setMode }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw Error('THEME_PROVIDER_REQUIRED');
  return theme;
}
