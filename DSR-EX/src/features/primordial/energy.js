import { setEnergyViaSocket } from "../../utils/socket.js";
import { MODULE_ID } from "../../settings.js";

/**
 * Primordial Energy System
 * 
 * Energy wird als Actor-Flag gespeichert: flags.DSR-EX.primordialEnergy (0–100)
 * 
 * Aufladung:
 *   - Passiv: +passiveChargePerRound pro Kampfrunde (automatisch)
 *   - Bonus: Manuell durch DM via addBonusEnergy() oder Macro
 * 
 * Decay:
 *   - Nach Kampfende: -decayAfterCombat
 * 
 * Kein Rest-Reset: Short/Long Rest ändern nichts.
 */

// ─── Getter / Setter ────────────────────────────────────────────────────────

/**
 * Gibt die aktuelle Primordial Energy eines Actors zurück.
 */
export function getEnergy(actor) {
  return actor.getFlag("DSR-EX", "primordialEnergy") ?? 0;
}

/**
 * Setzt die Primordial Energy eines Actors (clamped auf 0–max).
 */
export async function setEnergy(actor, value) {
  const max = game.settings.get(MODULE_ID, "maxEnergy");
  const clamped = Math.max(0, Math.min(max, Math.round(value)));
  await setEnergyViaSocket(actor, clamped);
  return clamped;
}

/**
 * Gibt true zurück, wenn die Primordial Attack bereit ist.
 */
export function isReady(actor) {
  const max = game.settings.get(MODULE_ID, "maxEnergy");
  return getEnergy(actor) >= max;
}

/**
 * Konsumiert die volle Energy für eine Primordial Attack.
 * Gibt true zurück bei Erfolg, false wenn nicht genug Energy.
 */
export async function consumeEnergy(actor) {
  if (!isReady(actor)) return false;
  await setEnergy(actor, 0);
  await whisperToGM(`DSR-EX | ${actor.name}: Primordial Energy verbraucht (100 → 0)`);
  return true;
}

// ─── Charging ───────────────────────────────────────────────────────────────

/**
 * Fügt passive Charge zu allen PC-Combatants hinzu.
 * Wird automatisch bei Rundenwechsel aufgerufen.
 */
async function applyPassiveCharge(combat) {
  const amount = game.settings.get(MODULE_ID, "passiveChargePerRound");
  if (amount <= 0) return;

  for (const combatant of combat.combatants) {
    const actor = combatant.actor;
    if (!actor || actor.type !== "character") continue;

    const current = getEnergy(actor);
    const max = game.settings.get(MODULE_ID, "maxEnergy");
    if (current >= max) continue;

    const newValue = await setEnergy(actor, current + amount);
    await whisperToGM(`DSR-EX | ${actor.name}: Passive Charge +${amount} → ${newValue}/${max}`);

    // Benachrichtigung wenn Energy voll ist
    if (newValue >= max) {
      await notifyEnergyFull(actor);
    }
  }
}

/**
 * Fügt einem einzelnen Actor Bonus-Energy hinzu.
 * Für den DM: Aufrufbar via Macro oder manuell.
 * 
 * Macro-Beispiel:
 *   game.modules.get("DSR-EX").api.addBonusEnergy(token.actor, 20);
 */
export async function addBonusEnergy(actor, amount) {
  if (!actor) {
    ui.notifications.warn("DSR-EX | Kein Actor angegeben.");
    return;
  }

  const current = getEnergy(actor);
  const max = game.settings.get(MODULE_ID, "maxEnergy");
  const newValue = await setEnergy(actor, current + amount);

  await whisperToGM(`DSR-EX | ${actor.name}: Bonus Charge +${amount} → ${newValue}/${max}`);

  if (newValue >= max && current < max) {
    await notifyEnergyFull(actor);
  }

  return newValue;
}

/**
 * Setzt die Energy eines Actors direkt auf einen Wert.
 * Für den DM: Override für Sonderfälle.
 * 
 * Macro-Beispiel:
 *   game.modules.get("DSR-EX").api.setEnergyDirect(token.actor, 50);
 */
export async function setEnergyDirect(actor, value) {
  if (!actor) {
    ui.notifications.warn("DSR-EX | Kein Actor angegeben.");
    return;
  }

  const newValue = await setEnergy(actor, value);
  const max = game.settings.get(MODULE_ID, "maxEnergy");
  await whisperToGM(`DSR-EX | ${actor.name}: Energy gesetzt auf ${newValue}/${max}`);
  return newValue;
}

// ─── Decay ──────────────────────────────────────────────────────────────────

/**
 * Wendet Decay auf alle PC-Combatants an.
 * Wird automatisch bei Kampfende aufgerufen.
 */
async function applyDecay(combat) {
  const amount = game.settings.get(MODULE_ID, "decayAfterCombat");
  if (amount <= 0) return;

  for (const combatant of combat.combatants) {
    const actor = combatant.actor;
    if (!actor || actor.type !== "character") continue;

    const current = getEnergy(actor);
    if (current <= 0) continue;

    const newValue = await setEnergy(actor, current - amount);
    await whisperToGM(`DSR-EX | ${actor.name}: Decay -${amount} → ${newValue}/${game.settings.get(MODULE_ID, "maxEnergy")}`);
  }
}

// ─── Notifications ──────────────────────────────────────────────────────────

/**
 * Benachrichtigt alle, wenn ein Charakter volle Primordial Energy hat.
 */
async function notifyEnergyFull(actor) {
  // Chat-Nachricht für alle sichtbar
  await ChatMessage.create({
    content: `<div style="text-align:center; font-size:1.2em; font-weight:bold; color:#ff6600; text-shadow: 0 0 8px #ff6600;">
      ⚡ ${actor.name}: PRIMORDIAL BEREIT ⚡
    </div>`,
    speaker: ChatMessage.getSpeaker({ actor })
  });
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

/**
 * Registriert alle Combat-Hooks für automatisches Charging und Decay.
 */
export function registerEnergyHooks() {
  // Passive Charge bei Rundenwechsel
  Hooks.on("updateCombat", async (combat, update, options, userId) => {
    // Nur der GM prozessiert, um Doppelverarbeitung zu vermeiden
    if (!game.user.isGM) return;
    if (!game.settings.get(MODULE_ID, "primordialEnabled")) return;

    // Prüfe ob eine neue Runde begonnen hat
    if (update.round !== undefined && update.round > (combat._source?.round ?? 0)) {
      console.log(`DSR-EX | Neue Runde: ${update.round} — Passive Charge wird angewendet`);
      await applyPassiveCharge(combat);
    }
  });

  // Decay bei Kampfende
  Hooks.on("deleteCombat", async (combat, options, userId) => {
    if (!game.user.isGM) return;
    if (!game.settings.get(MODULE_ID, "primordialEnabled")) return;

    console.log("DSR-EX | Kampf beendet — Decay wird angewendet");
    await applyDecay(combat);
  });

  console.log("DSR-EX | Energy Hooks registriert");
}

// ─── GM Whisper Helper ──────────────────────────────────────────────────────

async function whisperToGM(text) {
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
