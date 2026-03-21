import { registerDsrExSettings } from "./settings.js";
import { registerPrimordial } from "./features/primordial/index.js";
import { registerSocket } from "./utils/socket.js";

const MODULE_ID = "DSR-EX";

console.log(`${MODULE_ID} | init loaded`);

Hooks.once("init", () => {
  registerDsrExSettings();
});

Hooks.once("ready", () => {
  console.log(`${MODULE_ID} | ready`);
  registerSocket();
  registerPrimordial();
});
