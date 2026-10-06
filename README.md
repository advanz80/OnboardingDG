# Driessen Groep Campus Crossing 🍃📄

**Speel online:** https://advanz80.github.io/OnboardingDG/

> Nieuwe variant van [Pirates of Port Zélande](https://github.com/advanz80/portzelande)
> ([spelen](https://advanz80.github.io/portzelande/)). Beide versies draaien naast elkaar op
> advanz80.github.io: deze variant gebruikt eigen localStorage-sleutels (`odg.*`), een eigen
> leaderboard (`app = 'OnboardingDG'`) en een eigen app-id in het manifest.

Een top-down onboarding-game in de browser voor (nieuwe) collega's van Driessen Groep, op
een nagetekende Brainport Human Campus in Helmond. Kapitein Rompslomp (werkdruk, regeltjes,
bureaucratie en administratie) en zijn paarse krokodil Kroko Paragraaf houden prinses
Mensenmens gevangen in de Toren van Paperassen. Samen met je maatje Buddy help je de zes
bedrijven van de groep, verzamel je zes sleutelfragmenten en bevrijd je de prinses.

- **Speelduur:** ca. 20–30 minuten
- **Besturing:** WASD/pijltjes + spatie (of E/Enter). Op telefoon/tablet: virtuele joystick
  (linkerhelft scherm) + actieknop. Minigames werken met klikken/tikken of slepen.
- **Techniek:** Phaser 3 + Vite, vanilla JavaScript, geen backend. Alle graphics en audio
  worden in code gegenereerd, behalve de bedrijfslogo's.

---

## Lokaal draaien

Vereist: [Node.js](https://nodejs.org) 20 of nieuwer.

```bash
npm install
npm run dev
```

Open daarna de URL die Vite toont (meestal http://localhost:5173). Wijzigingen in de code
of teksten zie je direct.

Een productiebuild maak je met `npm run build`. Het resultaat staat in `dist/`.

---

## Logo's toevoegen

Zet de logo's als SVG in `public/assets/logos/` met precies deze bestandsnamen:

| Bedrijf | Bestand |
|---|---|
| Driessen | `driessen.png` (staat er al) |
| Bloeij | `bloeij.png` (staat er al) |
| IJk | `ijk.png` (staat er al) |
| Haert | `haert.png` (staat er al) |
| Reijn | `reijn.png` (staat er al) |
| Brainport Human Campus | `bhc.png` (staat er al) |

Tips:
- Gebruik SVG's **met een `viewBox`**, dan blijven de verhoudingen goed.
- Ontbreekt een logo, dan tekent het spel automatisch een ronde badge met de initialen in de
  huisstijlkleur. Je kunt het spel dus ook zonder logo's spelen.
- PNG mag ook: pas dan de bestandsnaam aan in `src/config/brands.js` (bijv. `logo: 'driessen.png'`).
  Gebruik een transparante achtergrond en minstens 400 px breed.
- Elk logo wordt automatisch op een rond wit badgeje met een rand in de huisstijlkleur gezet.
  Een vierkant beeldmerk is op kleine plekken (bovenbalk) beter leesbaar dan een breed woordmerk.

## Huisstijlkleuren aanpassen

De kleuren per bedrijf staan in **`src/config/brands.js`** (nu een schatting). Vervang de
hex-codes, bijvoorbeeld:

```js
driessen: { ..., ...hex('#E2001A'), dark: '#9E0012', ... },
```

`hex(...)` is de hoofdkleur (kraampjes, vlaggen, knoppen, achtergronden); `dark` is een
donkere variant.

## Teksten aanpassen

**Alle** dialogen, uitleg en UI-teksten staan in **`src/content/nl.json`**.

- `story.*`: verhaal en park-dialogen (Petra, de wachter, losse kreten van collega's).
- `missions.<bedrijf>.*`: per missie de NPC-naam, intro, uitleg (`howTo`), outro en
  missie-inhoud (kandidaten, collega's op het strand, interviews, opdrachten…).
- `finale.*`: dialogen en "drogredenen" van de kapitein, met antwoordopties. `answer` is
  het nummer van het goede antwoord (0 = eerste).
- `credits.lines`: de aftiteling.

Regels:
- `{naam}` wordt vervangen door de naam van de speler. Andere `{...}`-woorden
  (zoals `{aantal}`, `{bedrijf}`) worden ook automatisch ingevuld; laat ze staan.
- Een dialoogregel ziet er zo uit: `{ "speaker": "npc", "text": "..." }`.
  Mogelijke sprekers: `npc` (de NPC van de missie), `petra`, `jan`, `captain`, `guard`, `player`.
- Houd het bestand geldige JSON (let op komma's en aanhalingstekens). Een JSON-validator
  helpt bij twijfel.

## GitHub Pages aanzetten

1. Push de code naar de standaardbranch (`main` of `Main`) van de repository.
2. Ga op GitHub naar **Settings → Pages** en kies bij **Source: GitHub Actions**.
3. De workflow `.github/workflows/deploy.yml` bouwt en publiceert het spel bij elke push
   naar `main` (of handmatig via **Actions → Deploy naar GitHub Pages → Run workflow**).
4. Het spel staat daarna op `https://<gebruikersnaam>.github.io/<repo-naam>/`.

Het pad (`base`) wordt in de workflow automatisch op de repo-naam gezet. Bouw je lokaal
voor een andere locatie, pas dan `REPO_BASE` aan in `vite.config.js` of zet de
omgevingsvariabele `BASE_PATH`.

## Spelen op iPhone/iPad (schermvullend)

Safari laat websites de adres- en tabbalk niet verbergen. Voor de beste ervaring:
1. Open het spel in Safari.
2. Tik op **Deel** (vierkant met pijl) → **Zet op beginscherm** → **Voeg toe**.
3. Start het spel voortaan via het nieuwe icoon: het opent schermvullend in liggende stand.

Het spel past zijn breedte automatisch aan de schermverhouding aan (van 16:9 tot 3:1),
zodat er geen zwarte balken naast het beeld komen.

## Personages aanpassen

- **Namen** staan in `src/content/nl.json` (blok `npc` en `missions.<bedrijf>.npc`).
- **Uiterlijk** van vaste personages (Petra, de NPC's per missie, Jan, de kapitein) staat in
  `src/config/npcs.js`. Per personage kies je o.a. `skin`, `hair`, `hairStyle`
  (short/long/bob/ponytail/bun/curly/spiky/bald), `top` (tee/polo/hoodie/blouse/shirt), `shirt`
  (kleur), `pattern` (stripes/dots), `bottom` (pants/shorts/skirt), `pants` (kleur), `shoes`,
  `eyes` (dot/round/lashes/sleepy), `hat`, `accessory`, `glasses`, `badge` (kleur naamkaartje),
  `beard`, `tie` en `coat`.
- De personages worden getekend in `src/gfx/CharacterFactory.js` (Animal Crossing-stijl, met
  voor-, zij- en achteraanzicht en meerdere gezichtsuitdrukkingen).

## Leaderboard (gedeeld via Supabase)

Zonder instellingen bewaart het spel de scores alleen op het eigen apparaat. Met een gratis
[Supabase](https://supabase.com)-project ziet iedereen elkaars scores.

De scores komen in de gedeelde tabel **`app_data`** (`app = 'OnboardingDG'`, `key = 'leaderboard'`,
de score als JSON in `value`). Die tabel kan ook door andere apps gebruikt worden.

1. Heb je de tabel `app_data` nog niet? Open in Supabase de **SQL Editor**, plak
   [`docs/supabase.sql`](docs/supabase.sql) en klik **Run**. Staat hij er al, sla dit dan over.
2. Ga naar **Project Settings → API** en kopieer de **Project URL** en de **anon public** key.
3. Vul ze in `src/config/leaderboard.js` in, tussen de aanhalingstekens (kan direct op GitHub via
   het potloodje):
   ```js
   const PROJECT_URL = 'https://abcdefgh.supabase.co';
   const ANON_KEY = 'eyJhbGciOi...';
   ```
   Zet hier **nooit** de `service_role`-key: de anon-key is bedoeld om publiek in een website te staan.
4. Commit naar `main`; na de deploy is het leaderboard gedeeld.

Goed om te weten:
- Geen internet? Dan toont het spel de scores van het eigen apparaat en verstuurt het je score
  later alsnog.
- Scores verwijderen (bijv. na een testronde) doe je in Supabase via **Table Editor → app_data**
  (filter op `app = OnboardingDG`).
- Omdat iedereen in `app_data` mag schrijven, toont het spel alleen geldige scores (naam tot 20
  tekens, score 0–20.000). Iemand die handig is kan wel een nepscore insturen; voor een teamuitje
  is dat meestal prima. Wijzigen of verwijderen kan niemand behalve de beheerder.
- Een gratis Supabase-project wordt na een week zonder gebruik gepauzeerd; met één klik zet je
  het weer aan.

## Voortgang

Voortgang (fragmenten, beste scores, speeltijd, avatar) wordt automatisch in de browser
opgeslagen. In het hoofdmenu kies je **Doorgaan** of **Nieuw spel**.

---

## Projectstructuur

```
src/
├─ main.js                 Phaser-configuratie en opstart
├─ content/nl.json         alle teksten
├─ config/brands.js        kleuren, logo's per bedrijf
├─ config/npcs.js          uiterlijk van vaste personages
├─ core/                   opslag, leaderboard, audio, besturing, effecten (juice)
├─ gfx/                    gegenereerde graphics (karakters, iconen, objecten)
├─ ui/                     knoppen, panelen, slepen/tikken
├─ world/                  plattegrond en terrein van het park
└─ scenes/
   ├─ BootScene, MenuScene, CharacterScene, WorldScene, HUDScene, DialogScene
   ├─ missions/            MissionBase (template) + één scène per missie
   ├─ FinaleScene, CreditsScene, LeaderboardScene
```

### Een missie toevoegen of aanpassen

Elke missie erft van `src/scenes/missions/MissionBase.js`. Die regelt de vaste flow:
intro-dialoog → uitlegscherm → aftellen → minigame → sterren → sleutelfragment → outro.
Een nieuwe missie implementeert minimaal `startGame()` en roept `this.finish()` aan als ze
klaar is. Score geef je met `this.addScore(punten, x, y)`; de sterdrempels staan in de
constructor (`thresholds`).

### Debug-snelkoppelingen

- `?debug=1&scene=BloeijMission` start direct een scène (ook `World`, `Finale`, `Credits`…).
- `&noaudio=1` schakelt geluid uit.

## Licentie & credits

Gemaakt voor intern gebruik binnen Driessen Groep. Fonts: Fredoka en Pirata One (SIL Open
Font License, meegeleverd via `@fontsource`).
