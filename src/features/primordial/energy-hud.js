import { getEnergy } from "./energy.js";
import { MODULE_ID } from "../../settings.js";

/**
 * Primordial Energy HUD
 * 
 * Ein kleines, schwebendes Icon unten links im Bildschirm.
 * Jeder Spieler sieht NUR sein eigenes Icon.
 * Kein Prozentwert — nur der Füllstand des Icons.
 * Bei 100%: dezentes Pulsieren/Leuchten.
 * 
 * Icons pro Charakter:
 *   Remiel  — D20 (Hexagon)     — #487d9d
 *   Elantir — Schild             — #ffc800
 *   Theia   — Mondsichel          — #47eaff
 *   Pyraxis — Flamme             — #ff4400
 *   Vaelorin — Dolch             — #5f009e
 */

const ICON_CONFIGS = {
  remiel: {
    color: "#487d9d",
    path: "M50,8 L92,30 L92,70 L50,92 L8,70 L8,30 Z",
    details: [
      '<line x1="50" y1="8" x2="50" y2="92" stroke-width="0.8" opacity="0.3"/>',
      '<line x1="8" y1="30" x2="92" y2="70" stroke-width="0.8" opacity="0.3"/>',
      '<line x1="92" y1="30" x2="8" y2="70" stroke-width="0.8" opacity="0.3"/>'
    ]
  },
  elantir: {
    color: "#ffc800",
    path: "M50,5 L90,22 L90,55 Q90,80 50,97 Q10,80 10,55 L10,22 Z",
    details: [
      '<line x1="50" y1="22" x2="50" y2="82" stroke-width="0.8" opacity="0.3"/>',
      '<line x1="28" y1="38" x2="72" y2="38" stroke-width="0.8" opacity="0.3"/>'
    ]
  },
  theia: {
    color: "#47eaff",
    path: "M68,8 Q18,8 13,50 Q8,92 58,97 Q33,82 33,50 Q33,18 68,8 Z",
    details: [
      '<circle cx="55" cy="32" r="2" opacity="0.4"/>',
      '<circle cx="45" cy="68" r="1.5" opacity="0.3"/>',
      '<circle cx="62" cy="55" r="1" opacity="0.3"/>'
    ]
  },
  pyraxis: {
    color: "#ff4400",
    path: "M50,3 Q67,23 72,38 Q82,33 77,53 Q87,48 80,68 Q92,63 72,90 L50,97 L28,90 Q8,63 20,68 Q13,48 23,53 Q18,33 28,38 Q33,23 50,3 Z",
    details: []
  },
  vaelorin: {
    color: "#5f009e",
    path: "M50,3 L56,32 L62,27 L56,63 L60,58 L50,97 L40,58 L44,63 L38,27 L44,32 Z",
    details: []
  }
};

let hudElement = null;
let currentCharKey = null;

/**
 * Bestimmt welcher Charakter zum aktuell eingeloggten Spieler gehört.
 * Checkt die DSR-EX Flags auf den Items des Actors.
 */
function getPlayerCharacterKey() {
  const user = game.user;
  if (!user || user.isGM) return null;

  const actor = user.character;
  if (!actor) return null;

  // Prüfe ob der Actor ein Primordial Attack Item hat
  for (const item of actor.items) {
    const charFlag = item.flags?.["DSR-EX"]?.character;
    if (charFlag) return charFlag.toLowerCase();
  }

  // Fallback: Prüfe Actor-Name
  const name = actor.name?.toLowerCase() ?? "";
  for (const key of Object.keys(ICON_CONFIGS)) {
    if (name.includes(key)) return key;
  }

  return null;
}

/**
 * Gibt den Actor des aktuell eingeloggten Spielers zurück.
 */
function getPlayerActor() {
  const user = game.user;
  if (!user) return null;

  // GM sieht kein HUD (der sieht alles via Whisper)
  if (user.isGM) return null;

  return user.character ?? null;
}

/**
 * Erstellt das SVG für ein Primordial Icon.
 */
function buildIconSVG(charKey, fillPercent) {
  const config = ICON_CONFIGS[charKey];
  if (!config) return "";

  const gradientId = `dsr-ex-fill-${charKey}`;
  const frac = Math.max(0, Math.min(1, fillPercent / 100));

  const detailLines = config.details
    .map(d => d.replace(/stroke-width/g, `stroke="${config.color}" stroke-width`))
    .join("\n    ");

  return `<svg class="dsr-ex-energy-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${gradientId}" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="${config.color}"/>
      <stop offset="${frac * 100}%" stop-color="${config.color}"/>
      <stop offset="${frac * 100}%" stop-color="transparent"/>
      <stop offset="100%" stop-color="transparent"/>
    </linearGradient>
  </defs>
  <path d="${config.path}" fill="url(#${gradientId})" stroke="${config.color}" stroke-width="2.5"/>
  ${detailLines}
</svg>`;
}

/**
 * Updated das HUD mit dem aktuellen Energy-Wert.
 */
function updateHUD() {
  if (!hudElement || !currentCharKey) return;

  const actor = getPlayerActor();
  if (!actor) return;

  const energy = getEnergy(actor);
  const max = game.settings.get(MODULE_ID, "maxEnergy");
  const percent = (energy / max) * 100;

  // SVG updaten
  const svgContainer = hudElement.querySelector(".dsr-ex-icon-container");
  if (svgContainer) {
    svgContainer.innerHTML = buildIconSVG(currentCharKey, percent);

    // Glow-Klasse
    const svg = svgContainer.querySelector("svg");
    if (svg) {
      const config = ICON_CONFIGS[currentCharKey];
      svg.style.setProperty("--dsr-ex-glow-color", config?.color ?? "#888");

      if (percent >= 100) {
        svg.classList.add("primordial-ready");
      } else {
        svg.classList.remove("primordial-ready");
      }
    }
  }
}

/**
 * Erstellt das HUD-Element und fügt es in den DOM ein.
 */
function createHUD() {
  if (hudElement) hudElement.remove();

  currentCharKey = getPlayerCharacterKey();
  if (!currentCharKey) return; // Kein Charakter = kein HUD

  hudElement = document.createElement("div");
  hudElement.classList.add("dsr-ex-energy-hud");
  hudElement.innerHTML = `<div class="dsr-ex-icon-container"></div>`;
  document.body.appendChild(hudElement);

  updateHUD();
}

/**
 * Registriert die HUD Hooks.
 */
export function registerEnergyHUD() {
  // HUD erstellen wenn ein Spieler bereit ist
  Hooks.on("ready", () => {
    // Kurze Verzögerung, damit alle Actors geladen sind
    setTimeout(createHUD, 2000);
  });

  // Update wenn sich Actor-Flags ändern
  Hooks.on("updateActor", (actor, changes) => {
    if (!hudElement) return;

    // Prüfe ob sich die Primordial Energy geändert hat
    const flagChange = changes?.flags?.["DSR-EX"]?.primordialEnergy;
    if (flagChange !== undefined) {
      const playerActor = getPlayerActor();
      if (playerActor && actor.id === playerActor.id) {
        updateHUD();
      }
    }
  });

  // HUD zeigen/verstecken bei Combat Start/Ende
  Hooks.on("createCombat", () => {
    if (hudElement) hudElement.classList.remove("hidden");
  });

  Hooks.on("deleteCombat", () => {
    // HUD bleibt sichtbar, aber updated sich (Energy nach Decay)
    updateHUD();
  });

  // HUD neu erstellen wenn der Spieler seinen Charakter wechselt
  Hooks.on("updateUser", (user, changes) => {
    if (user.id === game.user.id && changes.character !== undefined) {
      createHUD();
    }
  });

  console.log("DSR-EX | Energy HUD registriert");
}

/**
 * Für GM: Manuelles Update des HUDs aller Spieler erzwingen.
 * (Normalerweise nicht nötig, da updateActor-Hook automatisch feuert)
 */
export function forceHUDUpdate() {
  updateHUD();
}
