import { useEffect, useMemo } from "react";

import { HashRouter, Navigate, Route, Routes } from "react-router";

import { CssBaseline, ThemeProvider } from "@mui/material";

import useBadmintonSync from "./hooks/useBadmintonSync";
import { useMembersSync } from "./hooks/useMembers";
import { useProposalsSync } from "./hooks/useProposals";
import useThemeMode from "./hooks/useThemeMode";

import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";

import AppLayout from "./components/layout/AppLayout";
import AdminPage from "./components/pages/Admin";
import BadmintonPage from "./components/pages/Badminton";
import BadmintonStatsPage from "./components/pages/BadmintonStats";
import VersusPage from "./components/pages/Versus";
import { homePath, paths } from "./routes";
import createAppTheme from "./theme";

const cache = createCache({ key: "css", prepend: true });

const App = () => {
  const mode = useThemeMode(state => state.mode);
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  // V nainstalované appce lemuje stránku systémová lišta – ať má barvu zvoleného motivu,
  // jinak by nad tmavým pozadím svítil světlý pruh z manifestu (a naopak).
  useEffect(() => {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme.palette.background.default);
  }, [theme]);

  // seznam party (kdo je admin) – musí být načtený dřív, než se rozhodne, kam se zapisuje
  useMembersSync();
  // realtime synchronizace badmintonu s cloudem (no-op bez přihlášení / konfigurace)
  useBadmintonSync();
  // návrhy ke schválení – kvůli odznaku v navigaci je potřeba znát je i mimo admin stránku
  useProposalsSync();

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />

        {/* HashRouter – appka běží na GitHub Pages bez přepisu adres na server, takže adresy jdou přes #/ */}
        <HashRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path={paths.versus} element={<VersusPage />} />
              <Route path={paths.badminton} element={<BadmintonPage />} />
              <Route path={paths.badmintonStats} element={<BadmintonStatsPage />} />
              {/* schvalování návrhů – stránka si sama ohlídá, že ji otevřel admin */}
              <Route path={paths.admin} element={<AdminPage />} />

              {/* domovská stránka i neznámé adresy vedou na statistiku */}
              <Route path="*" element={<Navigate to={homePath} replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </ThemeProvider>
    </CacheProvider>
  );
};

export default App;
