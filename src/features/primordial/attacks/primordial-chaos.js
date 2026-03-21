import { registerPrimordialAttack, rollDamage, applyDamageToTargets, applyHealToTargets } from "./base.js";

/**
 * PRIMORDIAL CHAOS — Remiel
 * 
 * "Sink into insanity..."
 * Song: Deja Reve — GG Magree
 * 
 * Effekt: Remiel reißt den Limbo kurz auf. Die Realität glitcht.
 * - Feinde: Psychic Damage (WIS Save, halber Schaden bei Erfolg)
 * - Verbündete: Temporary HP (Hitogamis Domäne tröstet statt richtet)
 * 
 * Damage Formula: 4d10 Psychic (skaliert: +1d10 pro 2 Charakterlevel über 4)
 * Temp HP: 2d6 + WIS Mod
 */

const SPELL_NAME = "Primordial Chaos";
const BASE_DAMAGE = "4d10";
const TEMP_HP_FORMULA = "2d6 + @abilities.wis.mod";
const SAVE_DC_BASE = 14; // TODO: Evtl. skalierend machen

export function registerPrimordialChaos() {
  registerPrimordialAttack(SPELL_NAME, async ({ workflow, actor, item, targets }) => {

    // Damage Roll
    const { total: damageTotal } = await rollDamage({
      actor,
      formula: BASE_DAMAGE,
      flavor: `${SPELL_NAME} — Psychic Damage`
    });

    // Temp HP Roll
    const rollData = actor.getRollData?.() ?? {};
    const tempHpRoll = await new Roll(TEMP_HP_FORMULA, rollData).evaluate();
    const tempHp = Math.max(0, tempHpRoll.total);

    await tempHpRoll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `DSR-EX | ${SPELL_NAME} — Temporary HP für Verbündete`
    });

    // Auf Feinde anwenden (alle targets gelten als Feinde)
    // TODO: Unterscheidung Freund/Feind via token.disposition
    if (targets.length) {
      await applyDamageToTargets(targets, damageTotal);
    }

    // Chat-Nachricht für den narrativen Effekt
    await ChatMessage.create({
      content: `<div style="text-align:center; padding:8px; border: 1px solid #666; border-radius:4px; background: linear-gradient(135deg, #1a1a2e, #16213e);">
        <div style="font-size:1.3em; font-weight:bold; color:#8888cc; text-shadow: 0 0 10px #8888cc;">
          ${SPELL_NAME}
        </div>
        <div style="color:#aaa; margin-top:4px; font-style:italic;">
          Die Realität reißt auf. Für einen Moment ist die Welt nicht die Welt.
          Geisterhafte Gesichter blicken aus den Rissen. Ein Kinderlachen hallt.
        </div>
        <div style="margin-top:8px; color:#ff8888;">
          Psychic Damage: ${damageTotal}
        </div>
        <div style="color:#88ccff;">
          Temp HP (Verbündete): ${tempHp}
        </div>
      </div>`,
      speaker: ChatMessage.getSpeaker({ actor })
    });
  });
}
