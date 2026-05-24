import { MODULE_ID } from "../../settings.js";

const SETTING_KEY = "excessiveItemSetupComplete";

const EXCESSIVE_ITEMS = [
  {
    name: "Excessive Envy",
    type: "feat",
    img: "icons/magic/unholy/strike-hand-purple-red.webp",
    description: `<p><em>"I'll have your head."</em></p>
<p>Alexander lässt seine geballte Sünde los und zwingt jeden seiner Feinde in die Knie.</p>
<ul>
<li><strong>Feinde:</strong> WIS Save. Bei Misserfolg: <strong>Stunned</strong> für 1 Runde.</li>
</ul>`,
    // 30ft Sphere Template
    templateType: "sphere",
    templateSize: "30",
    rangeValue: "30"
  }
  // Weitere Excessive Items hier ergänzen
];

function randomId(length = 16) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

function buildActivity(def) {
  const id = randomId(16);
  return {
    [id]: {
      type: "utility",
      _id: id,
      sort: 0,
      name: def.name,
      activation: { type: "action", override: true, condition: "" },
      consumption: { scaling: { allowed: false }, spellSlot: false, targets: [] },
      description: { chatFlavor: def.name },
      duration: { units: "inst", concentration: false, override: false },
      effects: [],
      flags: {},
      range: { units: "ft", value: def.rangeValue ?? "30", override: true },
      target: {
        template: {
          contiguous: false,
          units: "ft",
          type: def.templateType ?? "sphere",
          size: def.templateSize ?? "30"
        },
        affects: { choice: false, type: "enemy", count: "", special: "" },
        override: true,
        prompt: true
      },
      uses: { spent: 0, recovery: [], max: "" },
      roll: { prompt: false, visible: false, name: "", formula: "" }
    }
  };
}

export async function ensureExcessiveItems() {
  if (!game.user.isGM) return;

  // Setup-Flag registrieren
  game.settings.register(MODULE_ID, SETTING_KEY, {
    scope: "world",
    config: false,
    type: Boolean,
    default: false
  });

  if (game.settings.get(MODULE_ID, SETTING_KEY)) {
    // Flag gesetzt — aber trotzdem prüfen ob Items wirklich da sind
    const allExist = EXCESSIVE_ITEMS.every(def => game.items.find(i => i.name === def.name));
    if (allExist) {
      console.log("DSR-EX | Excessive Items bereits erstellt, überspringe.");
      return;
    }
    // Items fehlen trotz gesetztem Flag — Setup erneut durchführen
    console.log("DSR-EX | Excessive Items fehlen trotz Setup-Flag — erstelle neu.");
    await game.settings.set(MODULE_ID, SETTING_KEY, false);
  }

  console.log("DSR-EX | Erstelle Excessive Attack Items...");

  for (const def of EXCESSIVE_ITEMS) {
    const existing = game.items.find(i => i.name === def.name);
    if (existing) {
      console.log(`DSR-EX | "${def.name}" existiert bereits.`);
      continue;
    }

    try {
      await Item.create({
        name: def.name,
        type: def.type,
        img: def.img,
        system: {
          description: { value: def.description, chat: "" },
          // Uses: 1 pro Encounter — in dnd5e: per "sr" (Short Rest) als nächster Wert
          uses: {
            value: 1,
            max: "1",
            recovery: [{ period: "sr", type: "recoverAll" }]
          },
          activities: buildActivity(def)
        }
      });
      console.log(`DSR-EX | "${def.name}" erstellt.`);
    } catch (err) {
      console.error(`DSR-EX | Fehler beim Erstellen von "${def.name}":`, err);
    }
  }

  await game.settings.set(MODULE_ID, SETTING_KEY, true);
  console.log("DSR-EX | Excessive Item-Setup abgeschlossen.");
}
