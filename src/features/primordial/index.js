import { registerEnergyHooks, addBonusEnergy, setEnergyDirect, getEnergy, isReady } from "./energy.js";
import { registerEnergyHUD } from "./energy-hud.js";
import { ensurePrimordialItems } from "./items.js";
import { registerTokenImageHooks } from "./attacks/base.js";
import { registerPrimordialChaos } from "./attacks/primordial-chaos.js";
import { registerPrimordialRage } from "./attacks/primordial-rage.js";
import { registerPrimordialEclipse } from "./attacks/primordial-eclipse.js";
import { registerPrimordialZeal } from "./attacks/primordial-zeal.js";
import { registerPrimordialVengeance } from "./attacks/primordial-vengeance.js";

export function registerPrimordial() {
  if (!game.settings.get("DSR-EX", "primordialEnabled")) return;

  // Auto-Setup: Erstelle Primordial Items falls nötig
  ensurePrimordialItems();

  // Energy System (passive charge + decay hooks)
  registerEnergyHooks();

  // Token Image Restore Hook
  registerTokenImageHooks();

  // Energy HUD (visuelles Icon pro Spieler)
  registerEnergyHUD();

  // Primordial Attacks
  registerPrimordialChaos();
  registerPrimordialRage();
  registerPrimordialEclipse();
  registerPrimordialZeal();
  registerPrimordialVengeance();

  // Public API
  const moduleData = game.modules.get("DSR-EX");
  if (moduleData) {
    moduleData.api = {
      addBonusEnergy,
      setEnergyDirect,
      getEnergy,
      isReady
    };
  }

  console.log("DSR-EX | Primordial System registriert");
  console.log("DSR-EX | API verfügbar via: game.modules.get('DSR-EX').api");
}
