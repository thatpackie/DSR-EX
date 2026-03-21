import { registerPrimordialAttack, rollDamage, applyDamageToTargets, applyHealToTargets } from "./base.js";

/**
 * PRIMORDIAL ECLIPSE — Theia (Selene)
 * 
 * "I won't hold back anymore."
 * Song: A Stranger I Remain — Free Dominguez
 * 
 * Effekt: Luna manifestiert sich als geisterhafter Mondkörper hinter Theia.
 * Aasimar-Flügel breiten sich aus. Theia und Luna verschmelzen.
 * 
 * - Feinde: Radiant + Psychic Damage
 * - Verbündete: Heilung
 * 
 * Damage Formula: 3d8 Radiant + 2d8 Psychic
 * Heal Formula: 3d8 + WIS Mod
 */

const SPELL_NAME = "Primordial Eclipse";
const DAMAGE_RADIANT = "3d8";
const DAMAGE_PSYCHIC = "2d8";
const HEAL_FORMULA = "3d8 + @abilities.wis.mod";

export function registerPrimordialEclipse() {
  registerPrimordialAttack(SPELL_NAME, async ({ workflow, actor, item, targets }) => {

    // Radiant Damage
    const { total: radiantTotal } = await rollDamage({
      actor,
      formula: DAMAGE_RADIANT,
      flavor: `${SPELL_NAME} — Radiant Damage`
    });

    // Psychic Damage
    const { total: psychicTotal } = await rollDamage({
      actor,
      formula: DAMAGE_PSYCHIC,
      flavor: `${SPELL_NAME} — Psychic Damage`
    });

    const totalDamage = radiantTotal + psychicTotal;

    // Feinde: Damage
    if (targets.length) {
      await applyDamageToTargets(targets, totalDamage);
    }

    // Heal Roll (für Verbündete — manuell vom DM zuzuweisen)
    const rollData = actor.getRollData?.() ?? {};
    const healRoll = await new Roll(HEAL_FORMULA, rollData).evaluate();
    const healTotal = Math.max(0, healRoll.total);

    await healRoll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `DSR-EX | ${SPELL_NAME} — Heilung für Verbündete`
    });

    await ChatMessage.create({
      content: `<div style="text-align:center; padding:8px; border: 1px solid #666; border-radius:4px; background: linear-gradient(135deg, #0a1a2e, #0e1e3e);">
        <div style="font-size:1.3em; font-weight:bold; color:#88aaff; text-shadow: 0 0 10px #88aaff;">
          ${SPELL_NAME}
        </div>
        <div style="color:#aaa; margin-top:4px; font-style:italic;">
          Mondlicht bricht durch die Dunkelheit. Hinter Theia erhebt sich Luna —
          nicht als Erinnerung, sondern als Wesen. Geflügelt, leuchtend, schreiend.
          Sie hält nicht mehr zurück.
        </div>
        <div style="margin-top:8px; color:#aaccff;">
          Radiant Damage: ${radiantTotal} | Psychic Damage: ${psychicTotal}
        </div>
        <div style="color:#88ff88;">
          Heilung (Verbündete): ${healTotal}
        </div>
      </div>`,
      speaker: ChatMessage.getSpeaker({ actor })
    });
  });
}
