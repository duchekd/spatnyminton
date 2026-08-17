import { NavLink } from "react-router";

import {
  Box,
  Chip,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";

import Icon from "@mdi/react";

import { useIsAdmin } from "../../hooks/useMembers";
import useNavDrawer from "../../hooks/useNavDrawer";
import { usePendingCount } from "../../hooks/useProposals";

import useTexts from "../../languages";
import { sections } from "../../routes";

// Vysouvací navigace pro mobil – na desktopu ji nahrazuje trvalá lišta (NavRail).
const NavDrawer = () => {
  const texts = useTexts();

  const open = useNavDrawer(state => state.open);
  const closeNav = useNavDrawer(state => state.closeNav);
  const isAdmin = useIsAdmin();
  const pending = usePendingCount();

  return (
    <Drawer anchor="left" open={open} onClose={closeNav}>
      <Box sx={{ width: 280, height: "100%", display: "flex", flexDirection: "column" }}>
        {/* Hlavička s názvem aplikace */}
        <Stack
          spacing={0.25}
          sx={{
            px: 2.5,
            py: 2.5,
            color: "primary.contrastText",
            bgcolor: "primary.main",
          }}
        >
          <Typography variant="h6" fontWeight={800} noWrap>
            {texts.appName}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.85 }}>
            {texts.appTagline}
          </Typography>
        </Stack>

        <Divider />

        <List sx={{ flex: 1, py: 1 }}>
          {sections
            .filter(section => !section.adminOnly || isAdmin)
            .map(section => (
              <ListItemButton
                key={section.id}
                component={NavLink}
                to={section.path}
                onClick={closeNav}
                // aktivní sekce se pozná z adresy – NavLink na ni sám přidá třídu "active"
                sx={{ mx: 1, borderRadius: 2, mb: 0.5, "&.active": { bgcolor: "action.selected" } }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Icon path={section.icon} size={1} />
                </ListItemIcon>
                <ListItemText primary={texts[section.labelKey]} />
                {/* počet čekajících návrhů – jinde než u schvalování se odznak neukazuje */}
                {section.id === "admin" && pending > 0 && (
                  <Chip label={pending} size="small" color="warning" sx={{ ml: 1 }} />
                )}
              </ListItemButton>
            ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default NavDrawer;
