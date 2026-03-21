import { registerPrimordialAttack, rollDamage, applyDamageToTargets } from "./base.js";

/**
 * PRIMORDIAL CHAOS — Remiel
 * "Sink into insanity..."
 * 
 * Feinde: Psychic Damage | Verbündete: Temp HP
 */

const SPELL_NAME = "Primordial Chaos";
const BASE_DAMAGE = "4d10";
const TEMP_HP_FORMULA = "2d6 + @abilities.wis.mod";

const CUT_IN_CONFIG = {
  groupId: "",
  img: "assets/CharacterPortraits/CinematicPortraits/Remiel_Cutin.png",
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
  subText: "Primordial Chaos",
  hideSubText: false,
  subFontSize: 1.5,
  subOffsetX: 0,
  subOffsetY: 0,
  fontFamily: "Modesto Condensed",
  mainTextColor: "#000000",
  subTextColor: "#000000",
  color: "#487d9d",
  borderWidth: 0,
  borderColor: "#ffffff",
  charShadowColor: "#000000",
  hideCharShadow: false,
  shakeIntensity: 10,
  dimIntensity: 0,
  soundList: { "0": "" },
  sfxList: { "0": "assets/AudioAssets/CutinAudio/Remiel_PrimordialAudio.m4a" },
  soundVolume: 80,
  sfxVolume: 100,
  keepAudioPlaying: true,
  audioOnly: false,
  presetName: "RemielPrimordial",
  id: "GAKbGGQfcYTYnIh0",
  sound: "",
  sfx: "assets/AudioAssets/CutinAudio/Remiel_PrimordialAudio.m4a",
  actorId: "Actor.KIBZxYsa0oCM6O1r"
};

export function registerPrimordialChaos() {
  registerPrimordialAttack({
    name: SPELL_NAME,
    cutIn: CUT_IN_CONFIG,
    cutInDelay: 5000
  }, async ({ workflow, actor, item, enemies, allies }) => {

    // Psychic Damage auf FEINDE
    const { total: damageTotal } = await rollDamage({
      actor, formula: BASE_DAMAGE,
      flavor: `${SPELL_NAME} — Psychic Damage`
    });

    if (enemies.length) {
      await applyDamageToTargets(enemies, damageTotal);
    }

    // Temp HP für VERBÜNDETE
    const rollData = actor.getRollData?.() ?? {};
    const tempHpRoll = await new Roll(TEMP_HP_FORMULA, rollData).evaluate();
    const tempHp = Math.max(0, tempHpRoll.total);

    await tempHpRoll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `DSR-EX | ${SPELL_NAME} — Temporary HP für Verbündete`
    });

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
          Psychic Damage (Feinde): ${damageTotal}
        </div>
        <div style="color:#88ccff;">
          Temp HP (Verbündete): ${tempHp}
        </div>
      </div>`,
      speaker: ChatMessage.getSpeaker({ actor })
    });
  });
}
