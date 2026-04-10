import { registerPrimordialAttack, rollDamage, applyDamageToTargets, applyHealToTargets, setTokenImg, applyVisualEffect } from "./base.js";

/**
 * PRIMORDIAL ECLIPSE — Theia (Selene)
 * "I won't hold back anymore."
 * 
 * Feinde: Radiant + Psychic Damage | Verbündete: Heilung
 */

const SPELL_NAME = "Primordial Eclipse";
const DAMAGE_RADIANT = "3d8";
const DAMAGE_PSYCHIC = "2d8";
const HEAL_FORMULA = "3d8 + @abilities.wis.mod";
const PRIMORDIAL_IMG = "assets/CharacterPortraits/CinematicPortraits/Theia_PrimordialEclipse.png";

const CUT_IN_CONFIG = {
  groupId: "",
  img: "assets/CharacterPortraits/CinematicPortraits/Theia_Cutin.png",
  theme: "slash",
  customDuration: 5,
  hideBackground: false,
  screenPosX: 50,
  screenPos: 50,
  charScale: 1.5,
  charOffsetX: 120,
  charOffsetY: 100,
  charRotation: 10,
  charMirror: false,
  text: "Primordial Attack",
  hideMainText: false,
  mainFontSize: 4,
  mainOffsetX: 0,
  mainOffsetY: 0,
  subText: "Primordial Eclipse",
  hideSubText: false,
  subFontSize: 1.5,
  subOffsetX: 0,
  subOffsetY: 0,
  fontFamily: "Modesto Condensed",
  mainTextColor: "#ffffff",
  subTextColor: "#000000",
  color: "#47eaff",
  borderWidth: 0,
  borderColor: "#ffffff",
  charShadowColor: "#000000",
  hideCharShadow: false,
  shakeIntensity: 10,
  dimIntensity: 0,
  soundList: { "0": "" },
  sfxList: { "0": "assets/AudioAssets/CutinAudio/Theia_PrimordialAudio.m4a" },
  soundVolume: 80,
  sfxVolume: 100,
  keepAudioPlaying: true,
  audioOnly: false,
  presetName: "TheiaPrimordial",
  id: "3Zu7VY7g6QO8gGzu",
  sound: "",
  sfx: "assets/AudioAssets/CutinAudio/Theia_PrimordialAudio.m4a",
  actorId: "Actor.1ED4XnogRmxRAeHr"
};

export function registerPrimordialEclipse() {
  registerPrimordialAttack({
    name: SPELL_NAME,
    cutIn: CUT_IN_CONFIG,
    cutInDelay: 5000
  }, async ({ workflow, actor, item, enemies, allies }) => {

    // Damage auf FEINDE
    const { total: radiantTotal } = await rollDamage({
      actor, formula: DAMAGE_RADIANT,
      flavor: `${SPELL_NAME} — Radiant Damage`
    });

    const { total: psychicTotal } = await rollDamage({
      actor, formula: DAMAGE_PSYCHIC,
      flavor: `${SPELL_NAME} — Psychic Damage`
    });

    const totalDamage = radiantTotal + psychicTotal;

    if (enemies.length) {
      await applyDamageToTargets(enemies, totalDamage);
    }

    // Heilung für VERBÜNDETE
    const rollData = actor.getRollData?.() ?? {};
    const healRoll = await new Roll(HEAL_FORMULA, rollData).evaluate();
    const healTotal = Math.max(0, healRoll.total);

    if (allies.length) {
      await applyHealToTargets(allies, healTotal);
    }

    await healRoll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `DSR-EX | ${SPELL_NAME} — Heilung für Verbündete`
    });

    // Token-Icon für 1 Runde auf Primordial-Bild setzen
    await setTokenImg(actor, PRIMORDIAL_IMG);
    await applyVisualEffect(actor, item, 1);

    await ChatMessage.create({
      content: `<div style="text-align:center; padding:8px; border: 1px solid #666; border-radius:4px; background: linear-gradient(135deg, #0a1a2e, #0e1e3e);">
        <div style="font-size:1.3em; font-weight:bold; color:#88aaff; text-shadow: 0 0 10px #88aaff;">
          ${SPELL_NAME}
        </div>
        <div style="color:#aaa; margin-top:4px; font-style:italic;">
          Mondlicht bricht durch die Dunkelheit. Hinter Theia erhebt sich Luna —
          nicht als Erinnerung, sondern als Wesen. Geflügelt, leuchtend, schreiend.
        </div>
        <div style="margin-top:8px; color:#aaccff;">
          Radiant: ${radiantTotal} | Psychic: ${psychicTotal} (Feinde)
        </div>
        <div style="color:#88ff88;">
          Heilung (Verbündete): ${healTotal}
        </div>
      </div>`,
      speaker: ChatMessage.getSpeaker({ actor })
    });
  });
}
