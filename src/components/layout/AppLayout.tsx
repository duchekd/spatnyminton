import { Outlet } from "react-router";

import { Box, useMediaQuery, useTheme } from "@mui/material";

import NavDrawer from "./NavDrawer";
import NavRail from "./NavRail";

// Rámec všech stránek – navigace je společná, obsah dodá aktivní routa.
// Stránky se do rámce vkládají jako sloupec (hlavička + obsah), výšku okna drží tenhle Box.
const AppLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box sx={{ display: "flex", height: "100dvh", overflow: "hidden", boxSizing: "border-box" }}>
      {/* na desktopu je navigace trvale vlevo, na mobilu se vysouvá jako drawer */}
      {isMobile ? <NavDrawer /> : <NavRail />}

      {/* overflow drží obsah uvnitř stránky – bez toho by se dalo fokusem odscrollovat lištu i hlavičku pryč */}
      <Box
        component="main"
        sx={{ flex: 1, minWidth: 0, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AppLayout;
