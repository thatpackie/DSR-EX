import { registerPrimordialAttack, rollDamage, applyDamageToTargets } from "./base.js";
import { applyEffectViaSocket } from "../../../utils/socket.js";

/**
 * PRIMORDIAL ZEAL — Elantir
 * 
 * "Quench the flames with blood."
 * Song: Tenebre Rosso Sangue — Keygen Church
 */

const SPELL_NAME = "Primordial Zeal";
const DAMAGE_FORMULA = "5d8";
const TEMP_HP_ALLIES = "1d8 + @abilities.cha.mod";
const BUFF_AC = 2;
const BUFF_DURATION = 60;

const CUT_IN_CONFIG = {
  groupId: "",
  img: "assets/CharacterPortraits/CinematicPortraits/Elantir_Cutin.png",
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
  subText: "Primordial Zeal",
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
  color: "#ffcc00",               // Elantir: Gold
  borderWidth: 0,
  borderColor: "#ffffff",
  charShadowColor: "#000000",
  hideCharShadow: false,
  shakeIntensity: 4,
  dimIntensity: 0,
  soundList: {
    "0": "assets/AudioAssets/CutinAudio/Elantir_PrimordialVoice.m4a"  // TODO: Pfad anpassen
  },
  sfxList: {
    "0": "modules/cinematic-cut-ins/sounds/finish_urban.mp3"
  },
  soundVolume: 80,
  sfxVolume: 80,
  keepAudioPlaying: true,
  audioOnly: false
};

export function registerPrimordialZeal() {
  registerPrimordialAttack({
    name: SPELL_NAME,
    cutIn: CUT_IN_CONFIG,
    cutInDelay: 5000
  }, async ({ workflow, actor, item, targets }) => {

    const { total: damageTotal } = await rollDamage({
      actor, formula: DAMAGE_FORMULA,
      flavor: `${SPELL_NAME} — Radiant Damage`
    });

    if (targets.length) {
      await applyDamageToTargets(targets, damageTotal);
    }

    const rollData = actor.getRollData?.() ?? {};
    const tempRoll = await new Roll(TEMP_HP_ALLIES, rollData).evaluate();
    const tempHp = Math.max(0, tempRoll.total);

    await tempRoll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `DSR-EX | ${SPELL_NAME} — Temp HP für Verbündete`
    });

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
