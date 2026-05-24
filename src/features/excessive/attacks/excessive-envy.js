import { registerExcessiveAttack, rollWisSave, applyStunned } from "./base.js";

/**
 * Excessive Envy — Alexander von Schweijk
 * "I'll have your head."
 *
 * Alle Feinde im 30ft Sphere: WIS Save (DC = Alexanders Spell Save DC)
 * Bei Misserfolg: Stunned für 1 Runde
 */

const ATTACK_NAME = "Excessive Envy";

// ─── Cut-In Config ───────────────────────────────────────────────────────────

const CUT_IN_CONFIG = {
  groupId: "",
  img: "assets/CharacterPortraits/CinematicPortraits/Excessives/AlexanderExcessiveEnvy.png",
  theme: "slash",
  customDuration: 6,
  hideBackground: false,
  localOnly: false,
  screenPosX: 50,
  screenPos: 50,
  charScale: null,
  charOffsetX: 60,
  charOffsetY: 60,
  charRotation: 20,
  charMirror: false,
  text: "Excessive Attack",
  hideMainText: false,
  mainFontSize: 4,
  mainOffsetX: 0,
  mainOffsetY: 0,
  subText: "Excessive Envy",
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
  subTextColor: "#ffffff",
  color: "#3d0000",
  borderWidth: 0,
  borderColor: "#ffffff",
  charShadowColor: "#000000",
  hideCharShadow: false,
  shakeIntensity: 2,
  dimIntensity: 25,
  soundList: { "0": "" },
  sfxList: { "0": "assets/AudioAssets/CutinAudio/ExcessiveAudios/ExcessiveEnvySound.m4a" },
  soundVolume: 80,
  sfxVolume: 80,
  keepAudioPlaying: true,
  audioOnly: false,
  triggers: { defaultSpellPreset: "" },
  variations: [],
  layers: [],
  presetName: "ExcessiveEnvy",
  id: "bqQEdcHVVP2yfzXC",
  sound: "",
  sfx: "assets/AudioAssets/CutinAudio/ExcessiveAudios/ExcessiveEnvySound.m4a",
  actorId: "Actor.3Y4lKVzQYNVQzkU1"
};

// ─── Registration ────────────────────────────────────────────────────────────

export function registerExcessiveEnvy() {
  registerExcessiveAttack(
    {
      name: ATTACK_NAME,
      cutIn: CUT_IN_CONFIG,
      cutInDelay: 6000  // customDuration = 6 → 6 Sekunden warten
    },
    executeEnvy
  );
}

// ─── Attack Logic ────────────────────────────────────────────────────────────

async function executeEnvy({ actor, item, targets }) {
  // Spell Save DC — aus Alexanders Actor-Daten, Fallback auf 17
  const dc = actor.system?.attributes?.spelldc ?? 17;

  const failures = [];
  const successes = [];

  // Jedes Target macht einen WIS Save
  for (const token of targets) {
    const { success } = await rollWisSave(
      token.actor,
      dc,
      `Excessive Envy — WIS Save`
    );
    if (success) {
      successes.push(token);
    } else {
      failures.push(token);
    }
  }

  // Stun auf alle Failures anwenden
  for (const token of failures) {
    await applyStunned(token.actor, item, 1);
  }

  // Zusammenfassung im Chat
  const lines = [
    `<strong>Excessive Envy — ${actor.name}</strong>`,
    `<em>"I'll have your head."</em>`,
    `<hr>`,
    `<strong>DC ${dc} WIS Save</strong>`,
    ``,
    failures.length
      ? `❌ <strong>Stunned (1 Runde):</strong> ${failures.map(t => t.name).join(", ")}`
      : `❌ Keine Failures`,
    successes.length
      ? `✅ <strong>Erfolg:</strong> ${successes.map(t => t.name).join(", ")}`
      : `✅ Niemand hat bestanden`
  ];

  await ChatMessage.create({
    content: lines.join("<br>"),
    speaker: ChatMessage.getSpeaker({ actor })
  });
}
