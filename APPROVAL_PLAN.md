# Plán – schvalování změn v badmintonu (návrhy od uživatelů)

> Stav: **naimplementováno** (15. 8. 2026). Zbývá poslední krok nasazení – publikovat
> nová pravidla ve Firebase konzoli současně s nasazením appky (viz „Nasazení" níže).

## Cíl

Admin je jediný, kdo mění ostrá data. Ostatní členové party můžou zadávat výsledky, ale
jejich zápisy jsou nejdřív **návrhy** – u nich označené jako „čeká na schválení", ve
statistice se nepočítají. Teprve po schválení adminem se stanou součástí sdílených dat.

Hlavní obava: aby ostatní nemohli **mazat** a rozbíjet data.

## Proč zrovna takhle (zjištění z analýzy)

1. **Celý badminton je jeden dokument** `badminton/shared` (`sets[]` + `sharedItems[]`),
   který se při každé změně přepíše celý – viz [useBadmintonSync.ts](src/hooks/useBadmintonSync.ts).
   Z toho plyne, že Firestore pravidla neumí rozlišit „přidal zápas" od „smazal zápas" –
   vidí jen blob. Umí max. porovnat velikosti polí (`sets`, `sharedItems`), takže *„nesmíš
   ubrat turnaj ani hráče"* jde napsat, ale *„nesmíš smazat zápas uvnitř turnaje"* ne.
2. **Samotné odepření práv rozbije UX.** Zápisy jsou fire-and-forget (`void setDoc` bez
   `catch`), takže odepřený zápis selže tiše – uživatel dál edituje, vidí svoje změny a
   netuší, že se neukládají, a jeho stav se rozejde s cloudem.
3. **Dnešní riziko nezávislé na právech:** last-write-wins nad celým datasetem. Když dva
   zapisují současně, jeden druhému může tiše přemazat zápas.

Obecný schvalovací workflow (log operací + řešení konfliktů) by byl overkill. Návrh níže
dává 90 % užitku, protože **návrhy smí jen přidávat** – tím konflikty odpadají úplně.

## Datový model

### `config/members` (nový, vytvořit ručně v konzoli)

Jediný dokument. **Nikdy nepatří do repa** – proto je seznam tady, ne v `firestore.rules`.

```json
{ "admins": ["<admin e-mail>"], "members": ["<clen1>", "<clen2>", "<clen3>"] }
```

Členy měníš v konzoli bez redeploye pravidel. Appka si z něj zjistí, jestli ukázat admin
záložku (bezpečnost stojí na pravidlech, ne na skrytém tlačítku).

### `badminton/shared` (beze změny tvarem)

`{ sets, sharedItems, updatedAt, updatedBy }`. Nově **zápis jen admin**.

### `badminton_proposals/{uid}` (nový)

Návrh jednoho uživatele ve **stejném tvaru** jako shared (`{ sets, sharedItems }`), ale
obsahuje jen to, co přidal navíc. Plus `email` pro zobrazení v admin záložce.

Merge je díky tomu triviální:
- turnaj se stejným `id` jako ve shared → připoj jeho `matches`
- turnaj s neznámým `id` → přidej celý
- hráči: přidej ty, jejichž `id` ve shared není

Žádný nový formát operací, žádné řešení konfliktů. Jediná kolize, která může nastat:
admin mezitím smazal turnaj, do kterého někdo navrhoval zápas → při schvalování se návrh
přeskočí a označí.

## Pravidla (firestore.rules)

```
function members() { return get(/databases/$(database)/documents/config/members).data; }
function isAdmin()  { return request.auth != null && request.auth.token.email in members().admins; }
function isMember() { return isAdmin() || (request.auth != null && request.auth.token.email in members().members); }

match /config/members            { allow read: if request.auth != null; allow write: if false; }
match /badminton/{docId}         { allow read: if isMember();  allow write: if isAdmin(); }
match /badminton_proposals/{uid} { allow read, write: if isAdmin() || request.auth.uid == uid; }
```

Po nasazení nezůstane v repu žádný e-mail. (Pozn.: dnešní [firestore.rules](firestore.rules)
má admin e-mail natvrdo a repo je veřejné – tohle to zároveň uklidí.)

## Změny v aplikaci

| Soubor | Co udělat |
|---|---|
| `src/hooks/useMembers.ts` **(nový)** | načte `config/members`, vystaví `isAdmin` / `isMember` (zustand store jako `useAuth`) |
| `src/utils/proposals.ts` **(nový)** | `diffAdditions(local, approved)` + `mergeProposal(approved, proposal)` – čistá logika, jádro celé věci |
| [useBadmintonSync.ts](src/hooks/useBadmintonSync.ts) | rozdělit větve: **admin** = dnešní obousměrný sync shared; **ne-admin** = shared jen ke čtení (`onSnapshot` → `replaceBadmintonData`), lokální změny projít přes `diffAdditions` a zapsat do `badminton_proposals/{uid}` |
| `src/hooks/useApprovedStore.ts` **(nový)** | drží poslední schválený snapshot ze shared; fallback na lokální data, když sync neběží (`isFirebaseConfigured === false`) |
| [BadmintonStats/index.tsx](src/components/pages/BadmintonStats/index.tsx) | přepnout zdroj dat na schválený snapshot – pending se do žebříčků nepočítá |
| [MatchCard.tsx](src/components/pages/Badminton/MatchCard.tsx) | odznak „čeká na schválení"; ne-adminovi zakázat mazání/editaci už schválených zápasů |
| `src/components/pages/Admin/index.tsx` **(nová stránka)** | seznam návrhů seskupený po uživatelích → Schválit / Zamítnout |
| [routes.ts](src/routes.ts) | přidat sekci `admin` |
| [NavRail.tsx](src/components/layout/NavRail.tsx), [NavDrawer.tsx](src/components/layout/NavDrawer.tsx) | admin sekci zobrazit jen adminovi |
| [csCZ.ts](src/languages/csCZ.ts), [enUS.ts](src/languages/enUS.ts) | texty |

**Badminton stránka se skoro nemění.** Ostatní editují přesně jako dneska, jen si to sync
hook přebere a udělá z toho návrh. Versus se to netýká vůbec (je lokální).

**Vedlejší efekt zdarma:** do `badminton/shared` napříště zapisuje jen adminův klient,
takže dnešní riziko souběžného přemazání (bod 3 výše) mizí samo.

## Nasazení

Pravidla a appku nasadit **současně** – jakmile jsou venku pravidla, ostatní ztratí zápis
do shared. Existující data se nijak nemigrují.

1. Vytvořit `config/members` v konzoli.
2. Nasadit pravidla.
3. Nasadit appku.

## Otevřené body

- **Snapshot / undo** – pár řádků navíc: adminův klient si při každém schválení odloží
  předchozí stav do `badminton/history/{ts}`. Nejlevnější pojistka proti „ono se to
  smazalo". Zatím nerozhodnuto, jestli hned, nebo později.
- Mají ostatní moct navrhovat i **nový turnaj** (sadu), nebo jen zápasy do existujících?
  Návrh výše to umožňuje (turnaj s neznámým `id`), protože jinak nemůžou zapsat výsledky
  z dnešního hraní, dokud admin sadu nezaloží.
