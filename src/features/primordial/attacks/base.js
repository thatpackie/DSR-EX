import { consumeEnergy, isReady, getEnergy } from "../energy.js";
import { MODULE_ID } from "../../../settings.js";
import { applyEffectViaSocket } from "../../../utils/socket.js";

/**
 * Shared base für alle Primordial Attacks.
 * 
 * Flow:
 * 1. midi-qol Hook feuert
 * 2. Item-Name matcht → Energy Check
 * 3. Energy < 100 → Abbruch mit Warnung, NICHTS passiert
 * 4. Energy = 100 →
 *      a. Energy konsumieren
 *      b. Cinematic Cut-In abspielen (falls konfiguriert)
 *      c. Warten bis Cut-In fertig (~5 Sek.)
 *      d. Attack-Logik ausführen (Damage, Heal, etc.)
 */
export function registerPrimordialAttack(config, executeAttack) {
  const spellName = typeof config === "string" ? config : config.name;
  const cutInConfig = typeof config === "object" ? config.cutIn : null;
  const cutInDelay = typeof config === "object" ? (config.cutInDelay ?? 5000) : 5000;

  Hooks.on("midi-qol.RollComplete", async (workflow) => {
    try {
      const item = workflow?.item;
      const actor = workflow?.actor;
      if (!item || !actor) return;
      if ((item.name ?? "").trim() !== spellName) return;

      // Genau ein Client verarbeitet den Hook:
      // Wenn ein aktiver, nicht-GM Spieler diesem Actor zugewiesen ist — nur dieser Spieler.
      // Sonst: nur der GM (z.B. bei NPCs oder wenn Spieler offline ist).
      const assignedPlayer = game.users.find(
        u => !u.isGM && u.active && u.character?.id === actor.id
      );
      if (assignedPlayer) {
        if (game.user.id !== assignedPlayer.id) return;
      } else {
        if (!game.user.isGM) return;
      }

      // Energy Check
      if (!isReady(actor)) {
        const current = getEnergy(actor);
        const max = game.settings.get(MODULE_ID, "maxEnergy");
        ui.notifications.warn(`${spellName}: Primordial Energy nicht voll (${current}/${max}).`);
        return;
      }

      // Alle Targets sammeln und nach Disposition aufteilen
      const allTargets = getTargets(workflow);
      const enemies = allTargets.filter(t => isHostile(t));
      const allies = allTargets.filter(t => isFriendly(t));

      // Energy konsumieren
      const consumed = await consumeEnergy(actor);
      if (!consumed) return;

      // GM-Whisper
      await whisperToGM(
        [
          `DSR-EX | ${spellName} AKTIVIERT`,
          `Caster: ${actor.name}`,
          `Feinde (${enemies.length}): ${enemies.map(t => t.name).join(", ") || "keine"}`,
          `Verbündete (${allies.length}): ${allies.map(t => t.name).join(", ") || "keine"}`
        ].join("\n")
      );

      // ─── Cinematic Cut-In ─────────────────────────────────────────
      if (cutInConfig) {
        await playCutIn(cutInConfig);
        await sleep(cutInDelay);
      }

      // ─── Attack-Logik ausführen ───────────────────────────────────
      await executeAttack({ workflow, actor, item, targets: allTargets, enemies, allies });

    } catch (err) {
      console.error(`DSR-EX | ${spellName} error`, err);
    }
  });

  console.log(`DSR-EX | Primordial Attack registriert: ${spellName}${cutInConfig ? " (mit Cut-In)" : ""}`);
}

// ─── Disposition Helpers ────────────────────────────────────────────────────

/**
 * Prüft ob ein Token ein Feind ist.
 * NPC + nicht Friendly Disposition = Feind.
 * Verhindert dass Friendly-NPCs (Begleiter) als Feinde gelten.
 */
function isHostile(token) {
  if (!token.actor) return false;
  if (token.actor.type === "character") return false;  // PCs sind nie Feinde
  const disp = token.document?.disposition ?? token.disposition;
  return disp !== CONST.TOKEN_DISPOSITIONS.FRIENDLY;
}

/**
 * Prüft ob ein Token ein Verbündeter ist.
 * PCs sind immer Verbündete.
 * Friendly-NPCs (Begleiter-NPCs) ebenfalls.
 */
function isFriendly(token) {
  if (!token.actor) return false;
  if (token.actor.type === "character") return true;  // PCs immer Verbündete
  const disp = token.document?.disposition ?? token.disposition;
  return disp === CONST.TOKEN_DISPOSITIONS.FRIENDLY;
}

// ─── Cinematic Cut-In ───────────────────────────────────────────────────────

async function playCutIn(config) {
  try {
    const cutInModule = game.modules.get("cinematic-cut-ins");
    if (!cutInModule?.api?.play) {
      console.warn("DSR-EX | Cinematic Cut-Ins Modul nicht gefunden oder API nicht verfügbar.");
      return;
    }
    await cutInModule.api.play(config);
    console.log("DSR-EX | Cut-In abgespielt.");
  } catch (err) {
    console.error("DSR-EX | Cut-In Fehler:", err);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Target Helpers ─────────────────────────────────────────────────────────

function getTargets(workflow) {
  const set = workflow?.targets;
  if (!set) return [];
  return Array.from(set).filter(t => t?.actor);
}

// ─── Damage / Heal ──────────────────────────────────────────────────────────

export async function rollDamage({ actor, formula, flavor }) {
  const rollData = actor.getRollData?.() ?? {};
  const roll = await new Roll(formula, rollData).evaluate();
  const total = Math.max(0, Number(roll.total ?? 0));

  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: `DSR-EX | ${flavor}`,
  });

  return { roll, total };
}

export async function applyDamageToTargets(targets, amount) {
  const { applyHpViaSocket } = await import("../../../utils/socket.js");
  const dmg = Math.max(0, Number(amount ?? 0));
  for (const t of targets) {
    const a = t.actor;
    const hp = a.system?.attributes?.hp;
    if (!hp) continue;
    await applyHpViaSocket(a, Math.max(0, hp.value - dmg));
  }
}

export async function applyHealToTargets(targets, amount) {
  const { applyHpViaSocket } = await import("../../../utils/socket.js");
  const heal = Math.max(0, Number(amount ?? 0));
  for (const t of targets) {
    const a = t.actor;
    const hp = a.system?.attributes?.hp;
    if (!hp) continue;
    await applyHpViaSocket(a, Math.min(hp.max, hp.value + heal));
  }
}

// ─── Token Image ────────────────────────────────────────────────────────────

/**
 * Ändert das Token-Bild eines Actors und speichert das Original als Flag.
 * Wird nach dem Cut-In aufgerufen, damit das Primordial-Bild sichtbar wird.
 */
export async function setTokenImg(actor, newImg) {
  const tokens = actor.getActiveTokens();
  if (!tokens.length) return;

  // Original sichern (vom ersten aktiven Token)
  const restoreImg = tokens[0].document.img;
  await actor.setFlag(MODULE_ID, "tokenImgRestore", restoreImg);

  for (const token of tokens) {
    await token.document.update({ img: newImg });
  }
}

/**
 * Stellt das originale Token-Bild wieder her.
 * Wird vom deleteActiveEffect-Hook aufgerufen.
 */
export async function restoreTokenImg(actor) {
  const restoreImg = actor.getFlag(MODULE_ID, "tokenImgRestore");
  if (!restoreImg) return;

  const tokens = actor.getActiveTokens();
  for (const token of tokens) {
    await token.document.update({ img: restoreImg });
  }
  await actor.unsetFlag(MODULE_ID, "tokenImgRestore");
}

/**
 * Erstellt einen reinen Visualisierungs-Effect ohne stat changes.
 * Wird für Attacks ohne eigenen Caster-Effekt verwendet (Chaos, Rage, Eclipse).
 * duration: in Runden (Standard: 1)
 */
export async function applyVisualEffect(actor, item, durationRounds = 1) {
  const effect = {
    name: "Primordial — Visuals",
    img: item.img,
    origin: item.uuid,
    duration: { rounds: durationRounds, startTime: game.time.worldTime },
    flags: { [MODULE_ID]: { primordialVisual: true, restoreTokenImg: true } },
    changes: []
  };
  await applyEffectViaSocket(actor, effect);
}

/**
 * Registriert den deleteActiveEffect-Hook für Token-Image-Restore.
 * Wird einmalig aus index.js aufgerufen.
 */
let _tokenHookRegistered = false;
export function registerTokenImageHooks() {
  if (_tokenHookRegistered) return;
  _tokenHookRegistered = true;

  Hooks.on("deleteActiveEffect", async (effect, options, userId) => {
    if (!game.user.isGM) return;
    if (!effect.flags?.[MODULE_ID]?.restoreTokenImg) return;
    const actor = effect.parent;
    if (!actor) return;
    await restoreTokenImg(actor);
  });

  console.log("DSR-EX | Token Image Hooks registriert");
}

// ─── GM Whisper ─────────────────────────────────────────────────────────────

export async function whisperToGM(text) {
  const whisperEnabled = game.settings.get(MODULE_ID, "gmWhisper");
  if (!whisperEnabled) return;

  const gms = game.users.filter(u => u.isGM && u.active);
  if (!gms.length) return;

  await ChatMessage.create({
    content: `<pre style="white-space:pre-wrap; font-size:0.85em;">${escapeHtml(text)}</pre>`,
    whisper: gms.map(u => u.id)
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
