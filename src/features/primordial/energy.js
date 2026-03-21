import { setEnergyViaSocket } from "../../utils/socket.js";
import { MODULE_ID } from "../../settings.js";

/**
 * Primordial Energy System
 * 
 * Energy wird als Actor-Flag gespeichert: flags.DSR-EX.primordialEnergy (0–100)
 */

// Tracking der letzten bekannten Runde, um Rundenwechsel zu erkennen
let lastKnownRound = 0;

// ─── Getter / Setter ────────────────────────────────────────────────────────

export function getEnergy(actor) {
  return actor.getFlag("DSR-EX", "primordialEnergy") ?? 0;
}

export async function setEnergy(actor, value) {
  const max = game.settings.get(MODULE_ID, "maxEnergy");
  const clamped = Math.max(0, Math.min(max, Math.round(value)));
  await setEnergyViaSocket(actor, clamped);
  return clamped;
}

export function isReady(actor) {
  const max = game.settings.get(MODULE_ID, "maxEnergy");
  return getEnergy(actor) >= max;
}

export async function consumeEnergy(actor) {
  if (!isReady(actor)) return false;
  await setEnergy(actor, 0);
  await whisperToGM(`DSR-EX | ${actor.name}: Primordial Energy verbraucht (100 → 0)`);
  return true;
}

// ─── Charging ───────────────────────────────────────────────────────────────

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

    if (newValue >= max) {
      await notifyEnergyFull(actor);
    }
  }
}

// ─── Bonus Energy (DM Macro API) ───────────────────────────────────────────

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

async function notifyEnergyFull(actor) {
  await ChatMessage.create({
    content: `<div style="text-align:center; font-size:1.2em; font-weight:bold; color:#ff6600; text-shadow: 0 0 8px #ff6600;">
      ⚡ ${actor.name}: PRIMORDIAL BEREIT ⚡
    </div>`,
    speaker: ChatMessage.getSpeaker({ actor })
  });
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

export function registerEnergyHooks() {
  // Passive Charge bei Rundenwechsel
  Hooks.on("updateCombat", async (combat, update, options, userId) => {
    if (!game.user.isGM) return;
    if (!game.settings.get(MODULE_ID, "primordialEnabled")) return;

    // Prüfe ob sich die Runde geändert hat
    // update.round existiert NUR wenn sich die Runde tatsächlich geändert hat
    if (update.round === undefined) return;

    const newRound = update.round;

    // Runde 0→1 ist Kampfbeginn, ab Runde 2+ ist es ein Rundenwechsel
    // Wir chargen ab Runde 2 (= nach der ersten vollen Runde)
    if (newRound <= 1) {
      lastKnownRound = newRound;
      console.log(`DSR-EX | Kampf gestartet (Runde ${newRound}) — noch kein Charge`);
      return;
    }

    // Nur chargen wenn die Runde vorwärts ging (nicht bei Rückwärts-Korrektur)
    if (newRound <= lastKnownRound) {
      lastKnownRound = newRound;
      return;
    }

    lastKnownRound = newRound;
    console.log(`DSR-EX | Neue Runde: ${newRound} — Passive Charge wird angewendet`);
    await applyPassiveCharge(combat);
  });

  // Reset des Round-Trackers bei Kampfbeginn
  Hooks.on("createCombat", () => {
    lastKnownRound = 0;
    console.log("DSR-EX | Neuer Kampf — Round-Tracker zurückgesetzt");
  });

  // Decay bei Kampfende
  Hooks.on("deleteCombat", async (combat, options, userId) => {
    if (!game.user.isGM) return;
    if (!game.settings.get(MODULE_ID, "primordialEnabled")) return;

    lastKnownRound = 0;
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
