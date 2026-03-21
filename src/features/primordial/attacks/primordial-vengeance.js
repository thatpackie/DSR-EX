import { registerPrimordialAttack, rollDamage, applyDamageToTargets } from "./base.js";

/**
 * PRIMORDIAL VENGEANCE — Vaelorin
 * 
 * "Time to reap."
 * Song: Crimson Cloud — Jeff Rona
 */

const SPELL_NAME = "Primordial Vengeance";
const DAMAGE_PSYCHIC = "4d10";
const DAMAGE_NECROTIC = "3d8";

const CUT_IN_CONFIG = {
  groupId: "",
  img: "assets/CharacterPortraits/CinematicPortraits/Vaelorin_Cutin.png",
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
  subText: "Primordial Vengeance",
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
  color: "#aa44ff",               // Vaelorin: Violett
  borderWidth: 0,
  borderColor: "#ffffff",
  charShadowColor: "#000000",
  hideCharShadow: false,
  shakeIntensity: 4,
  dimIntensity: 0,
  soundList: {
    "0": "assets/AudioAssets/CutinAudio/Vaelorin_PrimordialVoice.m4a"  // TODO: Pfad anpassen
  },
  sfxList: {
    "0": "modules/cinematic-cut-ins/sounds/finish_urban.mp3"
  },
  soundVolume: 80,
  sfxVolume: 80,
  keepAudioPlaying: true,
  audioOnly: false
};

export function registerPrimordialVengeance() {
  registerPrimordialAttack({
    name: SPELL_NAME,
    cutIn: CUT_IN_CONFIG,
    cutInDelay: 5000
  }, async ({ workflow, actor, item, targets }) => {

    const target = targets[0];

    const { total: psychicTotal } = await rollDamage({
      actor, formula: DAMAGE_PSYCHIC,
      flavor: `${SPELL_NAME} — Psychic Damage`
    });

    const { total: necroticTotal } = await rollDamage({
      actor, formula: DAMAGE_NECROTIC,
      flavor: `${SPELL_NAME} — Necrotic Damage`
    });

    const totalDamage = psychicTotal + necroticTotal;

    if (target) {
      await applyDamageToTargets([target], totalDamage);
    }

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
