import { registerPrimordialAttack, rollDamage, applyDamageToTargets, setTokenImg, applyVisualEffect } from "./base.js";

/**
 * PRIMORDIAL RAGE — Pyraxis
 * "AAAAAAAAAH!"
 * 
 * ALLE Kreaturen im AOE (inkl. Verbündete!) nehmen Fire Damage.
 * Pyraxis erhält Temp HP.
 * 
 * HINWEIS: Das Cut-In Macro in Packies Datei war eine Kopie von Elantir.
 * Die Werte hier sind auf Pyraxis korrigiert — Pfade müssen ggf. angepasst werden.
 */

const SPELL_NAME = "Primordial Rage";
const DAMAGE_FORMULA = "6d8";
const SELF_TEMP_HP = "2d8 + @abilities.con.mod";
const PRIMORDIAL_IMG = "assets/CharacterPortraits/CinematicPortraits/Pyraxis_PrimordialRage.png";

// TODO: Pyraxis Cut-In Macro war in PrimordialCutinMacros.txt eine Kopie von Elantir.
// Die Werte unten sind best-guess. Packie muss img, sfx, actorId und presetName prüfen.
const CUT_IN_CONFIG = {
  groupId: "",
  img: "assets/CharacterPortraits/CinematicPortraits/Pyraxis_CutinV2.png",
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
  subText: "Primordial Rage",
  hideSubText: false,
  subFontSize: 1.5,
  subOffsetX: 0,
  subOffsetY: 0,
  fontFamily: "Modesto Condensed",
  mainTextColor: "#000000",
  subTextColor: "#000000",
  color: "#ff4400",                // Pyraxis: Orange-Rot
  borderWidth: 0,
  borderColor: "#ffffff",
  charShadowColor: "#000000",
  hideCharShadow: false,
  shakeIntensity: 10,
  dimIntensity: 0,
  soundList: { "0": "" },
  sfxList: { "0": "assets/AudioAssets/CutinAudio/Pyraxis_PrimordialAudioV3.m4a" },  // TODO: Pfad prüfen
  soundVolume: 80,
  sfxVolume: 100,
  keepAudioPlaying: true,
  audioOnly: false,
  presetName: "PyraxisPrimordial",
  id: "",                          // TODO: Preset-ID eintragen
  sound: "",
  sfx: "assets/AudioAssets/CutinAudio/Pyraxis_PrimordialAudioV3.m4a",
  actorId: "Actor.MSYXYOsUC6P2Z13M"                      // TODO: Pyraxis Actor-ID eintragen
};

export function registerPrimordialRage() {
  registerPrimordialAttack({
    name: SPELL_NAME,
    cutIn: CUT_IN_CONFIG,
    cutInDelay: 5000
  }, async ({ workflow, actor, item, targets, enemies, allies }) => {

    // Fire Damage — trifft ALLE targets, Freund wie Feind!
    const { total: damageTotal } = await rollDamage({
      actor, formula: DAMAGE_FORMULA,
      flavor: `${SPELL_NAME} — Fire Damage (ALLE im AOE)`
    });

    if (targets.length) {
      await applyDamageToTargets(targets, damageTotal);
    }

    // Temp HP für Pyraxis selbst
    const rollData = actor.getRollData?.() ?? {};
    const tempRoll = await new Roll(SELF_TEMP_HP, rollData).evaluate();
    const tempHp = Math.max(0, tempRoll.total);
    await actor.update({ "system.attributes.hp.temp": tempHp });

    await tempRoll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `DSR-EX | ${SPELL_NAME} — Temp HP (Kossuth's Wut)`
    });

    // Token-Icon für 1 Runde auf Primordial-Bild setzen
    await setTokenImg(actor, PRIMORDIAL_IMG);
    await applyVisualEffect(actor, item, 1);

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
