import { registerPrimordialAttack, rollDamage, applyDamageToTargets } from "./base.js";

/**
 * PRIMORDIAL RAGE — Pyraxis
 * 
 * "AAAAAAAAAH!"
 * Song: Never Surrender — Combichrist
 */

const SPELL_NAME = "Primordial Rage";
const DAMAGE_FORMULA = "6d8";
const SELF_TEMP_HP = "2d8 + @abilities.con.mod";

const CUT_IN_CONFIG = {
  groupId: "",
  img: "assets/CharacterPortraits/CinematicPortraits/Pyraxis_CutinV2.png",
  theme: "slash",
  customDuration: 4,
  hideBackground: false,
  localOnly: false,
  screenPosX: 50,
  screenPos: 50,
  charScale: 1.2,
  charOffsetX: 100,
  charOffsetY: 100,
  charRotation: 10,
  charMirror: false,
  text: "Primordial Attack",
  hideMainText: false,
  mainFontSize: 4,
  mainOffsetX: 0,
  mainOffsetY: 0,
  subText: "Primordial Rage",
  hideSubText: false,
  subFontSize: 1,
  subOffsetX: 0,
  subOffsetY: 0,
  fontFamily: "Modesto Condensed",
  fontBold: true,
  fontItalic: false,
  subFontFamily: "Modesto Condensed",
  subFontBold: true,
  subFontItalic: false,
  mainTextColor: "#ffffff",
  subTextColor: "#000000",
  color: "#ff4400",               // Pyraxis: Orange-Rot
  borderWidth: 0,
  borderColor: "#ffffff",
  charShadowColor: "#000000",
  hideCharShadow: false,
  shakeIntensity: 4,
  dimIntensity: 0,
  soundList: {
    "0": "assets/AudioAssets/CutinAudio/Pyraxis_PrimordialVoice.m4a"  // TODO: Pfad anpassen
  },
  sfxList: {
    "0": "modules/cinematic-cut-ins/sounds/finish_urban.mp3"
  },
  soundVolume: 80,
  sfxVolume: 80,
  keepAudioPlaying: true,
  audioOnly: false
};

export function registerPrimordialRage() {
  registerPrimordialAttack({
    name: SPELL_NAME,
    cutIn: CUT_IN_CONFIG,
    cutInDelay: 5000
  }, async ({ workflow, actor, item, targets }) => {

    const { total: damageTotal } = await rollDamage({
      actor,
      formula: DAMAGE_FORMULA,
      flavor: `${SPELL_NAME} — Fire Damage (ALLE im AOE)`
    });

    if (targets.length) {
      await applyDamageToTargets(targets, damageTotal);
    }

    const rollData = actor.getRollData?.() ?? {};
    const tempRoll = await new Roll(SELF_TEMP_HP, rollData).evaluate();
    const tempHp = Math.max(0, tempRoll.total);
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
