"use client";
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { useSession } from 'next-auth/react';
import { themes } from '@/styles/themes';

export default function ThemeProvider({ children, sessionData }) {
  const { data: session } = useSession({ data: sessionData });

  const selectedThemeName = session?.user?.selectedTheme || 'default';
  const activeTheme = themes[selectedThemeName] || themes.default;

  return (
    <StyledThemeProvider theme={activeTheme}>
      {children}
    </StyledThemeProvider>
  );
}