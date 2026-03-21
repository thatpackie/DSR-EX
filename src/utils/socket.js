const SOCKET_NAME = "module.DSR-EX";

/**
 * Registriert den GM-seitigen Socket-Handler.
 * Muss im "ready"-Hook aufgerufen werden.
 */
export function registerSocket() {
  game.socket.on(SOCKET_NAME, async (data) => {
    if (!game.user.isGM) return;

    if (data.action === "setEnergy") {
      const actor = await fromUuid(data.actorUuid);
      if (!actor) {
        console.warn(`DSR-EX | Socket: Actor nicht gefunden für UUID ${data.actorUuid}`);
        return;
      }
      await actor.setFlag("DSR-EX", "primordialEnergy", data.value);
    }

    if (data.action === "applyHp") {
      const actor = await fromUuid(data.actorUuid);
      if (!actor) return;
      await actor.update({ "system.attributes.hp.value": data.value });
    }

    if (data.action === "applyEffect") {
      const actor = await fromUuid(data.actorUuid);
      if (!actor) return;
      await actor.createEmbeddedDocuments("ActiveEffect", [data.effectData]);
    }

    if (data.action === "removeEffect") {
      const actor = await fromUuid(data.actorUuid);
      if (!actor) return;
      const effect = actor.effects.find(
        e => e.flags?.["DSR-EX"]?.[data.flagKey] === true
      );
      if (effect) await effect.delete();
    }
  });
}

/**
 * Setzt die Primordial Energy eines Actors.
 */
export async function setEnergyViaSocket(actor, value) {
  if (game.user.isGM) {
    await actor.setFlag("DSR-EX", "primordialEnergy", value);
  } else {
    game.socket.emit(SOCKET_NAME, {
      action: "setEnergy",
      actorUuid: actor.uuid,
      value
    });
  }
}

/**
 * Setzt den HP-Wert eines Actors.
 */
export async function applyHpViaSocket(actor, value) {
  if (game.user.isGM) {
    await actor.update({ "system.attributes.hp.value": value });
  } else {
    game.socket.emit(SOCKET_NAME, {
      action: "applyHp",
      actorUuid: actor.uuid,
      value
    });
  }
}

/**
 * Wendet einen Active Effect auf einen Actor an.
 */
export async function applyEffectViaSocket(actor, effectData) {
  if (game.user.isGM) {
    await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
  } else {
    game.socket.emit(SOCKET_NAME, {
      action: "applyEffect",
      actorUuid: actor.uuid,
      effectData
    });
  }
}

/**
 * Entfernt einen Active Effect anhand eines DSR-EX Flag-Keys.
 */
export async function removeEffectViaSocket(actor, flagKey) {
  if (game.user.isGM) {
    const effect = actor.effects.find(
      e => e.flags?.["DSR-EX"]?.[flagKey] === true
    );
    if (effect) await effect.delete();
  } else {
    game.socket.emit(SOCKET_NAME, {
      action: "removeEffect",
      actorUuid: actor.uuid,
      flagKey
    });
  }
}
