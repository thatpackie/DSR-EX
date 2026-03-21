import { getEnergy } from "./energy.js";
import { MODULE_ID } from "../../settings.js";

/**
 * Primordial Energy HUD
 * 
 * Ein kleines, schwebendes Icon unten links im Bildschirm.
 * Jeder Spieler sieht NUR sein eigenes Icon.
 * GM sieht das Icon des aktuell ausgewählten Tokens (zum Testen).
 * Kein Prozentwert — nur der Füllstand des Icons.
 * Bei 100%: dezentes Pulsieren/Leuchten.
 */

const ICON_CONFIGS = {
  remiel: {
    color: "#487d9d",
    path: "M50,8 L92,30 L92,70 L50,92 L8,70 L8,30 Z",
    details: [
      '<line x1="50" y1="8" x2="50" y2="92" stroke="STROKE" stroke-width="0.8" opacity="0.3"/>',
      '<line x1="8" y1="30" x2="92" y2="70" stroke="STROKE" stroke-width="0.8" opacity="0.3"/>',
      '<line x1="92" y1="30" x2="8" y2="70" stroke="STROKE" stroke-width="0.8" opacity="0.3"/>'
    ]
  },
  elantir: {
    color: "#ffc800",
    path: "M50,5 L90,22 L90,55 Q90,80 50,97 Q10,80 10,55 L10,22 Z",
    details: [
      '<line x1="50" y1="22" x2="50" y2="82" stroke="STROKE" stroke-width="0.8" opacity="0.3"/>',
      '<line x1="28" y1="38" x2="72" y2="38" stroke="STROKE" stroke-width="0.8" opacity="0.3"/>'
    ]
  },
  theia: {
    color: "#47eaff",
    path: "M68,8 Q18,8 13,50 Q8,92 58,97 Q33,82 33,50 Q33,18 68,8 Z",
    details: [
      '<circle cx="55" cy="32" r="2" fill="STROKE" opacity="0.4"/>',
      '<circle cx="45" cy="68" r="1.5" fill="STROKE" opacity="0.3"/>',
      '<circle cx="62" cy="55" r="1" fill="STROKE" opacity="0.3"/>'
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
let currentActorId = null;

/**
 * Bestimmt welcher Charakter-Key zum Actor passt.
 */
function getCharKeyForActor(actor) {
  if (!actor) return null;

  // Prüfe DSR-EX Flags auf Items
  for (const item of actor.items) {
    const charFlag = item.flags?.["DSR-EX"]?.character;
    if (charFlag) return charFlag.toLowerCase();
  }

  // Fallback: Actor-Name
  const name = actor.name?.toLowerCase() ?? "";
  for (const key of Object.keys(ICON_CONFIGS)) {
    if (name.includes(key)) return key;
  }

  return null;
}

/**
 * Gibt den relevanten Actor zurück.
 * Spieler: Ihr zugewiesener Character.
 * GM: Der aktuell ausgewählte Token (zum Testen).
 */
function getRelevantActor() {
  if (game.user.isGM) {
    // GM: Ausgewählter Token
    const controlled = canvas.tokens?.controlled?.[0];
    return controlled?.actor ?? null;
  }
  return game.user.character ?? null;
}

function buildIconSVG(charKey, fillPercent) {
  const config = ICON_CONFIGS[charKey];
  if (!config) return "";

  const gradId = `dsr-ex-fill-${charKey}`;
  const frac = Math.max(0, Math.min(1, fillPercent / 100));

  const detailLines = config.details
    .map(d => d.replaceAll("STROKE", config.color))
    .join("\n    ");

  return `<svg class="dsr-ex-energy-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${gradId}" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="${config.color}"/>
      <stop offset="${frac * 100}%" stop-color="${config.color}"/>
      <stop offset="${frac * 100}%" stop-color="${config.color}" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="${config.color}" stop-opacity="0.1"/>
    </linearGradient>
  </defs>
  <path d="${config.path}" fill="url(#${gradId})" stroke="${config.color}" stroke-width="2.5"/>
  ${detailLines}
</svg>`;
}

function updateHUD() {
  if (!hudElement) return;

  const actor = getRelevantActor();
  if (!actor) {
    hudElement.classList.add("hidden");
    return;
  }

  const charKey = getCharKeyForActor(actor);
  if (!charKey) {
    hudElement.classList.add("hidden");
    return;
  }

  // Wenn sich der Charakter geändert hat (GM wechselt Token), neu rendern
  if (charKey !== currentCharKey || actor.id !== currentActorId) {
    currentCharKey = charKey;
    currentActorId = actor.id;
  }

  hudElement.classList.remove("hidden");

  const energy = getEnergy(actor);
  const max = game.settings.get(MODULE_ID, "maxEnergy");
  const percent = (energy / max) * 100;

  const svgContainer = hudElement.querySelector(".dsr-ex-icon-container");
  if (svgContainer) {
    svgContainer.innerHTML = buildIconSVG(currentCharKey, percent);

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

function createHUD() {
  if (hudElement) hudElement.remove();

  hudElement = document.createElement("div");
  hudElement.classList.add("dsr-ex-energy-hud");
  hudElement.innerHTML = `<div class="dsr-ex-icon-container"></div>`;
  document.body.appendChild(hudElement);

  updateHUD();
  console.log("DSR-EX | Energy HUD erstellt");
}

/**
 * Registriert die HUD-Hooks. Wird aus dem ready-Hook aufgerufen.
 */
export function registerEnergyHUD() {
  // HUD direkt erstellen (wir SIND bereits im ready-Hook)
  setTimeout(createHUD, 1000);

  // Update wenn sich Actor-Flags ändern
  Hooks.on("updateActor", (actor) => {
    if (!hudElement) return;
    const relevant = getRelevantActor();
    if (relevant && actor.id === relevant.id) {
      updateHUD();
    }
  });

  // GM: Update wenn Token-Auswahl sich ändert
  Hooks.on("controlToken", () => {
    if (game.user.isGM) updateHUD();
  });

  // HUD bei Combat-Events updaten
  Hooks.on("createCombat", () => updateHUD());
  Hooks.on("deleteCombat", () => updateHUD());

  // Spieler wechselt Character
  Hooks.on("updateUser", (user) => {
    if (user.id === game.user.id) {
      setTimeout(createHUD, 500);
    }
  });

  console.log("DSR-EX | Energy HUD registriert");
}

export function forceHUDUpdate() {
  updateHUD();
}
