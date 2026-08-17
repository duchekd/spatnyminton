import { useLocation } from "react-router";

import { Box, IconButton, Typography, useMediaQuery, useTheme } from "@mui/material";

import { mdiMenu } from "@mdi/js";
import Icon from "@mdi/react";

import useNavDrawer from "../../hooks/useNavDrawer";

import useTexts from "../../languages";
import { sectionByPath } from "../../routes";

import AuthButton from "./AuthButton";
import LanguageToggle from "./LanguageToggle";
import ThemeToggle from "./ThemeToggle";

// Jednotná hlavička obsahu – na všech stránkách stejná: název sekce vlevo, globální přepínače vpravo.
// Název se bere z adresy, takže ho stránky nemusí předávat.
const PageHeader = () => {
  const texts = useTexts();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const openNav = useNavDrawer(state => state.openNav);
  const { pathname } = useLocation();

  const section = sectionByPath(pathname);
  const title = section ? texts[section.labelKey] : texts.appName;

  return (
    <Box
      component="header"
      sx={{
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: { xs: 1, md: 3 },
        py: 1,
        minHeight: { xs: 56, md: 64 },
        boxSizing: "border-box",
        bgcolor: "background.paper",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      {/* na desktopu je navigace trvale vlevo, na mobilu se otevírá z hamburgeru */}
      {isMobile && (
        <IconButton edge="start" onClick={openNav} aria-label={texts.menu}>
          <Icon path={mdiMenu} size={1} />
        </IconButton>
      )}

      <Typography variant={isMobile ? "h6" : "h5"} fontWeight={800} noWrap sx={{ flex: 1, minWidth: 0 }}>
        {title}
      </Typography>

      <LanguageToggle />
      <ThemeToggle />
      <AuthButton />
    </Box>
  );
};

export default PageHeader;
