import { consumeEnergy, isReady, getEnergy } from "../energy.js";
import { MODULE_ID } from "../../../settings.js";

/**
 * Shared base für alle Primordial Attacks.
 * 
 * Flow:
 * 1. midi-qol Hook feuert
 * 2. Item-Name matcht → Energy Check
 * 3. Energy < 100 → Abbruch mit Warnung
 * 4. Energy = 100 → Energy konsumieren
 * 5. Cinematic Cut-In abspielen (falls konfiguriert)
 * 6. Warten bis Cut-In fertig (~5 Sek.)
 * 7. Attack-Logik ausführen (Damage, Heal, etc.)
 * 
 * Usage:
 *   registerPrimordialAttack({
 *     name: "Primordial Chaos",
 *     cutIn: { ... },         // Cinematic Cut-In Config (optional)
 *     cutInDelay: 5000,       // ms Wartezeit nach Cut-In (default: 5000)
 *   }, async ({ workflow, actor, item, targets }) => {
 *     // Attack-Logik hier
 *   });
 */
export function registerPrimordialAttack(config, executeAttack) {
  // Config kann ein String (nur Name) oder ein Objekt sein
  const spellName = typeof config === "string" ? config : config.name;
  const cutInConfig = typeof config === "object" ? config.cutIn : null;
  const cutInDelay = typeof config === "object" ? (config.cutInDelay ?? 5000) : 5000;

  Hooks.on("midi-qol.RollComplete", async (workflow) => {
    try {
      const item = workflow?.item;
      const actor = workflow?.actor;
      if (!item || !actor) return;
      if ((item.name ?? "").trim() !== spellName) return;

      // Energy Check — bei < 100 passiert NICHTS (kein Roll, kein Chat)
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

      // ─── Cinematic Cut-In ─────────────────────────────────────────
      if (cutInConfig) {
        await playCutIn(cutInConfig);
        // Warten bis der Cut-In fertig ist
        await sleep(cutInDelay);
      }

      // ─── Attack-Logik ausführen ───────────────────────────────────
      await executeAttack({ workflow, actor, item, targets });

    } catch (err) {
      console.error(`DSR-EX | ${spellName} error`, err);
    }
  });

  console.log(`DSR-EX | Primordial Attack registriert: ${spellName}${cutInConfig ? " (mit Cut-In)" : ""}`);
}

// ─── Cinematic Cut-In ───────────────────────────────────────────────────────

/**
 * Spielt einen Cinematic Cut-In ab.
 * Nutzt die API von "Cinematic Cut-Ins" Modul.
 * 
 * @param {Object} config — Das komplette Config-Objekt für die Cut-In API.
 */
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

/**
 * Wartet eine bestimmte Anzahl Millisekunden.
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
