import { MODULE_ID } from "../../../settings.js";
import { applyEffectViaSocket } from "../../../utils/socket.js";

/**
 * Shared base für alle Excessive Attacks (Sin-Boss-Fähigkeiten).
 *
 * Unterschiede zu Primordial Attacks:
 * - Kein Energy-System (GM steuert NPC manuell)
 * - Immer GM-only (NPC hat keinen zugewiesenen Spieler)
 * - WIS Save für Feinde, Effekte auf Failures
 * - Uses: 1/Encounter (recharges on SR als nächstbester Wert)
 *
 * Flow:
 * 1. GM platziert Template, Item feuert
 * 2. midi-qol.RollComplete Hook
 * 3. Cut-In abspielen
 * 4. WIS Saves rollen (für alle Feinde in Targets)
 * 5. Effekte auf Failures anwenden
 */
export function registerExcessiveAttack(config, executeAttack) {
  const attackName = typeof config === "string" ? config : config.name;
  const cutInConfig = typeof config === "object" ? config.cutIn : null;
  const cutInDelay = typeof config === "object" ? (config.cutInDelay ?? 5000) : 5000;

  Hooks.on("midi-qol.RollComplete", async (workflow) => {
    // Excessive Attacks werden immer vom GM verarbeitet
    if (!game.user.isGM) return;

    try {
      const item = workflow?.item;
      const actor = workflow?.actor;
      if (!item || !actor) return;
      if ((item.name ?? "").trim() !== attackName) return;

      const targets = getTargets(workflow);

      // GM-Whisper
      await whisperToGM([
        `DSR-EX | EXCESSIVE ATTACK: ${attackName}`,
        `Caster: ${actor.name}`,
        `Targets (${targets.length}): ${targets.map(t => t.name).join(", ") || "keine"}`
      ].join("\n"));

      // ─── Cinematic Cut-In ────────────────────────────────────────
      if (cutInConfig) {
        await playCutIn(cutInConfig);
        await sleep(cutInDelay);
      }

      // ─── Attack-Logik ausführen ──────────────────────────────────
      await executeAttack({ workflow, actor, item, targets });

    } catch (err) {
      console.error(`DSR-EX | Excessive Attack "${attackName}" error:`, err);
    }
  });

  console.log(`DSR-EX | Excessive Attack registriert: ${attackName}${cutInConfig ? " (mit Cut-In)" : ""}`);
}

// ─── Save Helpers ───────────────────────────────────────────────────────────

/**
 * Rollt einen WIS Saving Throw für einen einzelnen Actor.
 * Postet das Ergebnis in den Chat (für alle sichtbar).
 * Gibt { roll, success } zurück.
 *
 * @param {Actor} actor     - Der Würfelnde
 * @param {number} dc       - Schwierigkeitsgrad
 * @param {string} flavor   - Chat-Beschriftung
 */
export async function rollWisSave(targetActor, dc, flavor = "WIS Saving Throw") {
  // getRollData() gibt garantiert flache Numbers — verhindert [object Object] in der Formel
  const rollData = targetActor.getRollData?.() ?? {};
  const wisBonus = Number(rollData.abilities?.wis?.save ?? 0);
  const safeBonus = Number.isFinite(wisBonus) ? wisBonus : 0;
  const sign = safeBonus >= 0 ? "+" : "-";
  const formula = `1d20 ${sign} ${Math.abs(safeBonus)}`;

  const roll = await new Roll(formula).evaluate();
  const success = roll.total >= dc;

  // ChatMessage.create mit rolls[] ist der zuverlässige Weg in Foundry v13
  await ChatMessage.create({
    rolls: [roll],
    speaker: ChatMessage.getSpeaker({ actor: targetActor }),
    flavor: `${flavor} (DC ${dc}) — ${success ? "✅ Erfolg" : "❌ Misserfolg"}`,
    rollMode: CONST.DICE_ROLL_MODES.PUBLIC,
    flags: { "DSR-EX": { saveRoll: true, dc, success } }
  });

  console.log(`DSR-EX | ${targetActor.name} WIS Save: ${roll.total} vs DC ${dc} — ${success ? "Erfolg" : "Fail"}`);
  return { roll, success };
}

/**
 * Wendet den Stunned-Status auf einen Actor an.
 * @param {Actor} targetActor
 * @param {Item} sourceItem   - Für origin-Tracking
 * @param {number} rounds     - Dauer in Runden (Standard: 1)
 */
export async function applyStunned(targetActor, sourceItem, rounds = 1) {
  const stunEffect = {
    name: "Stunned — Excessive Envy",
    img: "icons/svg/daze.svg",
    origin: sourceItem.uuid,
    duration: { rounds, startTime: game.time.worldTime },
    statuses: ["stunned"],
    flags: { [MODULE_ID]: { excessiveStun: true } },
    changes: []
  };
  await applyEffectViaSocket(targetActor, stunEffect);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTargets(workflow) {
  const set = workflow?.targets;
  if (!set) return [];
  return Array.from(set).filter(t => t?.actor);
}

async function playCutIn(config) {
  try {
    const mod = game.modules.get("cinematic-cut-ins");
    if (!mod?.api?.play) {
      console.warn("DSR-EX | Cinematic Cut-Ins nicht gefunden.");
      return;
    }
    await mod.api.play(config);
    console.log("DSR-EX | Excessive Cut-In abgespielt.");
  } catch (err) {
    console.error("DSR-EX | Cut-In Fehler:", err);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function whisperToGM(text) {
  const gms = game.users.filter(u => u.isGM && u.active);
  if (!gms.length) return;
  await ChatMessage.create({
    content: `<pre style="font-size:0.85em; white-space:pre-wrap;">${text}</pre>`,
    whisper: gms.map(u => u.id)
  });
}
