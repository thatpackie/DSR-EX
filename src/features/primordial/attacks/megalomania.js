import { rollDamage, applyDamageToTargets, whisperToGM } from "./base.js";
import { applyHpViaSocket } from "../../../utils/socket.js";

/**
 * MEGALOMANIA — Abaddon (Felix & Felicia)
 *
 * Zwei separate Angriffe mit identischer Mechanik aber eigenem Flavour/Cut-In.
 * Megalomania: Strike    — Felix   — "Bang."
 * Megalomania: Fusillade — Felicia — "Bäm."
 *
 * Economy:
 * Verfügbar wenn mindestens eine Primordial der Party in diesem Kampf
 * aktiviert wurde (megalomaniaUnlocked Flag auf game.combat).
 * Jede Attack ist 1× pro Encounter nutzbar (eigener Used-Flag auf game.combat).
 *
 * Mechanik:
 * - Ziel ≤ 25% HP → Instakill (HP direkt auf 0, bypassed Resistances)
 * - Ziel > 25% HP → 8d10 Force Fallback-Damage
 *
 * Legendary Creatures: DM-Entscheidung ob LR zum Überleben auf 1 HP genutzt wird.
 * Kein automatischer Schutz — Megalomania ignoriert Resistenzen.
 *
 * Flags auf game.combat (auto-reset bei deleteCombat):
 * - DSR-EX.megalomaniaUnlocked      — wird durch consumeEnergy() gesetzt
 * - DSR-EX.megalomaniaStrikeUsed    — wird nach Felix-Ausführung gesetzt
 * - DSR-EX.megalomaniaFusiladeUsed  — wird nach Felicia-Ausführung gesetzt
 */

// ─── Cut-In Configs ─────────────────────────────────────────────────────────

const FELIX_CUT_IN = {
  groupId: "",
  img: "assets/CharacterPortraits/CinematicPortraits/Felix_Megalomania.png",
  theme: "slash",
  customDuration: 4,
  hideBackground: false,
  localOnly: false,
  screenPosX: 50,
  screenPos: 50,
  charScale: 1.2,
  charOffsetX: 100,
  charOffsetY: 60,
  charRotation: 10,
  charMirror: false,
  text: "Megalomania",
  hideMainText: false,
  mainFontSize: 4,
  mainOffsetX: 0,
  mainOffsetY: 0,
  subText: "Strike",
  hideSubText: false,
  subFontSize: 1,
  subOffsetX: 0,
  subOffsetY: 0,
  fontFamily: "Modesto Condensed",
  fontBold: true,
  fontItalic: false,
  subFontFamily: "Modesto Condensed",
  subFontBold: true,
  subFontItalic: false,
  mainTextColor: "#000000",
  subTextColor: "#000000",
  color: "#a30013",
  borderWidth: 0,
  borderColor: "#ffffff",
  charShadowColor: "#000000",
  hideCharShadow: false,
  shakeIntensity: 5,
  dimIntensity: 0,
  soundList: { "0": "" },
  sfxList: { "0": "assets/AudioAssets/CutinAudio/Felix_Abaddon_Megalovania.m4a" },
  soundVolume: 80,
  sfxVolume: 80,
  keepAudioPlaying: true,
  audioOnly: false,
  presetName: "Felix_Megalomania",
  id: "yZXEsQtNqHBpjuqj",
  sound: "",
  sfx: "assets/AudioAssets/CutinAudio/Felix_Abaddon_Megalovania.m4a",
  actorId: "Actor.nWfgqGdKucuz9HIV"
};

const FELICIA_CUT_IN = {
  groupId: "",
  img: "assets/CharacterPortraits/CinematicPortraits/Felicia_Megalomania.png",
  theme: "slash",
  customDuration: 4,
  hideBackground: false,
  localOnly: false,
  screenPosX: 50,
  screenPos: 50,
  charScale: 1.2,
  charOffsetX: 100,
  charOffsetY: 60,
  charRotation: 10,
  charMirror: false,
  text: "Megalomania",
  hideMainText: false,
  mainFontSize: 4,
  mainOffsetX: 0,
  mainOffsetY: 0,
  subText: "Fusillade",
  hideSubText: false,
  subFontSize: 1,
  subOffsetX: 0,
  subOffsetY: 0,
  fontFamily: "Modesto Condensed",
  fontBold: true,
  fontItalic: false,
  subFontFamily: "Modesto Condensed",
  subFontBold: true,
  subFontItalic: false,
  mainTextColor: "#000000",
  subTextColor: "#000000",
  color: "#951d57",
  borderWidth: 0,
  borderColor: "#ffffff",
  charShadowColor: "#000000",
  hideCharShadow: false,
  shakeIntensity: 5,
  dimIntensity: 0,
  soundList: { "0": "" },
  sfxList: { "0": "assets/AudioAssets/CutinAudio/Felicia_Abaddon_Megalovania.m4a" },
  soundVolume: 80,
  sfxVolume: 80,
  keepAudioPlaying: true,
  audioOnly: false,
  presetName: "Felicia_Megalomania",
  id: "Wdj7485DrCwAY0tG",
  sound: "",
  sfx: "assets/AudioAssets/CutinAudio/Felicia_Abaddon_Megalovania.m4a",
  actorId: "Actor.9zS7lacMf6ByPsmK"
};

// ─── Helpers (lokale Kopien von base.js interna) ────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function playCutIn(config) {
  try {
    const cutInModule = game.modules.get("cinematic-cut-ins");
    if (!cutInModule?.api?.play) {
      console.warn("DSR-EX | Cinematic Cut-Ins Modul nicht gefunden.");
      return;
    }
    await cutInModule.api.play(config);
  } catch (err) {
    console.error("DSR-EX | Cut-In Fehler:", err);
  }
}

function isHostile(token) {
  if (!token.actor) return false;
  if (token.actor.type === "character") return false;
  const disp = token.document?.disposition ?? token.disposition;
  return disp !== CONST.TOKEN_DISPOSITIONS.FRIENDLY;
}

// ─── Kern-Mechanik ──────────────────────────────────────────────────────────

async function executeMegalomania({ workflow, actor, cutIn, flavor }) {
  // Unlock-Check: Primordial muss in diesem Kampf aktiviert worden sein
  const unlocked = game.combat?.getFlag("DSR-EX", "megalomaniaUnlocked") ?? false;
  if (!unlocked) {
    ui.notifications.warn(`DSR-EX | ${flavor.itemName} — Erst muss eine Primordial der Party aktiviert werden.`);
    return;
  }

  // Used-Check: 1× pro Encounter
  const alreadyUsed = game.combat?.getFlag("DSR-EX", flavor.usedFlag) ?? false;
  if (alreadyUsed) {
    ui.notifications.warn(`DSR-EX | ${flavor.itemName} — Bereits in diesem Kampf verwendet.`);
    return;
  }

  // Ziel ermitteln
  const targets = Array.from(workflow?.targets ?? []).filter(t => t?.actor);
  const enemies = targets.filter(t => isHostile(t));
  const target = enemies[0];

  if (!target) {
    ui.notifications.warn(`DSR-EX | ${flavor.itemName} — Kein feindliches Ziel gefunden.`);
    return;
  }

  // Als verwendet markieren — vor dem Cut-In, damit kein Race Condition entsteht
  if (game.combat) {
    await game.combat.setFlag("DSR-EX", flavor.usedFlag, true);
  }

  await whisperToGM(
    `DSR-EX | ${flavor.itemName} AKTIVIERT\nCaster: ${actor.name}\nZiel: ${target.name}`
  );

  // Cut-In abspielen
  await playCutIn(cutIn);
  await sleep(4000);

  // HP-Threshold prüfen
  const hp = target.actor.system.attributes.hp;
  const percent = hp.value / hp.max;
  const isExecute = percent <= 0.25;

  if (isExecute) {
    // ─── INSTAKILL ────────────────────────────────────────────────────────
    await applyHpViaSocket(target.actor, 0);
    await whisperToGM(
      `DSR-EX | ${flavor.itemName} — INSTAKILL: ${target.name} (${Math.round(percent * 100)}% HP)`
    );

    await ChatMessage.create({
      content: `
        <div style="
          text-align:center;
          padding:12px;
          border:1px solid ${flavor.borderColor};
          border-radius:6px;
          background: linear-gradient(135deg, ${flavor.bgFrom}, ${flavor.bgTo});
        ">
          <div style="font-size:1.5em; font-weight:bold; color:${flavor.titleColor}; text-shadow: 0 0 12px ${flavor.glowColor}; letter-spacing:2px;">
            ${flavor.itemName.toUpperCase()}
          </div>
          <div style="font-size:1.1em; color:${flavor.subtitleColor}; margin-top:2px; font-style:italic;">
            ${flavor.tagline}
          </div>
          <div style="margin-top:10px; color:#dddddd; font-size:0.95em;">
            ${flavor.instakillText}
          </div>
          <div style="margin-top:8px; font-size:1.2em; font-weight:bold; color:${flavor.titleColor};">
            ☠ ${target.name} — ELIMINATED ☠
          </div>
          <div style="margin-top:6px; color:#888; font-size:0.85em; font-style:italic;">
            ${flavor.signoff}
          </div>
        </div>`,
      speaker: ChatMessage.getSpeaker({ actor })
    });

  } else {
    // ─── FALLBACK DAMAGE ─────────────────────────────────────────────────
    const { total } = await rollDamage({
      actor,
      formula: "8d10",
      flavor: `${flavor.itemName} — Fallback (Ziel über 25% HP)`
    });
    await applyDamageToTargets([target], total);
    await whisperToGM(
      `DSR-EX | ${flavor.itemName} — FALLBACK: ${target.name} bei ${Math.round(percent * 100)}% HP, ${total} Schaden`
    );

    await ChatMessage.create({
      content: `
        <div style="
          text-align:center;
          padding:12px;
          border:1px solid ${flavor.borderColor};
          border-radius:6px;
          background: linear-gradient(135deg, ${flavor.bgFrom}, ${flavor.bgTo});
        ">
          <div style="font-size:1.5em; font-weight:bold; color:${flavor.titleColor}; text-shadow: 0 0 12px ${flavor.glowColor}; letter-spacing:2px;">
            ${flavor.itemName.toUpperCase()}
          </div>
          <div style="font-size:1.1em; color:${flavor.subtitleColor}; margin-top:2px; font-style:italic;">
            ${flavor.tagline}
          </div>
          <div style="margin-top:10px; color:#dddddd; font-size:0.95em;">
            ${flavor.fallbackText}
          </div>
          <div style="margin-top:8px; color:${flavor.titleColor}; font-size:1.1em;">
            ${target.name} — ${total} Schaden
          </div>
          <div style="margin-top:6px; color:#888; font-size:0.85em; font-style:italic;">
            ${flavor.signoff}
          </div>
        </div>`,
      speaker: ChatMessage.getSpeaker({ actor })
    });
  }
}

// ─── FELIX — Megalomania: Strike ────────────────────────────────────────────

const FELIX_FLAVOR = {
  itemName: "Megalomania: Strike",
  usedFlag: "megalomaniaStrikeUsed",
  tagline: "\"No Mercy.\"",
  instakillText: "Ein einzelner Strahl. Kein Lärm. Kein Ausweichen. Beshabas Pech — für den Feind.",
  fallbackText: "Der Ring leuchtet auf. Der Strahl trifft. Hart genug für einen Denkzettel.",
  signoff: "Bang.",
  titleColor: "#cc2200",
  subtitleColor: "#ff6644",
  glowColor: "#cc2200",
  bgFrom: "#1a0000",
  bgTo: "#2d0a0a",
  borderColor: "#a30013"
};

export function registerMegalomaniaStrike() {
  Hooks.on("midi-qol.RollComplete", async (workflow) => {
    try {
      const item = workflow?.item;
      const actor = workflow?.actor;
      if (!item || !actor) return;
      if ((item.name ?? "").trim() !== "Megalomania: Strike") return;
      if (!game.user.isGM) return;

      await executeMegalomania({
        workflow,
        actor,
        cutIn: FELIX_CUT_IN,
        flavor: FELIX_FLAVOR
      });

    } catch (err) {
      console.error("DSR-EX | Megalomania: Strike error", err);
    }
  });

  console.log("DSR-EX | Megalomania: Strike registriert");
}

// ─── FELICIA — Megalomania: Fusillade ───────────────────────────────────────

const FELICIA_FLAVOR = {
  itemName: "Megalomania: Fusillade",
  usedFlag: "megalomaniaFusiladeUsed",
  tagline: "\"Who's next?\"",
  instakillText: "Die Pip schießen. Alle auf einmal. Felicia schießt zuletzt. Tymoras Segen — ebenfalls für den Feind.",
  fallbackText: "Vierzehn Schüsse. Ein letzter. Nicht genug für den Kill — mehr als genug für den Eindruck.",
  signoff: "Bäm.",
  titleColor: "#cc1166",
  subtitleColor: "#ff66aa",
  glowColor: "#cc1166",
  bgFrom: "#1a0010",
  bgTo: "#2d0a1a",
  borderColor: "#951d57"
};

export function registerMegalomaniaFusillade() {
  Hooks.on("midi-qol.RollComplete", async (workflow) => {
    try {
      const item = workflow?.item;
      const actor = workflow?.actor;
      if (!item || !actor) return;
      if ((item.name ?? "").trim() !== "Megalomania: Fusillade") return;
      if (!game.user.isGM) return;

      await executeMegalomania({
        workflow,
        actor,
        cutIn: FELICIA_CUT_IN,
        flavor: FELICIA_FLAVOR
      });

    } catch (err) {
      console.error("DSR-EX | Megalomania: Fusillade error", err);
    }
  });

  console.log("DSR-EX | Megalomania: Fusillade registriert");
}
