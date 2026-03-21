import { registerPrimordialAttack, rollDamage, applyDamageToTargets } from "./base.js";

/**
 * PRIMORDIAL VENGEANCE — Vaelorin
 * 
 * "Time to reap."
 * Song: Crimson Cloud — Jeff Rona
 * 
 * Effekt: Die Schatten schlagen zurück. Vaelorin tritt aus der Dunkelheit
 * als etwas, das keine Schatten mehr wirft — sondern Schatten IST.
 * Violettes Feuer, brennender Dolch, reine Vergeltung.
 * 
 * - Single Target: Massiver Psychic + Necrotic Burst
 * - Bonus: Vaelorin wird für 1 Runde Invisible (Schatten verschlucken ihn)
 * 
 * Damage Formula: 4d10 Psychic + 3d8 Necrotic (Single Target)
 */

const SPELL_NAME = "Primordial Vengeance";
const DAMAGE_PSYCHIC = "4d10";
const DAMAGE_NECROTIC = "3d8";

export function registerPrimordialVengeance() {
  registerPrimordialAttack(SPELL_NAME, async ({ workflow, actor, item, targets }) => {

    // Single Target — nur das erste Ziel
    const target = targets[0];

    // Psychic Damage
    const { total: psychicTotal } = await rollDamage({
      actor,
      formula: DAMAGE_PSYCHIC,
      flavor: `${SPELL_NAME} — Psychic Damage`
    });

    // Necrotic Damage
    const { total: necroticTotal } = await rollDamage({
      actor,
      formula: DAMAGE_NECROTIC,
      flavor: `${SPELL_NAME} — Necrotic Damage`
    });

    const totalDamage = psychicTotal + necroticTotal;

    // Damage anwenden (nur erstes Target)
    if (target) {
      await applyDamageToTargets([target], totalDamage);
    }

    // Invisibility Hinweis (manuell zu setzen oder via Condition)
    // Foundry v13: Invisible Condition als StatusEffect
    try {
      const invisEffect = {
        name: "Primordial Vengeance — Schatten",
        img: "icons/magic/perception/shadow-stealth-eyes-purple.webp",
        origin: item.uuid,
        duration: { rounds: 1, startTime: game.time.worldTime },
        flags: { "DSR-EX": { primordialVengeanceShadow: true } },
        statuses: ["invisible"]
      };

      const { applyEffectViaSocket } = await import("../../../utils/socket.js");
      await applyEffectViaSocket(actor, invisEffect);
    } catch (err) {
      console.warn("DSR-EX | Invisibility-Effekt konnte nicht gesetzt werden:", err);
    }

    await ChatMessage.create({
      content: `<div style="text-align:center; padding:8px; border: 1px solid #666; border-radius:4px; background: linear-gradient(135deg, #1a0a2e, #200e3e);">
        <div style="font-size:1.3em; font-weight:bold; color:#aa44ff; text-shadow: 0 0 10px #aa44ff;">
          ${SPELL_NAME}
        </div>
        <div style="color:#aaa; margin-top:4px; font-style:italic;">
          Die Schatten gehorchen nicht mehr der Dunkelheit. Sie gehorchen ihm.
          Violettes Feuer frisst sich durch die Luft. Der Dolch trifft, bevor man ihn sieht.
          Vaelorin verschwindet — und was bleibt, ist nur der Schmerz.
        </div>
        <div style="margin-top:8px; color:#cc88ff;">
          ${target ? `Ziel: ${target.name}` : "Kein Ziel"}
        </div>
        <div style="color:#ff88cc;">
          Psychic: ${psychicTotal} | Necrotic: ${necroticTotal} | Gesamt: ${totalDamage}
        </div>
        <div style="color:#aaaaff; margin-top:4px;">
          Vaelorin ist für 1 Runde Invisible.
        </div>
      </div>`,
      speaker: ChatMessage.getSpeaker({ actor })
    });
  });
}
