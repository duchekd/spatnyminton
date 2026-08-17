# Firebase – zprovoznění synchronizace badmintonu

Badminton (a tím i statistika) se synchronizuje živě přes Firebase Firestore mezi všemi
přihlášenými. Versus zůstává lokální. Bez vyplněné konfigurace appka jede
čistě lokálně (synchronizace je vypnutá).

## 1. Založit projekt ve Firebase
1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. **Build → Authentication → Get started → Sign-in method → Google → Enable.**
3. **Build → Firestore Database → Create database** (start v produkčním režimu).

## 2. Založit seznam party
Ve Firestore → **Data** vytvoř kolekci `config` a v ní dokument s ID **`members`**
(ručně, ne Auto-ID) se dvěma poli typu *array of string*:

| Field | Obsah |
|---|---|
| `admins` | e-maily správců – jen ti smí měnit schválená data |
| `members` | e-maily zbytku party – smí číst a posílat návrhy |

E-maily musí sedět přesně tak, jak je vidíš v **Authentication → Users → Identifier**.
Seznam je záměrně tady a ne ve zdrojácích – repo je veřejné.

**Tenhle dokument musí existovat dřív, než nasadíš pravidla** – čtou si ho a bez něj
odepřou přístup všem.

## 3. Nasadit pravidla
Ve Firestore → **Rules** vlož obsah [firestore.rules](firestore.rules) a publikuj.
Publikuj je až spolu s nasazením appky – od té chvíle zapisuje do sdílených dat jen správce.

## 4. Konfigurace v appce
**Project settings → General → Your apps → Web app** (případně registruj novou) →
zkopíruj hodnoty `firebaseConfig`.

- **Lokálně:** zkopíruj [.env.example](.env.example) do `.env.local` a doplň `VITE_FIREBASE_*`.
  Při přechodu na jiný projekt hodnoty přepiš – jinak vývoj běží dál proti tomu starému.
- **Deploy (GitHub Pages):** v repu **Settings → Secrets and variables → Actions** přidej
  stejné klíče jako *secrets* (`VITE_FIREBASE_API_KEY`, …). Build workflow je injektuje do buildu.

## 5. Povolit domény pro přihlášení
**Authentication → Settings → Authorized domains** → přidej `localhost` (dev) a doménu
GitHub Pages (`<user>.github.io`). Pozor, doména je **účtu, ne repozitáře** – všechny
project pages jednoho účtu jedou na stejné, takže po přesunu do jiného repa se nemění.
Nový projekt má ale seznam prázdný, tam ji doplnit musíš.

## 6. Přenos dat ze starého projektu
Data jsou jeden dokument (`badminton/shared`), takže se nemusí nic exportovat – stačí
nechat appku, ať ho v novém projektu založí z lokální kopie. Adminův klient to dělá sám:
když `badminton/shared` neexistuje, zapíše do něj svůj lokální stav.

**Napřed musí být hotové kroky 1–5** (hlavně `config/members` s tvým e-mailem v `admins`
a nasazená pravidla), jinak se z tebe stane obyčejný člen a data odejdou jako návrh.

1. V prohlížeči, kde appku používáš jako správce, otevři **starou** appku a přihlas se.
   Počkej, až se zápasy načtou – tím máš čerstvou lokální kopii schválených dat.
2. Otevři **novou** appku (už s configem nového projektu) a přihlas se stejným účtem.
   Project pages sdílí doménu, takže nová appka čte stejné `localStorage` jako stará
   a data v ní rovnou uvidíš.
3. Ve Firestore konzoli zkontroluj, že `badminton/shared` vzniklo a má pole `sets`
   a `sharedItems`.

Když je stará appka v jiném prohlížeči nebo na jiném počítači, přenes lokální kopii ručně.
V konzoli prohlížeče (F12) nad **starou** appkou:

```js
copy(localStorage.getItem("spatnyMinton-items") ?? localStorage.getItem("randomizer-wheel-items"))
```

a nad **novou** appkou, ještě před přihlášením:

```js
localStorage.setItem("spatnyMinton-items", `<vlož zkopírovanou hodnotu>`); location.reload();
```

Pak se přihlas jako správce – dál to pokračuje bodem 3.

Návrhy čekající na schválení (`badminton_proposals/*`) se takhle nepřenesou. Je to
záměrně: schval je ve staré appce **před** migrací, ať jsou součástí schválených dat.

## Jak to funguje
- Schválená data leží v dokumentu `badminton/shared` (`sets` + `sharedItems`).
  Zapisuje do nich **jen správce**.
- Ostatní členové party posílají přírůstky jako návrhy do `badminton_proposals/{uid}`
  (jeden dokument na uživatele, do cizích nevidí). Ve svých kartách vidí schválená data
  i vlastní návrhy označené jako „Čeká na schválení"; do statistiky se počítají až po
  schválení v sekci **Schvalování**.
- Návrhy jsou **jen přírůstkové** – mazání a úpravy schválených dat se do nich nepromítnou.
  Proto se nemůže stát, že by člen party něco zničil, a schvalování neřeší konflikty.
- Lokální výběr turnaje (`activeId`) se nesdílí.
- Local-first: funguje i offline, po obnovení sítě se dosyncuje.
- Do sdílených dat zapisuje jediný klient (správcův), takže nehrozí, že by si dva lidé
  navzájem přepsali zápasy.
