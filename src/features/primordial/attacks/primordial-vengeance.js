import { registerPrimordialAttack, rollDamage, applyDamageToTargets } from "./base.js";

/**
 * PRIMORDIAL VENGEANCE — Vaelorin
 * "Time to reap."
 * 
 * Single Target Burst (Psychic + Necrotic) + Invisibility
 */

const SPELL_NAME = "Primordial Vengeance";
const DAMAGE_PSYCHIC = "4d10";
const DAMAGE_NECROTIC = "3d8";

const CUT_IN_CONFIG = {
  groupId: "",
  img: "assets/CharacterPortraits/CinematicPortraits/Vaelorin_Cutin.png",
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
  subText: "Primordial Vengeance",
  hideSubText: false,
  subFontSize: 1.5,
  subOffsetX: 0,
  subOffsetY: 0,
  fontFamily: "Modesto Condensed",
  mainTextColor: "#ffffff",
  subTextColor: "#000000",
  color: "#5f009e",
  borderWidth: 0,
  borderColor: "#ffffff",
  charShadowColor: "#000000",
  hideCharShadow: false,
  shakeIntensity: 10,
  dimIntensity: 0,
  soundList: { "0": "" },
  sfxList: { "0": "assets/AudioAssets/CutinAudio/Vaelorin_PrimordialAudio.m4a" },
  soundVolume: 80,
  sfxVolume: 100,
  keepAudioPlaying: true,
  audioOnly: false,
  presetName: "VaelorinPrimordial",
  id: "x7NUCI9h5Zuk6cgi",
  sound: "",
  sfx: "assets/AudioAssets/CutinAudio/Vaelorin_PrimordialAudio.m4a",
  actorId: "Actor.ZpCiDQQhXzA6wrVi"
};

export function registerPrimordialVengeance() {
  registerPrimordialAttack({
    name: SPELL_NAME,
    cutIn: CUT_IN_CONFIG,
    cutInDelay: 5000
  }, async ({ workflow, actor, item, enemies }) => {

    // Single Target — erstes feindliches Ziel
    const target = enemies[0];

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

    // Invisibility
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
