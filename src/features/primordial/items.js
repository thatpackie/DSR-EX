import { MODULE_ID } from "../../settings.js";

/**
 * Primordial Attack Item-Definitionen.
 * Diese werden beim ersten Laden automatisch als Compendium-Items erstellt,
 * falls sie noch nicht existieren.
 */

export const PRIMORDIAL_ITEMS = [
  {
    name: "Primordial Chaos",
    type: "feat",
    img: "icons/magic/unholy/barrier-fire-pink.webp",
    system: {
      description: {
        value: `<p><strong>Primordial Chaos</strong> — Remiel</p>
<p><em>"Sink into insanity..."</em></p>
<p>Remiel reißt den Limbo kurz auf. Die Realität glitcht. Geisterhafte Gesichter blicken aus den Rissen.</p>
<ul>
<li><strong>Feinde:</strong> 4d10 Psychic Damage</li>
<li><strong>Verbündete:</strong> 2d6 + WIS Mod Temporary HP</li>
</ul>
<p><em>Benötigt: 100 Primordial Energy (wird vollständig konsumiert)</em></p>`
      },
      activation: { type: "action", cost: 1 },
      target: { type: "creature", value: null },
      range: { value: 30, units: "ft" },
      uses: { value: null, max: "", per: "", recovery: "" },
      actionType: "save",
      save: { ability: "wis", dc: 14, scaling: "flat" },
      damage: { parts: [["4d10", "psychic"]] }
    },
    flags: { "DSR-EX": { isPrimordialAttack: true, character: "Remiel" } }
  },
  {
    name: "Primordial Rage",
    type: "feat",
    img: "icons/magic/fire/explosion-fireball-large-orange.webp",
    system: {
      description: {
        value: `<p><strong>Primordial Rage</strong> — Pyraxis</p>
<p><em>"AAAAAAAAAH!"</em></p>
<p>Der Splitter von Kossuth entfesselt sich vollständig. Feuerflügel brechen aus seinem Rücken. Alles in seiner Nähe verbrennt.</p>
<ul>
<li><strong>ALLE Kreaturen im AOE:</strong> 6d8 Fire Damage (inkl. Verbündete!)</li>
<li><strong>Pyraxis:</strong> 2d8 + CON Mod Temporary HP</li>
</ul>
<p><em>Benötigt: 100 Primordial Energy (wird vollständig konsumiert)</em></p>
<p><strong>⚠ Trifft auch Verbündete im Wirkbereich!</strong></p>`
      },
      activation: { type: "action", cost: 1 },
      target: { type: "creature", value: null },
      range: { value: 20, units: "ft" },
      uses: { value: null, max: "", per: "", recovery: "" },
      actionType: "save",
      save: { ability: "dex", dc: 14, scaling: "flat" },
      damage: { parts: [["6d8", "fire"]] }
    },
    flags: { "DSR-EX": { isPrimordialAttack: true, character: "Pyraxis" } }
  },
  {
    name: "Primordial Eclipse",
    type: "feat",
    img: "icons/magic/light/explosion-star-glow-silhouette.webp",
    system: {
      description: {
        value: `<p><strong>Primordial Eclipse</strong> — Theia</p>
<p><em>"I won't hold back anymore."</em></p>
<p>Luna manifestiert sich als geisterhafter Mondkörper hinter Theia. Aasimar-Flügel breiten sich aus. Sie hält nicht mehr zurück.</p>
<ul>
<li><strong>Feinde:</strong> 3d8 Radiant + 2d8 Psychic Damage</li>
<li><strong>Verbündete:</strong> 3d8 + WIS Mod Heilung</li>
</ul>
<p><em>Benötigt: 100 Primordial Energy (wird vollständig konsumiert)</em></p>`
      },
      activation: { type: "action", cost: 1 },
      target: { type: "creature", value: null },
      range: { value: 30, units: "ft" },
      uses: { value: null, max: "", per: "", recovery: "" },
      actionType: "save",
      save: { ability: "wis", dc: 14, scaling: "flat" },
      damage: { parts: [["3d8", "radiant"], ["2d8", "psychic"]] }
    },
    flags: { "DSR-EX": { isPrimordialAttack: true, character: "Theia" } }
  },
  {
    name: "Primordial Zeal",
    type: "feat",
    img: "icons/magic/holy/barrier-shield-winged-cross.webp",
    system: {
      description: {
        value: `<p><strong>Primordial Zeal</strong> — Elantir</p>
<p><em>"Quench the flames with blood."</em></p>
<p>Göttliches Feuer umhüllt Elantir. Nicht von Tyr. Von ihm selbst. Die Orgel schreit. Die Kathedrale brennt.</p>
<ul>
<li><strong>Feinde:</strong> 5d8 Radiant Damage</li>
<li><strong>Verbündete:</strong> +2 AC (1 Minute) + 1d8 + CHA Mod Temp HP</li>
</ul>
<p><em>Benötigt: 100 Primordial Energy (wird vollständig konsumiert)</em></p>`
      },
      activation: { type: "action", cost: 1 },
      target: { type: "creature", value: null },
      range: { value: 30, units: "ft" },
      uses: { value: null, max: "", per: "", recovery: "" },
      actionType: "save",
      save: { ability: "con", dc: 14, scaling: "flat" },
      damage: { parts: [["5d8", "radiant"]] }
    },
    flags: { "DSR-EX": { isPrimordialAttack: true, character: "Elantir" } }
  },
  {
    name: "Primordial Vengeance",
    type: "feat",
    img: "icons/magic/perception/shadow-stealth-eyes-purple.webp",
    system: {
      description: {
        value: `<p><strong>Primordial Vengeance</strong> — Vaelorin</p>
<p><em>"Time to reap."</em></p>
<p>Die Schatten schlagen zurück. Violettes Feuer frisst sich durch die Luft. Der Dolch trifft, bevor man ihn sieht.</p>
<ul>
<li><strong>Einzelziel:</strong> 4d10 Psychic + 3d8 Necrotic Damage</li>
<li><strong>Vaelorin:</strong> 1 Runde Invisible</li>
</ul>
<p><em>Benötigt: 100 Primordial Energy (wird vollständig konsumiert)</em></p>`
      },
      activation: { type: "action", cost: 1 },
      target: { type: "creature", value: 1 },
      range: { value: 60, units: "ft" },
      uses: { value: null, max: "", per: "", recovery: "" },
      actionType: "save",
      save: { ability: "wis", dc: 14, scaling: "flat" },
      damage: { parts: [["4d10", "psychic"], ["3d8", "necrotic"]] }
    },
    flags: { "DSR-EX": { isPrimordialAttack: true, character: "Vaelorin" } }
  }
];

/**
 * Erstellt die Primordial Attack Items als World-Items,
 * falls sie noch nicht existieren.
 * Wird einmalig beim ersten Laden aufgerufen.
 */
export async function ensurePrimordialItems() {
  // Nur GM erstellt Items
  if (!game.user.isGM) return;

  // Prüfe ob Setup bereits gelaufen ist
  const setupDone = game.settings.get(MODULE_ID, "itemSetupComplete");
  if (setupDone) return;

  console.log("DSR-EX | Erstelle Primordial Attack Items...");

  let created = 0;
  for (const itemData of PRIMORDIAL_ITEMS) {
    // Prüfe ob ein Item mit diesem Namen schon existiert
    const existing = game.items.find(i => i.name === itemData.name);
    if (existing) {
      console.log(`DSR-EX | Item "${itemData.name}" existiert bereits, überspringe.`);
      continue;
    }

    try {
      await Item.create(itemData);
      console.log(`DSR-EX | Item "${itemData.name}" erstellt.`);
      created++;
    } catch (err) {
      console.error(`DSR-EX | Fehler beim Erstellen von "${itemData.name}":`, err);
    }
  }

  // Markiere Setup als abgeschlossen
  await game.settings.set(MODULE_ID, "itemSetupComplete", true);

  if (created > 0) {
    ui.notifications.info(`DSR-EX | ${created} Primordial Attack Item(s) erstellt. Du findest sie unter Items → Primordial.`);
  }

  console.log("DSR-EX | Item-Setup abgeschlossen.");
}
