export const MODULE_ID = "DSR-EX";

export function registerDsrExSettings() {
  game.settings.register(MODULE_ID, "primordialEnabled", {
    name: "DSR-EX: Primordial System aktiv",
    hint: "Aktiviert das Primordial Energy System und die dazugehörigen Attacks.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, "passiveChargePerRound", {
    name: "DSR-EX: Passive Charge pro Runde",
    hint: "Wie viel Primordial Energy jeder Combatant automatisch pro Kampfrunde erhält.",
    scope: "world",
    config: true,
    type: Number,
    default: 10
  });

  game.settings.register(MODULE_ID, "decayAfterCombat", {
    name: "DSR-EX: Decay nach Kampfende",
    hint: "Wie viel Primordial Energy nach dem Ende eines Kampfes zerfällt.",
    scope: "world",
    config: true,
    type: Number,
    default: 25
  });

  game.settings.register(MODULE_ID, "maxEnergy", {
    name: "DSR-EX: Maximale Primordial Energy",
    hint: "Der Maximalwert der Primordial Energy Ressource.",
    scope: "world",
    config: true,
    type: Number,
    default: 100
  });

  game.settings.register(MODULE_ID, "gmWhisper", {
    name: "DSR-EX: Infos an GM als Whisper",
    hint: "Sendet Primordial-Infos (Charge, Decay, Attack-Nutzung) als Whisper an den GM.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });
}
