import { useMemo } from "react";

import { Box, Button, Stack, Typography } from "@mui/material";

import { mdiBadminton, mdiPlus } from "@mdi/js";
import Icon from "@mdi/react";

import { approvedMatchIds } from "../../../utils/proposals";

import { useApprovedBadminton } from "../../../hooks/useApprovedStore";
import { useIsAdmin } from "../../../hooks/useMembers";
import useSets from "../../../hooks/useSetStore";

import useTexts from "../../../languages";
import ToolLayout from "../../layout/ToolLayout";

import MatchCard from "./MatchCard";

const BadmintonPage = () => {
  const texts = useTexts();

  const { active, items, addMatch, removeMatch, setMatchPlayer, addMatchSet, updateMatchSet, removeMatchSet } =
    useSets("badminton");

  // Členové party smí data jen doplňovat – co je už schválené, mění výhradně admin.
  const isAdmin = useIsAdmin();
  const approved = useApprovedBadminton();
  // závisíme na polích, ne na obalu – ten se bez běžící synchronizace tvoří při každém renderu
  const approvedMatches = useMemo(() => approvedMatchIds(approved), [approved.sets]); // eslint-disable-line react-hooks/exhaustive-deps
  const approvedPlayers = useMemo(
    () => new Set(approved.sharedItems.map(item => item.id)),
    [approved.sharedItems]
  );

  const players = items;
  const matches = active?.matches ?? [];
  const setId = active?.id ?? null;
  const canPlay = players.length >= 2;

  // Tahle hra nic nelosuje – uživatel jen zadává výsledky. Stage = seznam zápasů.
  const stage = !canPlay ? (
    <Stack spacing={2} alignItems="center" sx={{ color: "text.secondary", px: 2, textAlign: "center" }}>
      <Icon path={mdiBadminton} size={3} />
      <Typography variant="body1">{texts.needTwoPlayers}</Typography>
    </Stack>
  ) : (
    <Box sx={{ width: "100%", height: "100%", overflowY: "auto" }}>
      <Stack spacing={2} sx={{ py: 1, margin: "0 auto", maxWidth: 450 }}>
        {/* ať je jasné, proč se nové zápasy hned neobjeví ve statistice */}
        {!isAdmin && (
          <Typography variant="caption" color="text.secondary" textAlign="center">
            {texts.proposalHint}
          </Typography>
        )}

        {matches.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
            {texts.noMatches}
          </Typography>
        ) : (
          matches.map(match => {
            const isApproved = approvedMatches.has(match.id);
            return (
              <MatchCard
                key={match.id}
                match={match}
                players={players}
                pending={!isAdmin && !isApproved}
                readOnly={!isAdmin && isApproved}
                onSetPlayer={(side, id) => setId && setMatchPlayer(setId, match.id, side, id)}
                onAddSet={() => setId && addMatchSet(setId, match.id)}
                onUpdateSet={(index, side, value) => setId && updateMatchSet(setId, match.id, index, side, value)}
                onRemoveSet={index => setId && removeMatchSet(setId, match.id, index)}
                onRemove={() => setId && removeMatch(setId, match.id)}
              />
            );
          })
        )}
      </Stack>
    </Box>
  );

  const action = (
    <Button
      fullWidth
      size="large"
      variant="contained"
      onClick={() => setId && addMatch(setId)}
      disabled={!canPlay}
      startIcon={<Icon path={mdiPlus} size={1} />}
    >
      {texts.newMatch}
    </Button>
  );

  return (
    <ToolLayout
      scope="badminton"
      setNameMode="date"
      stage={stage}
      action={action}
      // schválené položky a správu turnajů má v rukou jen admin
      lockedItemIds={isAdmin ? undefined : approvedPlayers}
      canManageSets={isAdmin}
    />
  );
};

export default BadmintonPage;
