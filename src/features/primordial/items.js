import { MODULE_ID } from "../../settings.js";

/**
 * Primordial Attack Item-Definitionen.
 * 
 * Items nutzen das dnd5e v4.x Activity-System.
 * Jedes Item hat eine einzige "utility"-Activity, die den midi-qol Hook triggert.
 * Die eigentliche Damage/Heal-Logik liegt in den Attack-JS-Dateien.
 */

function randomId(length = 16) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function buildUtilityActivity(overrides = {}) {
  const id = randomId(16);
  return {
    [id]: {
      type: "utility",
      _id: id,
      sort: 0,
      activation: {
        type: "action",
        override: true,
        condition: ""
      },
      consumption: {
        scaling: { allowed: false },
        spellSlot: false,
        targets: []
      },
      description: { chatFlavor: overrides.chatFlavor ?? "" },
      duration: {
        units: "inst",
        concentration: false,
        override: false
      },
      effects: [],
      flags: {},
      range: {
        units: overrides.rangeUnits ?? "ft",
        value: overrides.rangeValue ?? "",
        override: true
      },
      target: {
        template: {
          contiguous: false,
          units: "ft",
          type: overrides.templateType ?? "",
          size: overrides.templateSize ?? "",
          width: overrides.templateWidth ?? ""
        },
        affects: {
          choice: false,
          type: overrides.targetType ?? "any",
          count: overrides.targetCount ?? "",
          special: ""
        },
        override: true,
        prompt: true
      },
      uses: {
        spent: 0,
        recovery: [],
        max: ""
      },
      roll: {
        prompt: false,
        visible: false,
        name: "",
        formula: ""
      },
      name: overrides.activityName ?? ""
    }
  };
}

const PRIMORDIAL_ITEMS = [
  {
    name: "Primordial Chaos",
    type: "feat",
    img: "icons/magic/unholy/barrier-fire-pink.webp",
    // Sphere, 30 ft Radius
    system: {
      description: {
        value: `<p><strong>Primordial Chaos</strong> — Remiel</p>
<p><em>"Sink into insanity..."</em></p>
<p>Remiel reißt den Limbo kurz auf. Die Realität glitcht.</p>
<ul>
<li><strong>Feinde:</strong> 4d10 Psychic Damage</li>
<li><strong>Verbündete:</strong> 2d6 + WIS Mod Temporary HP</li>
</ul>
<p><em>Benötigt: 100 Primordial Energy</em></p>`,
        chat: ""
      },
      activation: { type: "action", condition: "" },
      duration: { units: "inst" },
      range: { units: "ft", value: "30", special: "" },
      target: {
        template: { contiguous: false, units: "ft", type: "" },
        affects: { choice: false, type: "any", count: "", special: "" }
      },
      uses: { spent: 0, recovery: [], max: "" }
    },
    activityOverrides: {
      chatFlavor: "Primordial Chaos — Sink into insanity...",
      rangeUnits: "ft",
      rangeValue: "30",
      templateType: "sphere",
      templateSize: "30",
      targetType: "any"
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
<p>Der Splitter von Kossuth entfesselt sich vollständig.</p>
<ul>
<li><strong>ALLE im AOE:</strong> 6d8 Fire Damage (inkl. Verbündete!)</li>
<li><strong>Pyraxis:</strong> 2d8 + CON Mod Temp HP</li>
</ul>
<p><em>Benötigt: 100 Primordial Energy</em></p>`,
        chat: ""
      },
      activation: { type: "action", condition: "" },
      duration: { units: "inst" },
      range: { units: "ft", value: "20", special: "" },
      target: {
        template: { contiguous: false, units: "ft", type: "" },
        affects: { choice: false, type: "any", count: "", special: "" }
      },
      uses: { spent: 0, recovery: [], max: "" }
    },
    activityOverrides: {
      chatFlavor: "Primordial Rage — AAAAAAAAAH!",
      rangeUnits: "ft",
      rangeValue: "30",
      templateType: "cone",
      templateSize: "30",   // Länge der Cone in ft
      targetType: "any"
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
<p>Luna manifestiert sich hinter Theia. Aasimar-Flügel breiten sich aus.</p>
<ul>
<li><strong>Feinde:</strong> 3d8 Radiant + 2d8 Psychic Damage</li>
<li><strong>Verbündete:</strong> 3d8 + WIS Mod Heilung</li>
</ul>
<p><em>Benötigt: 100 Primordial Energy</em></p>`,
        chat: ""
      },
      activation: { type: "action", condition: "" },
      duration: { units: "inst" },
      range: { units: "ft", value: "30", special: "" },
      target: {
        template: { contiguous: false, units: "ft", type: "" },
        affects: { choice: false, type: "any", count: "", special: "" }
      },
      uses: { spent: 0, recovery: [], max: "" }
    },
    activityOverrides: {
      chatFlavor: "Primordial Eclipse — I won't hold back anymore.",
      rangeUnits: "ft",
      rangeValue: "30",
      templateType: "sphere",
      templateSize: "30",
      targetType: "any"
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
<p>Göttliches Feuer — nicht von Tyr. Von Elantir selbst.</p>
<ul>
<li><strong>Feinde:</strong> 5d8 Radiant Damage</li>
<li><strong>Verbündete:</strong> +2 AC (1 Minute) + 1d8 + CHA Mod Temp HP</li>
</ul>
<p><em>Benötigt: 100 Primordial Energy</em></p>`,
        chat: ""
      },
      activation: { type: "action", condition: "" },
      duration: { units: "inst" },
      range: { units: "ft", value: "30", special: "" },
      target: {
        template: { contiguous: false, units: "ft", type: "" },
        affects: { choice: false, type: "any", count: "", special: "" }
      },
      uses: { spent: 0, recovery: [], max: "" }
    },
    activityOverrides: {
      chatFlavor: "Primordial Zeal — Quench the flames with blood.",
      rangeUnits: "ft",
      rangeValue: "30",
      templateType: "sphere",
      templateSize: "30",
      targetType: "any"
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
<p>Die Schatten schlagen zurück. Der Dolch trifft, bevor man ihn sieht.</p>
<ul>
<li><strong>Einzelziel:</strong> 4d10 Psychic + 3d8 Necrotic Damage</li>
<li><strong>Vaelorin:</strong> 1 Runde Invisible</li>
</ul>
<p><em>Benötigt: 100 Primordial Energy</em></p>`,
        chat: ""
      },
      activation: { type: "action", condition: "" },
      duration: { units: "inst" },
      range: { units: "ft", value: "60", special: "" },
      target: {
        template: { contiguous: false, units: "ft", type: "" },
        affects: { choice: false, type: "creature", count: "1", special: "" }
      },
      uses: { spent: 0, recovery: [], max: "" }
    },
    activityOverrides: {
      chatFlavor: "Primordial Vengeance — Time to reap.",
      rangeUnits: "ft",
      rangeValue: "60",
      // Kein Template — Einzelziel
      targetType: "creature",
      targetCount: "1"
    },
    flags: { "DSR-EX": { isPrimordialAttack: true, character: "Vaelorin" } }
  }
];

/**
 * Erstellt die Primordial Attack Items als World-Items mit korrekten Activities.
 */
export async function ensurePrimordialItems() {
  if (!game.user.isGM) return;

  const setupDone = game.settings.get(MODULE_ID, "itemSetupComplete");
  if (setupDone) return;

  console.log("DSR-EX | Erstelle Primordial Attack Items (v4.x Activity-Schema)...");

  let created = 0;
  for (const def of PRIMORDIAL_ITEMS) {
    const existing = game.items.find(i => i.name === def.name);
    if (existing) {
      console.log(`DSR-EX | Item "${def.name}" existiert bereits, überspringe.`);
      continue;
    }

    try {
      // Activity generieren und ins system.activities einsetzen
      const activity = buildUtilityActivity(def.activityOverrides ?? {});
      const itemData = {
        name: def.name,
        type: def.type,
        img: def.img,
        system: {
          ...def.system,
          activities: activity
        },
        flags: def.flags
      };

      await Item.create(itemData);
      console.log(`DSR-EX | Item "${def.name}" erstellt mit Activity.`);
      created++;
    } catch (err) {
      console.error(`DSR-EX | Fehler beim Erstellen von "${def.name}":`, err);
    }
  }

  // itemSetupComplete wird erst gesetzt wenn alles durchgelaufen ist
  await game.settings.set(MODULE_ID, "itemSetupComplete", true);

  if (created > 0) {
    ui.notifications.info(`DSR-EX | ${created} Primordial Attack Item(s) erstellt.`);
  }

  console.log("DSR-EX | Item-Setup abgeschlossen.");
}
