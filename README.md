# DSR-EX: Primordial Attacks

Foundry VTT Modul für **Die schwarze Renaissance** — das Primordial Attack System.

## Features

### Primordial Energy
- Custom Resource (0–100) auf jedem Spielercharakter
- **Passive Charge:** +10 pro Kampfrunde (automatisch)
- **Bonus Charge:** Manuell durch DM via Macro (+15/+20 für In-Character-Aktionen)
- **Decay:** -25 nach jedem Kampfende
- **Kein Rest-Reset:** Short/Long Rest ändern nichts an der Energy

### Primordial Attacks
Verfügbar bei 100 Energy. Konsumiert die gesamte Ressource.

| Attack | Charakter | Damage Type | Effekt |
|--------|-----------|-------------|--------|
| Primordial Chaos | Remiel | Psychic | AOE + Temp HP für Verbündete |
| Primordial Rage | Pyraxis | Fire | AOE (trifft auch Verbündete!) + Self Temp HP |
| Primordial Eclipse | Theia | Radiant + Psychic | AOE Damage + Heal Verbündete |
| Primordial Zeal | Elantir | Radiant | AOE Damage + AC Buff + Temp HP |
| Primordial Vengeance | Vaelorin | Psychic + Necrotic | Single Target Burst + Invisibility |

## Abhängigkeiten

- Foundry VTT v13+
- dnd5e System
- midi-qol (für RollComplete Hooks)

## DM Macros

```javascript
// Bonus Energy hinzufügen (auf ausgewähltem Token)
game.modules.get("DSR-EX").api.addBonusEnergy(token.actor, 20);

// Energy direkt setzen
game.modules.get("DSR-EX").api.setEnergyDirect(token.actor, 75);

// Aktuelle Energy abfragen
game.modules.get("DSR-EX").api.getEnergy(token.actor);

// Prüfen ob Primordial bereit ist
game.modules.get("DSR-EX").api.isReady(token.actor);
```

## Installation

1. Ordner in `Data/modules/DSR-EX` kopieren
2. In Foundry unter "Module verwalten" aktivieren
3. Settings konfigurieren (Module Settings > DSR-EX)

## Cinematic Cut-Ins

Die visuellen Cut-In Effekte (Bilder, Voicelines, Musik) werden über das separate Modul **Cinematic Cut-Ins** getriggert — nicht über DSR-EX. DSR-EX liefert nur die Mechanik (Energy + Attacks).


