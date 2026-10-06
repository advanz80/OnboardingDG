# Plan — Pirates of Port Zélande

Keuzes: **Vanilla JS**, Phaser 3 + Vite, held met **eigen naam + uiterlijk**, huisstijlkleuren als **schatting in één config-bestand**, na akkoord bouw ik **alle mijlpalen door** (commit + push per mijlpaal).

## 1. Mappenstructuur

```
portzelande/
├─ .github/workflows/deploy.yml     build + deploy naar GitHub Pages
├─ index.html
├─ vite.config.js                   base: '/portzelande/'
├─ public/assets/logos/             driessen.svg, bloeij.svg, ijk.svg, haert.svg, reijn.svg, bhc.svg
├─ docs/PLAN.md
├─ README.md
└─ src/
   ├─ main.js                       Phaser-config (1280×720, Scale.FIT, landscape)
   ├─ content/nl.json               ALLE teksten (dialogen, uitleg, UI, credits)
   ├─ config/brands.js              per bedrijf: kleur, logo-pad, zone, NPC
   ├─ core/
   │  ├─ i18n.js                    t('missie.driessen.intro') + {naam}-placeholders
   │  ├─ SaveManager.js             voortgang in localStorage (versie-veld)
   │  ├─ Leaderboard.js             interface + LocalProvider (later SupabaseProvider)
   │  ├─ AudioEngine.js             Web Audio: sequencer, shanty-thema's, SFX, mute
   │  ├─ Controls.js                WASD/pijlen/spatie + virtuele joystick/actieknop
   │  └─ Juice.js                   shake, hitstop, particles (water/munten/confetti), pop-tweens
   ├─ gfx/
   │  ├─ palette.js                 zomers palet + contourdikte/schaduwregels
   │  ├─ TextureFactory.js          genereert ALLE textures bij opstart (tegels, palmen, bungalows, schip…)
   │  └─ CharacterFactory.js        parametrisch poppetje (huid/haar/shirt/hoed) voor speler, NPC's, piraten
   ├─ ui/                           Button, Panel, TypewriterDialog, Meter, Toast, LogoBadge (met fallback)
   └─ scenes/
      ├─ BootScene / PreloadScene   textures genereren, logo's laden (fallback bij 404)
      ├─ MenuScene                  Nieuw spel / Doorgaan / Leaderboard / Geluid
      ├─ CharacterScene             naam + uiterlijk kiezen
      ├─ WorldScene + HUDScene      het park, kaart, missie-markers, fragmenten-teller, timer
      ├─ DialogScene                typewriter-dialoog overlay
      ├─ missions/
      │  ├─ MissionBase.js          TEMPLATE: intro-dialoog → uitlegscherm → spel → score → beloning
      │  ├─ BhcMission.js · DriessenMission.js · BloeijMission.js
      │  └─ IjkMission.js · HaertMission.js · ReijnMission.js
      ├─ FinaleScene.js             eindbaas in fases
      ├─ CreditsScene.js            bevrijde Jan, aftiteling, naam op leaderboard
      └─ LeaderboardScene.js
```

## 2. Parkwereld

Top-down kaart (~3×3 schermen), tegels programmatisch getekend. Zones met eigen huisstijlkleur in vlaggen/borden/NPC-shirts:

| Zone | Bedrijf | Plek in het park |
|---|---|---|
| Receptieplein | Driessen | centrale plein bij de ingang |
| Strand | Bloeij | zandstrand langs het Grevelingenmeer |
| Pomphal onder het subtropisch zwembad | IJk | buizen = datastromen |
| Jachthaven | Haert | steigers, bootjes, opdrachtgevers |
| Piratenkamp op de pier | Reijn | ruziënde crew |
| Bouwplaats van de brug | BHC | rand van het park, zicht op piratenschip |
| Piratenschip | Finale | in het meer, bereikbaar na bouw brug |

Sfeer: animerend water (shader-loze golftegels + schuimparticles), wuivende palmen, meeuwen, idle-animaties NPC's, dag-licht met zachte schaduwen.

## 3. Missie-ontwerp (elk 2–4 min, vrije volgorde)

**Template (MissionBase):** NPC-intro (typewriter) → 1 uitlegscherm met icoontjes → minigame met timer/score → resultaat (sterren 1–3) → beloning: sleutelfragment vliegt naar HUD + confetti + munten. Herspeelbaar voor hogere score.

1. **BHC — Brug van badges** (eerst gebouwd, dient als template)
   Fase 1: 9 skill-badges in drie kleuren (bedrijfsleven/onderwijs/overheid) verschijnen in het park; verzamel ze binnen 3 min, ontwijk patrouillerende papegaaien die badges jatten. Fase 2: bouw de brug — elke pijler heeft één badge van elk van de drie sectoren nodig (triple helix). Brug groeit segment voor segment.
2. **Driessen — Werven & plaatsen**
   Vacaturebord met 3 open posities (strandwacht, kok, monteur, later barista/animator). Kandidaatkaarten schuiven binnen met vaardigheid-iconen en beschikbaarheid (ochtend/avond/weekend). Sleep/tik kandidaat → positie. Score = match-kwaliteit + snelheid (combo). Piraat schuift nep-CV's (ooglapje) ertussen → afwijzen. 3 rondes van ±45 s, oplopend tempo.
3. **Bloeij — Fit aan het werk**
   Strand met 8 collega's met klacht-icoon (uitgeput, rugpijn, stress, ontmoedigd). Loop erheen, kies interventie (rust / gesprek / aangepast werk / beweging). Goed = collega staat op en loopt vrolijk weg. Tegelijk zakt de team-vitaliteitsmeter; piraten met megafoon verhogen stress in hun buurt; fruit/water-kraampjes laden de meter op. Win: iedereen terug vóór meter leeg.
4. **IJk — Data stroomt, loon klopt**
   Deel 1: koppelingspuzzel 6×6 — draai tegels zodat Tijdregistratie, Verlof en Contracten naar het HR-systeem stromen (water/data-animatie door de buizen). 2 levels. Deel 2: loonrun — loonstroken op lopende band; vergelijk met cao-kaartje (uren, schaal, toeslag) en keur goed/af. Fouten kosten tijd.
5. **Haert — De regisseur**
   Marktplaatsbord: opdrachten komen binnen (budget, gewenste kwaliteit, startdatum). Per opdracht 3 aanbieders (zzp'er / detacheringspartij) met prijs, rating, beschikbaarheid. Eén is soms een vermomde "gelukszoeker" (rode vlaggen: geen KvK, te goedkoop, nep-reviews). Opdrachten verlopen → tijdsdruk.
6. **Reijn — Quickscan aan dek**
   Interview 5 crewleden (dialoogkeuzes); bevindingen landen in je notitieboek. Kies daarna diagnose (geen functiehuis / conflict / cultuur) en het passende advies. Elke run een willekeurig scenario uit 3. Score bepaalt hoeveel crewleden (0–4) overlopen → hulp in de finale.
7. **Finale — Kapitein Kostenpost**
   Op het piratenschip, 3 fases met boss-HP-balk: (1) **matchen** — bemanning de juiste kanonnen/posten geven, (2) **koppelen** — touwen/kabels naar Jans kooi verbinden onder vuur, (3) **adviseren** — weerleg de drogredenen van de kapitein met het juiste antwoord. Overgelopen crew geeft extra tijd/hints/schild. Daarna: kooi open, Jan bevrijd, feest, aftiteling, naam + tijd + score naar leaderboard.

## 4. Techniek

- **Graphics:** alles via Phaser Graphics → `generateTexture`, dikke donkere contour (4 px), zomers palet, zachte ellips-schaduwen. Geen externe afbeeldingen behalve logo's.
- **Logo's:** geladen uit `public/assets/logos/`; bij ontbreken → ronde badge met initialen in huisstijlkleur.
- **Audio:** eigen mini-sequencer (lookahead-scheduling) met square/triangle-synths + noise-drums; shanty-thema in 6/8, per zone andere toonsoort/tempo/instrument; SFX (munt, pop, fout, splash, kanon) gesynthetiseerd. Mute-knop, onthouden in localStorage. Audio start na eerste tik (browserregel).
- **Besturing:** toetsenbord + virtuele joystick/actieknop (alleen op touch zichtbaar). Portrait-melding "draai je telefoon".
- **Performance:** texture-atlases bij boot, object pooling voor particles, geen per-frame Graphics-hertekenen, FPS-doel 60.
- **Opslag:** `SaveManager` (fragmenten, beste score per missie, totale speeltijd, avatar). Leaderboard via `LeaderboardProvider`-interface (`submit`, `top(n)`); nu `LocalStorageProvider`.
- **Score:** som missiescores + finale + tijdbonus; totale speeltijd telt als tiebreaker.
- **Deploy:** GitHub Action (`npm ci && npm run build` → `actions/deploy-pages`).

## 5. Mijlpalen

| | Inhoud | Check |
|---|---|---|
| a | Skelet, Vite, Phaser, menu, nl.json, deploy-workflow | build OK |
| b | TextureFactory, parkwereld, speler + besturing, HUD, dialogen, save | build + headless smoke-test |
| c | MissionBase + BHC, dan Driessen, Bloeij, IJk, Haert, Reijn | per missie build + test |
| d | Finale + credits + leaderboard | build |
| e | Audio-engine, thema's per zone, SFX | build |
| f | Polish, juice, mobiel (touch, schaal, fps), README | Playwright-screenshots desktop + mobiel |

## 6. Aandachtspunten

- **Huisstijlkleuren** zijn mijn schatting — staan in `src/config/brands.js`, makkelijk aan te passen.
- **Merknamen:** ik gebruik "Port Zélande" en generieke namen ("subtropisch zwembad"), geen Center Parcs-merknamen of -logo's.
- **Jan Driessen** wordt een cartoonfiguur; checken of hij het leuk vindt is aan jou 😉.
- **GitHub Pages** moet jij éénmalig aanzetten (Settings → Pages → Source: GitHub Actions); staat in de README.
- Scope is groot: ik bouw eerst alles speelbaar, daarna polish. Fijnslijpen van moeilijkheid kan het best na een testronde met een paar collega's.
