import { NavLink } from "react-router";

import { Badge, Box, ListItemButton, Stack, Tooltip } from "@mui/material";

import { mdiShuffleVariant } from "@mdi/js";
import Icon from "@mdi/react";

import { useIsAdmin } from "../../hooks/useMembers";
import { usePendingCount } from "../../hooks/useProposals";

import useTexts from "../../languages";
import { sections } from "../../routes";

// Čtvercové tlačítko sekce – aktivní se vybarví plnou primární barvou.
const itemSx = {
  width: 48,
  height: 48,
  minWidth: 0,
  // ListItemButton se defaultně roztahuje (flexGrow: 1) – v úzké liště musí zůstat čtvercový
  flex: "0 0 auto",
  p: 0,
  borderRadius: 2,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "text.secondary",
  "&.active": { bgcolor: "primary.main", color: "primary.contrastText" },
  "&.active:hover": { bgcolor: "primary.dark" },
} as const;

// Trvalá navigace na desktopu. Menu tak má na všech stránkách stejné místo a nemusí se otevírat.
const NavRail = () => {
  const texts = useTexts();
  const isAdmin = useIsAdmin();
  const pending = usePendingCount();

  return (
    <Stack
      component="nav"
      alignItems="center"
      spacing={0.5}
      // gap místo marginů – jinak by Stack přebil vlastní odsazení loga
      useFlexGap
      aria-label={texts.menu}
      sx={{
        width: 72,
        flexShrink: 0,
        py: 1.5,
        overflowY: "auto",
        bgcolor: "background.paper",
        borderRight: "1px solid",
        borderColor: "divider",
      }}
    >
      <Tooltip title={`${texts.appName} · ${texts.appTagline}`} placement="right">
        <Box
          sx={{
            width: 40,
            height: 40,
            mb: 1,
            flexShrink: 0,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "primary.main",
            color: "primary.contrastText",
          }}
        >
          <Icon path={mdiShuffleVariant} size={1} />
        </Box>
      </Tooltip>

      {sections
        .filter(section => !section.adminOnly || isAdmin)
        .map(section => {
          // u schvalování se na ikonu přilepí počet čekajících návrhů, jinde se odznak neukazuje
          const badge = section.id === "admin" ? pending : 0;
          const name = texts[section.labelKey];
          const label = badge > 0 ? `${name} · ${badge} ${texts.pendingProposals}` : name;

          return (
            <Tooltip key={section.id} title={label} placement="right">
              <ListItemButton
                component={NavLink}
                to={section.path}
                aria-label={label}
                // aktivní sekce se pozná z adresy – NavLink na ni sám přidá třídu "active"
                sx={itemSx}
              >
                <Badge badgeContent={badge} color="warning">
                  <Icon path={section.icon} size={1} />
                </Badge>
              </ListItemButton>
            </Tooltip>
          );
        })}
    </Stack>
  );
};

export default NavRail;
