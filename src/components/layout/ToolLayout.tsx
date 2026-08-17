import { KeyboardEvent, ReactNode, useState } from "react";

import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import { mdiClose, mdiPlaylistEdit, mdiPlus, mdiTrashCanOutline } from "@mdi/js";
import Icon from "@mdi/react";

import useSets from "../../hooks/useSetStore";

import useTexts from "../../languages";

import PageHeader from "./PageHeader";
import SetManager from "./SetManager";

// Plocha pro vizuál nástroje. Je to dotazovatelný kontejner (containerType), takže se do něj vizuál
// může přizpůsobit oběma osám; co se přesto nevejde, jde doscrollovat – rám aplikace už nescrolluje.
const stageSx = {
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  overflow: "auto",
  containerType: "size",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
} as const;

type Props = {
  /** Hra, jejíž sady se používají (každá hra má vlastní oddělené sady). */
  scope: string;
  /** Jak se zadává název sady – textem, nebo datem (badminton). */
  setNameMode?: "text" | "date";
  /** Probíhá-li losování, ovládací prvky pro úpravu položek se zamknou. */
  busy?: boolean;
  /**
   * Položky, které nejde odebrat – typicky data schválená adminem. Je-li seznam zadaný,
   * skryje se i hromadné mazání: kdo smí jen přidávat, nesmí mít tlačítko „Vymazat vše".
   */
  lockedItemIds?: Set<string>;
  /** Smí uživatel turnaje přejmenovávat a mazat? (zakládat nové smí vždy) */
  canManageSets?: boolean;
  /** Hlavní vizuál nástroje (souboj, karty zápasů…). */
  stage: ReactNode;
  /** Primární akční tlačítko (mělo by být fullWidth). */
  action: ReactNode;
};

// Sdílený rámec pro nástroje pracující se sadami jmen (souboj, badminton…).
// Stará se o responzivní rozvržení, výběr sady a úpravu položek; nástroj dodá jen vizuál a hlavní akci.
// Navigaci i hlavičku řeší okolní rámec (AppLayout + PageHeader), název sekce se bere z adresy.
const ToolLayout = ({
  scope,
  setNameMode = "text",
  busy = false,
  lockedItemIds,
  canManageSets = true,
  stage,
  action,
}: Props) => {
  const texts = useTexts();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { active, items, addItem, removeItem, clearAll } = useSets(scope);

  const [draft, setDraft] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);

  const handleAdd = () => {
    if (draft.trim() === "") return;
    addItem(draft);
    setDraft("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAdd();
    }
  };

  // Ovládání položek – přidání, seznam a vymazání. Na mobilu se zobrazuje v draweru.
  const itemControls = (
    <>
      <Stack direction="row" spacing={1}>
        <TextField
          fullWidth
          size="small"
          value={draft}
          onChange={event => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          label={texts.addItemPlaceholder}
          disabled={busy}
        />
        <Button
          variant="contained"
          onClick={handleAdd}
          disabled={busy || draft.trim() === ""}
          startIcon={<Icon path={mdiPlus} size={1} />}
        >
          {texts.add}
        </Button>
      </Stack>

      <Box
        sx={{
          flex: 1,
          minHeight: 80,
          overflowY: "auto",
          display: "flex",
          flexWrap: "wrap",
          alignContent: "flex-start",
          gap: 1,
          p: 1,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
        }}
      >
        {items.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {texts.noItems}
          </Typography>
        ) : (
          items.map(item => (
            <Chip
              key={item.id}
              label={item.label}
              onDelete={busy || lockedItemIds?.has(item.id) ? undefined : () => removeItem(item.id)}
            />
          ))
        )}
      </Box>

      {!lockedItemIds && (
        <Button
          color="error"
          variant="outlined"
          onClick={() => setClearOpen(true)}
          disabled={busy || items.length === 0}
          startIcon={<Icon path={mdiTrashCanOutline} size={1} />}
        >
          {texts.clearAll}
        </Button>
      )}

      {/* smazání všech položek je nevratné – vždy se potvrzuje */}
      <Dialog open={clearOpen} onClose={() => setClearOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{texts.clearAll}</DialogTitle>
        <DialogContent>{texts.clearAllConfirm}</DialogContent>
        <DialogActions>
          <Button onClick={() => setClearOpen(false)}>{texts.cancel}</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              clearAll();
              setClearOpen(false);
            }}
          >
            {texts.delete}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );

  if (isMobile) {
    return (
      <>
        <PageHeader />

        {/* Obsah sekce */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            p: 2,
            boxSizing: "border-box",
          }}
        >
          {/* Sjednocená lišta pro výběr a správu sady */}
          <Paper variant="outlined" sx={{ p: 1.5 }}>
            <SetManager scope={scope} nameMode={setNameMode} disabled={busy} canManage={canManageSets} />
          </Paper>

          {/* Vizuál nástroje */}
          <Box sx={stageSx}>{stage}</Box>

          {/* Spodní akce – úprava položek a hlavní akce */}
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              onClick={() => setDrawerOpen(true)}
              disabled={busy}
              startIcon={<Icon path={mdiPlaylistEdit} size={1} />}
              sx={{ flexShrink: 0 }}
            >
              {texts.items}
              {items.length > 0 ? ` · ${items.length}` : ""}
            </Button>
            <Box sx={{ flex: 1 }}>{action}</Box>
          </Stack>
        </Box>

        {/* Drawer s nastavením položek */}
        <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <Stack
            spacing={2}
            sx={{
              width: { xs: "85vw", sm: 360 },
              maxWidth: 420,
              height: "100%",
              minHeight: 0,
              boxSizing: "border-box",
              p: 2,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6" fontWeight={700} noWrap>
                {active?.name ?? texts.items}
              </Typography>
              <IconButton onClick={() => setDrawerOpen(false)} aria-label={texts.close}>
                <Icon path={mdiClose} size={1} />
              </IconButton>
            </Stack>

            {itemControls}
          </Stack>
        </Drawer>
      </>
    );
  }

  return (
    <>
      <PageHeader />

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "row",
          gap: 3,
          p: 3,
          boxSizing: "border-box",
        }}
      >
        {/* Vizuál nástroje – většina obrazovky */}
        <Box sx={stageSx}>{stage}</Box>

        {/* Pravý panel – sada, položky a ovládání */}
        <Paper
          variant="outlined"
          sx={{
            width: 340,
            flexShrink: 0,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            p: 2,
            boxSizing: "border-box",
          }}
        >
          <SetManager scope={scope} nameMode={setNameMode} disabled={busy} canManage={canManageSets} />

          {itemControls}

          {action}
        </Paper>
      </Box>
    </>
  );
};

export default ToolLayout;
