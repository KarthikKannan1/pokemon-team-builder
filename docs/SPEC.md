# Pokémon Team Builder — Specification

A single-page web app that acts as a **directory of my Pokémon across playthroughs**. Build teams for a
specific game, keep them legal for that game, and store Pokémon in a Box for later runs. PKHeX is the
companion tool: Pokémon are exported from here and recreated in PKHeX.

Guiding rule: **follow official Game Freak mechanics, and PKHeX's behaviour where the games don't decide.**

---

## 1. Layout (one page)

```
┌ Version: [ logo  FireRed / LeafGreen ▾ ]   Team: [ Team 1 ▾ ] [+ New] ┐
├────────────────┬──────────────────────────────────────────────────────┤
│ Team (2 × 3)   │ Box  ◀ Box 3 ▾ ▶   (30 slots per box, always shown)  │
├────────────────┴──────────────────────────────────────────────────────┤
│ Details panel — selected Pokémon                                     │
└───────────────────────────────────────────────────────────────────────┘
```

### Version dropdown

- Shows game logos. One entry per **group** (see §2). `Pokémon HOME` = **universal mode**.
- Changing version switches to that version's teams. A version can have **several teams**.

### Team (6 slots, Scarlet/Violet-style list)

- **Empty slot** → opens the Pokémon picker (below).
- **Filled slot** is a compact row, like the SV party list:
  `[mini icon] Nickname   Lv. 36 ♀   [type] [type]   [item] [ball]`
  - Mini menu icons (PokéAPI up to Gen 8; Showdown icons for Gen 9).
  - Held item slot is shown but locked to **None** in games without held items (Gen 1, Let's Go).
  - Ball icon hidden for Gen 1–2 (those games don't record a ball). Gender hidden in Gen 1.
  - Moves are **not** on the row — they live in the Details panel.
- **Click a Pokémon** → selects it: menu with _Move to Box_ · _Remove_ (warns: "Liz will be lost unless
  she's in the Box or exported"), and the Details panel shows that Pokémon.
- **Click the selected Pokémon again** → deselects it; the Details panel shows the **Team overview**.

### Pokémon picker (from an empty slot)

- Large dropdown with **tabs per section**, list / grid / big-grid views, and search.
- Sections for the selected game, in order:
  1. Regional Pokédex(es) — e.g. Kalos _Central / Coastal / Mountain_, Alola per island, Platinum's expanded dex.
  2. National Pokédex (where the game has one).
  3. Game-specific extras — e.g. _Island Scan_, _Ultra Wormhole_ (USUM). Hand-written data.
  4. Other Pokémon — usable in the game (e.g. via transfer) but in none of its dexes.
- Universal mode: every Pokémon and form.
- Note: appearing in the National Dex ≠ catchable in that game.

### Box

- **32 boxes × 30 = 960 slots** (same as Scarlet/Violet). Persistent across versions and teams.
- ◀ ▶ arrows with a slide animation, plus a dropdown to jump to any box.
- Static sprites in the grid (performance); animate on hover.
- **Drag & drop** between Team and Box. Dropping into a team runs the transfer/legality check (§4).
- When full: block the action and ask the user to release a Pokémon first.

### Details panel — nothing selected: Team overview

- **Defence chart:** per attacking type, how many team members are weak / resistant / immune.
- **Move coverage:** types the team's moves hit super-effectively, and the gaps.
- **Balance:** physical vs special attackers, average stats, Speed order.

### Details panel — Pokémon selected

Fields shown/hidden per game (§3); the panel refreshes when the game changes.

- **Large animated sprite** (shiny and form aware).
- Species, nickname (max 10 chars Gen 1–5, 12 from Gen 6), **exact game** within the group
  (e.g. `● Ruby ○ Sapphire ○ Emerald`).
- Level, nature (dropdown shows effect, e.g. `Adamant (+Atk −SpA)`; boosted stat red, lowered blue).
- Ability (with description), held item, Poké Ball, shiny, gender.
- IVs / EVs with limits shown (`EVs 508/510`, per-stat max 252, IVs 0–31). Gen 1–2: DVs (0–15) and stat
  experience (0–65535) instead.
- Calculated stats.
- **Form toggle** for Pokémon with item-dependent forms (`● Base ○ Mega X ○ Mega Y`): preview of stats,
  ability and types with differences (`Atk 130 (+46)`). Preview only — the held item decides the saved form.
- **Move picker** styled like modern games: type-coloured move cards (category, power, accuracy, PP).
  Unlearnable-at-this-level moves are greyed out with the reason (`Learns at Lv. 43`). An ⓘ on each move shows
  full details and description.
- Met location, met level, OT name, Trainer ID — **plain fields, not legality-checked**.

---

## 2. Games

| Dropdown group                    | Exact games                              | Gen |
| --------------------------------- | ---------------------------------------- | --- |
| Pokémon HOME                      | — (universal mode)                       | —   |
| Red / Blue / Yellow               | Red, Blue, Yellow                        | 1   |
| Gold / Silver / Crystal           | Gold, Silver, Crystal                    | 2   |
| Ruby / Sapphire / Emerald         | Ruby, Sapphire, Emerald                  | 3   |
| FireRed / LeafGreen               | FireRed, LeafGreen                       | 3   |
| Diamond / Pearl / Platinum        | Diamond, Pearl, Platinum                 | 4   |
| HeartGold / SoulSilver            | HeartGold, SoulSilver                    | 4   |
| Black / White                     | Black, White                             | 5   |
| Black 2 / White 2                 | Black 2, White 2                         | 5   |
| X / Y                             | X, Y                                     | 6   |
| Omega Ruby / Alpha Sapphire       | Omega Ruby, Alpha Sapphire               | 6   |
| Sun / Moon                        | Sun, Moon                                | 7   |
| Ultra Sun / Ultra Moon            | Ultra Sun, Ultra Moon                    | 7   |
| Let's Go Pikachu / Eevee          | Let's Go Pikachu, Let's Go Eevee         | 7   |
| Sword / Shield (+ DLC)            | Sword, Shield                            | 8   |
| Brilliant Diamond / Shining Pearl | BD, SP                                   | 8   |
| Scarlet / Violet (+ DLC)          | Scarlet, Violet                          | 9   |
| _Coming later_                    | Legends: Arceus, Legends: Z-A, Champions | —   |

Not included: Colosseum, XD.

Rules (learnsets, items, dexes) are applied per **exact game**, not per group — e.g. Emerald has tutors that
Ruby/Sapphire don't; Platinum's dex differs from Diamond/Pearl's.

---

## 3. Fields per game

| Field             | Gen 1         | Gen 2           | Gen 3–9                | Let's Go    | Universal             |
| ----------------- | ------------- | --------------- | ---------------------- | ----------- | --------------------- |
| Held item         | locked None   | ✓               | ✓                      | locked None | ✓ (incl. Mega Stones) |
| Ability           | —             | —               | ✓                      | —           | ✓                     |
| Nature            | —             | —               | ✓                      | ✓           | ✓                     |
| Gender            | —             | ✓ (from Atk DV) | ✓                      | ✓           | ✓                     |
| Shiny             | — (see below) | ✓ (from DVs)    | ✓                      | ✓           | ✓                     |
| Poké Ball         | —             | —               | ✓                      | ✓           | ✓                     |
| Stats system      | DV / stat exp | DV / stat exp   | IV / EV                | IV / AV     | IV / EV               |
| Mega / item forms | —             | —               | games where they exist | Megas       | ✓                     |
| Tera type         | —             | —               | Gen 9 only             | —           | ✓                     |

- **Gen 1 shiny:** no checkbox. Show a **"✨ Shiny after transfer"** badge when DVs match the Gen 2 shiny rule
  (Def = Spe = Spc = 10, Atk ∈ {2,3,6,7,10,11,14,15}); button to set those DVs.
- **Gen 2 shiny:** ticking shiny sets shiny DVs (shininess _is_ the DVs).
- **EV limits:** 255 per stat in Gen 3–5, 252 from Gen 6; 510 total. Stats are identical either way (EV ÷ 4).
- Move/ability data is shown **as it was in that game** (e.g. Charm is Normal before Gen 6).

---

## 4. Moving Pokémon between games (transfer rules)

A Pokémon always remembers its **origin game**. Universal mode is a sandbox; entering a specific game
re-checks everything against that game.

### Allowed directions (official)

- Within a generation's compatible games, both ways: RBY ↔ GSC (Time Capsule; Gen 1-compatible species &
  moves only), RSE ↔ FRLG, DPPt ↔ HGSS, BW ↔ B2W2, XY ↔ ORAS, SM ↔ USUM.
- Forward only: Gen 3 → 4 (Pal Park) → 5 (Poké Transfer) → 6 → 7 (Poké Bank) → HOME → Switch games.
- Gen 1–2 Virtual Console → Gen 7 only (never to Gen 3–6).
- Let's Go → HOME only; cannot return to Let's Go once moved.
- Switch games (SwSh, BDSP, SV) via HOME, only if the species exists in the destination game.
- **Backward transfers are rejected.**

### On drop into a team

1. **Unfixable → reject outright:** species or form doesn't exist in that game; transfer direction illegal.
   _"Togekiss doesn't exist in Red."_
2. **Fixable → one prompt listing every conflict**, with _Fix and add_ / _Cancel_:
   - held item doesn't exist in the game → remove
   - move not learnable in the game (or HM move when going via Pal Park) → remove
   - nature / ability not in the game → remove
   - stat system conversion (below)

### Stat conversions

- Gen 3 → 9 transfers: IVs, EVs, nature, ability kept; stats recalculated.
- Gen 1–2 → Gen 7 (VC rules): 3 random perfect IVs (5 for Mew/Celebi), EVs reset to 0,
  nature = EXP mod 25, usually Hidden Ability, Poké Ball, met location "Kanto/Johto transfer".
  Shiny if DVs match the Gen 2 shiny rule.
- Universal → Gen 1–2 (our rule, no official equivalent): DV = IV ÷ 2, stat experience reset to 0.

### Move vs copy

- Drag = **move** (one Pokémon, one place), like PKHeX.
- Copy = explicit _Clone_ action.

---

## 5. Legality checks (v1)

Checked: species/form available in game · moves (level-up ≤ level, TM/HM/tutor/egg for that exact game,
pre-evolution moves, events only if origin is that event) · max 4 unique moves · ability valid for species
in that game · nature/item/ball existence per game · EV/IV/DV limits · nickname length · transfer direction.

**Not checked (out of scope):** encounter legality (met location / level / "Dratini at Oak's lab"),
ribbons, shiny locks per encounter. PKHeX remains the final legality authority.

Saved Pokémon are re-validated when the app loads; problems are **flagged, never auto-deleted**.

---

## 6. Data sources

| Data                                                                       | Source                                              |
| -------------------------------------------------------------------------- | --------------------------------------------------- |
| Learnsets per game, TM/HM numbers, regional & national dexes, Pokédex text | PokéAPI CSV dump (build-time)                       |
| Stats/types/abilities per gen, move details, items, natures, events        | `@pkmn/dex` (Pokémon Showdown data)                 |
| Game extras (Island Scan, Ultra Wormhole…)                                 | Hand-written JSON in repo                           |
| Sprites — static                                                           | PokéAPI sprites: Pokémon HOME renders (incl. shiny) |
| Sprites — animated                                                         | Pokémon Showdown animated sprites                   |
| Item icons                                                                 | PokéAPI sprites                                     |
| Game logos                                                                 | Sourced manually (non-commercial fan project)       |

All data is built into static JSON at build time; the app makes no API calls at runtime.
Sprites are self-hosted before public release.

## 7. Storage & export

- Browser IndexedDB (Dexie): teams per version, Box, settings. Each origin (localhost vs github.io) has its own storage.
- Export: team / single Pokémon as **Showdown text** (importable into PKHeX); full backup as **versioned JSON**.
- Import: Showdown text, JSON backup.

## 8. Build order (→ GitHub issues)

1. Data pipeline (PokéAPI + @pkmn → JSON, incl. dexes)
2. Legality + stats engine (`src/lib`, unit-tested)
3. Storage layer (Dexie: teams, Box, settings)
4. Layout: version dropdown, team grid, Box with paging
5. Pokémon picker (sections, views, search)
6. Details panel (fields per game, nature/EV/IV, form toggle)
7. Move picker (move cards, ⓘ details)
8. Drag & drop + transfer prompt
9. Export / import
10. Deploy to GitHub Pages
11. Later: Legends Arceus, Legends Z-A, Champions; sprite self-hosting
