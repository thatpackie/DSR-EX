import { registerExcessiveEnvy } from "./attacks/excessive-envy.js";
import { ensureExcessiveItems } from "./items.js";

/**
 * Registriert alle Excessive Attacks (Sin-Boss-Fähigkeiten).
 * Wird aus src/init.js aufgerufen.
 */
export async function registerExcessive() {
  if (!game.user.isGM) return;

  await ensureExcessiveItems();

  registerExcessiveEnvy();

  // Weitere Excessive Attacks hier ergänzen:
  // registerExcessiveXyz();

  console.log("DSR-EX | Excessive Attacks registriert.");
}
