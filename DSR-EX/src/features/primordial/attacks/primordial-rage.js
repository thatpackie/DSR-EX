import { registerPrimordialAttack, rollDamage, applyDamageToTargets } from "./base.js";

/**
 * PRIMORDIAL RAGE — Pyraxis
 * 
 * "AAAAAAAAAH!"
 * Song: Never Surrender — Combichrist
 * 
 * Effekt: Der Splitter von Kossuth entfesselt sich vollständig.
 * Feuerflügel, glühendes Loch in der Brust, totaler Kontrollverlust.
 * 
 * - ALLE Kreaturen im AOE (inkl. Verbündete!) nehmen Fire Damage
 * - Pyraxis erhält Temporary HP (die Wut schützt ihn)
 * 
 * Damage Formula: 6d8 Fire (AOE, keine Unterscheidung Freund/Feind)
 * Temp HP: 2d8 + CON Mod auf Pyraxis
 */

const SPELL_NAME = "Primordial Rage";
const DAMAGE_FORMULA = "6d8";
const SELF_TEMP_HP = "2d8 + @abilities.con.mod";

export function registerPrimordialRage() {
  registerPrimordialAttack(SPELL_NAME, async ({ workflow, actor, item, targets }) => {

    // Fire Damage — trifft ALLE targets ohne Unterscheidung
    const { total: damageTotal } = await rollDamage({
      actor,
      formula: DAMAGE_FORMULA,
      flavor: `${SPELL_NAME} — Fire Damage (ALLE im AOE)`
    });

    if (targets.length) {
      await applyDamageToTargets(targets, damageTotal);
    }

    // Temp HP für Pyraxis selbst
    const rollData = actor.getRollData?.() ?? {};
    const tempRoll = await new Roll(SELF_TEMP_HP, rollData).evaluate();
    const tempHp = Math.max(0, tempRoll.total);

    // Temp HP auf Actor setzen
    await actor.update({ "system.attributes.hp.temp": tempHp });

    await tempRoll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `DSR-EX | ${SPELL_NAME} — Temp HP (Kossuth's Wut)`
    });

    await ChatMessage.create({
      content: `<div style="text-align:center; padding:8px; border: 1px solid #666; border-radius:4px; background: linear-gradient(135deg, #2e1a0a, #3e1608);">
        <div style="font-size:1.3em; font-weight:bold; color:#ff4400; text-shadow: 0 0 10px #ff4400;">
          ${SPELL_NAME}
        </div>
        <div style="color:#aaa; margin-top:4px; font-style:italic;">
          Feuerflügel brechen aus seinem Rücken. Dort, wo sein Herz sein sollte,
          brennt ein Loch aus reiner Wut. Alles in seiner Nähe verbrennt.
        </div>
        <div style="margin-top:8px; color:#ff6644;">
          Fire Damage (ALLE): ${damageTotal}
        </div>
        <div style="color:#ffaa44;">
          ⚠ Trifft auch Verbündete im Wirkbereich!
        </div>
      </div>`,
      speaker: ChatMessage.getSpeaker({ actor })
    });
  });
}
