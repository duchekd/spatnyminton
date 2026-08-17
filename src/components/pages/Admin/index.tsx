import { useMemo, useState } from "react";

import { deleteDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { Navigate } from "react-router";

import { Box, Button, Chip, Divider, Paper, Stack, Typography } from "@mui/material";

import { mdiCheck, mdiClipboardCheckOutline, mdiClose } from "@mdi/js";
import Icon from "@mdi/react";

import { mergeProposal, proposalSize } from "../../../utils/proposals";
import { formatDay } from "../../../utils/utils";

import { type Proposal, proposalDocRef, sharedDocRef } from "../../../hooks/badmintonCloud";
import { useApprovedBadminton } from "../../../hooks/useApprovedStore";
import useAuth from "../../../hooks/useAuth";
import { useIsAdmin, useMembersLoaded } from "../../../hooks/useMembers";
import { useProposals } from "../../../hooks/useProposals";
import useStore from "../../../hooks/useStore";

import useTexts from "../../../languages";
import { homePath } from "../../../routes";
import PageHeader from "../../layout/PageHeader";

// Schvalování návrhů od zbytku party. Do sdílených dat zapisuje jedině tahle stránka
// (a běžná editace admina) – členové party posílají jen návrhy.
const AdminPage = () => {
  const texts = useTexts();
  const culture = useStore(state => state.culture);
  const uid = useAuth(state => state.user?.uid);

  const isAdmin = useIsAdmin();
  const membersLoaded = useMembersLoaded();
  const approved = useApprovedBadminton();

  // odběr běží centrálně (useProposalsSync v App), ať z něj může čerpat i odznak v navigaci
  const proposals = useProposals();
  // uid návrhu, se kterým se právě pracuje – zabrání dvojímu kliknutí
  const [busyUid, setBusyUid] = useState<string | null>(null);

  // jména hráčů – schválená i ta navrhovaná, ať jde návrh přečíst i s novými lidmi
  const nameOf = useMemo(() => {
    const names = new Map(approved.sharedItems.map(item => [item.id, item.label]));
    proposals.forEach(proposal => proposal.sharedItems.forEach(item => names.set(item.id, item.label)));
    return (id: string | null) => (id && names.get(id)) || "—";
  }, [approved.sharedItems, proposals]);

  const approve = async (proposal: Proposal) => {
    setBusyUid(proposal.uid);
    try {
      const merged = mergeProposal(approved, proposal);
      // pole se v Firestore nespojují, takže merge:true tady jen zachová ostatní klíče
      await setDoc(sharedDocRef(), { ...merged, updatedAt: serverTimestamp(), updatedBy: uid }, { merge: true });
      // teprve když jsou data bezpečně venku, návrh zahodíme
      await deleteDoc(proposalDocRef(proposal.uid));
    } catch (error) {
      console.debug("Schválení návrhu selhalo", error);
    } finally {
      setBusyUid(null);
    }
  };

  const reject = async (proposal: Proposal) => {
    setBusyUid(proposal.uid);
    try {
      await deleteDoc(proposalDocRef(proposal.uid));
    } catch (error) {
      console.debug("Zamítnutí návrhu selhalo", error);
    } finally {
      setBusyUid(null);
    }
  };

  // dokud nevíme, kdo je admin, nikam neodskakujeme – jinak by to bliklo při načtení
  if (membersLoaded && !isAdmin) return <Navigate to={homePath} replace />;

  return (
    <>
      <PageHeader />

      <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", p: { xs: 2, md: 3 }, boxSizing: "border-box" }}>
        <Box sx={{ maxWidth: 900, mx: "auto" }}>
          {proposals.length === 0 ? (
            <Stack spacing={2} alignItems="center" sx={{ color: "text.secondary", mt: 6, textAlign: "center" }}>
              <Icon path={mdiClipboardCheckOutline} size={3} />
              <Typography variant="body1">{texts.noProposals}</Typography>
            </Stack>
          ) : (
            <Stack spacing={2}>
              {proposals.map(proposal => {
                const size = proposalSize(proposal);
                const busy = busyUid !== null;

                return (
                  <Paper key={proposal.uid} variant="outlined" sx={{ p: 2 }}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      alignItems={{ sm: "center" }}
                      justifyContent="space-between"
                    >
                      <Typography variant="subtitle1" fontWeight={700} sx={{ wordBreak: "break-all" }}>
                        {proposal.email}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {size.matches > 0 && (
                          <Chip size="small" color="warning" label={`${texts.colMatches}: ${size.matches}`} />
                        )}
                        {size.players > 0 && (
                          <Chip size="small" color="info" label={`${texts.items}: ${size.players}`} />
                        )}
                      </Stack>
                    </Stack>

                    <Divider sx={{ my: 1.5 }} />

                    {/* Noví hráči, které návrh přináší */}
                    {proposal.sharedItems.length > 0 && (
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {texts.proposalNewPlayers}
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                          {proposal.sharedItems.map(item => (
                            <Chip key={item.id} size="small" variant="outlined" label={item.label} />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {/* Navržené zápasy po turnajích */}
                    {proposal.sets.map(set => (
                      <Box key={set.id} sx={{ mb: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {formatDay(set.name, culture)}
                        </Typography>
                        <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                          {(set.matches ?? []).map(match => {
                            const wonA = match.sets.filter(s => s.a > s.b).length;
                            const wonB = match.sets.filter(s => s.b > s.a).length;
                            const detail = match.sets.map(s => `${s.a}:${s.b}`).join(", ");
                            return (
                              <Typography key={match.id} variant="body2">
                                {nameOf(match.aId)} <b>{wonA}</b> : <b>{wonB}</b> {nameOf(match.bId)}
                                {detail && (
                                  <Typography component="span" variant="caption" color="text.secondary">
                                    {"  "}({detail})
                                  </Typography>
                                )}
                              </Typography>
                            );
                          })}
                        </Stack>
                      </Box>
                    ))}

                    <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
                      <Button
                        color="error"
                        disabled={busy}
                        onClick={() => void reject(proposal)}
                        startIcon={<Icon path={mdiClose} size={0.9} />}
                      >
                        {texts.reject}
                      </Button>
                      <Button
                        variant="contained"
                        disabled={busy}
                        onClick={() => void approve(proposal)}
                        startIcon={<Icon path={mdiCheck} size={0.9} />}
                      >
                        {texts.approve}
                      </Button>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Box>
      </Box>
    </>
  );
};

export default AdminPage;
