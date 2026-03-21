import { registerEnergyHooks, addBonusEnergy, setEnergyDirect, getEnergy, isReady } from "./energy.js";
import { registerPrimordialChaos } from "./attacks/primordial-chaos.js";
import { registerPrimordialRage } from "./attacks/primordial-rage.js";
import { registerPrimordialEclipse } from "./attacks/primordial-eclipse.js";
import { registerPrimordialZeal } from "./attacks/primordial-zeal.js";
import { registerPrimordialVengeance } from "./attacks/primordial-vengeance.js";

export function registerPrimordial() {
  if (!game.settings.get("DSR-EX", "primordialEnabled")) return;

  // Energy System (passive charge + decay hooks)
  registerEnergyHooks();

  // Primordial Attacks
  registerPrimordialChaos();
  registerPrimordialRage();
  registerPrimordialEclipse();
  registerPrimordialZeal();
  registerPrimordialVengeance();

  // Public API — aufrufbar via Macros
  // Beispiel: game.modules.get("DSR-EX").api.addBonusEnergy(token.actor, 20)
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
