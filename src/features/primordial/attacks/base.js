import { consumeEnergy, isReady, getEnergy } from "../energy.js";
import { MODULE_ID } from "../../../settings.js";

/**
 * Shared base für alle Primordial Attacks.
 * 
 * Registriert einen midi-qol Hook, der:
 * 1. Auf den Item-Namen matcht
 * 2. Prüft ob Energy voll ist
 * 3. Energy konsumiert
 * 4. Die Attack-Logik ausführt
 * 
 * Usage:
 *   registerPrimordialAttack("Primordial Chaos", async ({ workflow, actor, item, targets }) => {
 *     // Attack-Logik hier
 *   });
 */
export function registerPrimordialAttack(spellName, executeAttack) {
  Hooks.on("midi-qol.RollComplete", async (workflow) => {
    try {
      const item = workflow?.item;
      const actor = workflow?.actor;
      if (!item || !actor) return;
      if ((item.name ?? "").trim() !== spellName) return;

      // Energy Check
      if (!isReady(actor)) {
        const current = getEnergy(actor);
        const max = game.settings.get(MODULE_ID, "maxEnergy");
        ui.notifications.warn(`${spellName}: Primordial Energy nicht voll (${current}/${max}).`);
        return;
      }

      // Targets sammeln
      const targets = getTargets(workflow);

      // Energy konsumieren
      const consumed = await consumeEnergy(actor);
      if (!consumed) return;

      // GM-Whisper: Attack genutzt
      await whisperToGM(
        [
          `DSR-EX | ${spellName} AKTIVIERT`,
          `Caster: ${actor.name}`,
          `Targets (${targets.length}): ${targets.map(t => t.name).join(", ") || "keine"}`
        ].join("\n")
      );

      // Attack-Logik ausführen
      await executeAttack({ workflow, actor, item, targets });

    } catch (err) {
      console.error(`DSR-EX | ${spellName} error`, err);
    }
  });

  console.log(`DSR-EX | Primordial Attack registriert: ${spellName}`);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTargets(workflow) {
  const set = workflow?.targets;
  if (!set) return [];
  return Array.from(set).filter(t => t?.actor);
}

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
