import { registerPrimordialAttack, rollDamage, applyDamageToTargets } from "./base.js";
import { applyEffectViaSocket } from "../../../utils/socket.js";

/**
 * PRIMORDIAL ZEAL — Elantir
 * 
 * "Quench the flames with blood."
 * Song: Tenebre Rosso Sangue — Keygen Church
 * 
 * Effekt: Göttliches Feuer, nicht von Tyr — von Elantirs eigenem Glauben.
 * Die Kathedrale wird zum Schlachtfeld. Glaube als physische Gewalt.
 * 
 * - Feinde: Radiant Damage
 * - Verbündete: AC-Buff (Schutzaura) + Temp HP
 * 
 * Damage Formula: 5d8 Radiant
 * Buff: +2 AC für 1 Minute, 1d8 + CHA Mod Temp HP
 */

const SPELL_NAME = "Primordial Zeal";
const DAMAGE_FORMULA = "5d8";
const TEMP_HP_ALLIES = "1d8 + @abilities.cha.mod";
const BUFF_AC = 2;
const BUFF_DURATION = 60; // Sekunden

export function registerPrimordialZeal() {
  registerPrimordialAttack(SPELL_NAME, async ({ workflow, actor, item, targets }) => {

    // Radiant Damage auf Feinde
    const { total: damageTotal } = await rollDamage({
      actor,
      formula: DAMAGE_FORMULA,
      flavor: `${SPELL_NAME} — Radiant Damage`
    });

    if (targets.length) {
      await applyDamageToTargets(targets, damageTotal);
    }

    // Temp HP Roll (für Verbündete — Chat-Info)
    const rollData = actor.getRollData?.() ?? {};
    const tempRoll = await new Roll(TEMP_HP_ALLIES, rollData).evaluate();
    const tempHp = Math.max(0, tempRoll.total);

    await tempRoll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `DSR-EX | ${SPELL_NAME} — Temp HP für Verbündete`
    });

    // AC-Buff als Active Effect auf den Caster selbst
    // (In-game manuell auf andere Verbündete kopierbar)
    const buffEffect = {
      name: "Primordial Zeal — Schutzaura",
      img: item.img ?? "icons/magic/holy/barrier-shield-winged-cross.webp",
      origin: item.uuid,
      duration: { seconds: BUFF_DURATION, startTime: game.time.worldTime },
      flags: { "DSR-EX": { primordialZealBuff: true } },
      changes: [
        { key: "system.attributes.ac.bonus", mode: 2, value: String(BUFF_AC), priority: 20 }
      ]
    };

    await applyEffectViaSocket(actor, buffEffect);

    await ChatMessage.create({
      content: `<div style="text-align:center; padding:8px; border: 1px solid #666; border-radius:4px; background: linear-gradient(135deg, #2e2a0a, #3e3108);">
        <div style="font-size:1.3em; font-weight:bold; color:#ffcc00; text-shadow: 0 0 10px #ffcc00;">
          ${SPELL_NAME}
        </div>
        <div style="color:#aaa; margin-top:4px; font-style:italic;">
          Göttliches Feuer umhüllt Elantir. Nicht von Tyr. Von ihm selbst.
          Seine Augen glühen golden. Die Orgel schreit. Die Kathedrale brennt.
        </div>
        <div style="margin-top:8px; color:#ffdd44;">
          Radiant Damage: ${damageTotal}
        </div>
        <div style="color:#88ff88;">
          Verbündete: +${BUFF_AC} AC (${BUFF_DURATION}s) | Temp HP: ${tempHp}
        </div>
      </div>`,
      speaker: ChatMessage.getSpeaker({ actor })
    });
  });
}
