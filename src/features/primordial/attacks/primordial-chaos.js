import { registerPrimordialAttack, rollDamage, applyDamageToTargets, applyHealToTargets } from "./base.js";

/**
 * PRIMORDIAL CHAOS — Remiel
 * 
 * "Sink into insanity..."
 * Song: Deja Reve — GG Magree
 */

const SPELL_NAME = "Primordial Chaos";
const BASE_DAMAGE = "4d10";
const TEMP_HP_FORMULA = "2d6 + @abilities.wis.mod";

// ─── Cut-In Config ──────────────────────────────────────────────────────────
// Paste hier dein Cinematic Cut-Ins Macro für Remiel rein.
// Wenn null, wird kein Cut-In abgespielt.
const CUT_IN_CONFIG = {
  groupId: "",
  img: "assets/CharacterPortraits/CinematicPortraits/Remiel_Cutin.png",
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
  subText: "Primordial Chaos",
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
  color: "#888888",               // Remiel: Grau
  borderWidth: 0,
  borderColor: "#ffffff",
  charShadowColor: "#000000",
  hideCharShadow: false,
  shakeIntensity: 4,
  dimIntensity: 0,
  soundList: {
    "0": "assets/AudioAssets/CutinAudio/Remiel_PrimordialVoice.m4a"  // TODO: Pfad anpassen
  },
  sfxList: {
    "0": "modules/cinematic-cut-ins/sounds/finish_urban.mp3"
  },
  soundVolume: 80,
  sfxVolume: 80,
  keepAudioPlaying: true,
  audioOnly: false
};

export function registerPrimordialChaos() {
  registerPrimordialAttack({
    name: SPELL_NAME,
    cutIn: CUT_IN_CONFIG,
    cutInDelay: 5000
  }, async ({ workflow, actor, item, targets }) => {

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

    if (targets.length) {
      await applyDamageToTargets(targets, damageTotal);
    }

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
