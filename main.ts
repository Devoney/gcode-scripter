import { GcodeWriter } from "./gcode-writer";
import { Stok } from "./shapes/stok";
import { Coordinates } from "./types/coordinates";
import { EndMill } from "./types/end-mill";
import * as fs from "fs";
import * as path from "path";

const frees = new EndMill(6);
const stok = new Stok(26, 85);

let zStapGrote: number = 0.5;
const aantalAStappen = Math.ceil(stok.omtrek / frees.radius);
const aStapGrote: number = 360 / aantalAStappen;

const eindDiepte: number = -0.5;
zStapGrote = Math.min(zStapGrote, Math.abs(eindDiepte));

const savePosition: Coordinates = { X: 0, Y: 0, Z: 10 };
const g = new GcodeWriter(
  {
    standard: 500,
    rapid: 800,
  },
  savePosition
);

function freesEenKeerRondEnHeenEnWeer(): void {
  for (let hoek = 0; hoek <= 365; hoek = hoek + (aStapGrote * 2)) {
    g.feed({ Y: stok.lengte });
    g.rotate(hoek);
    if (hoek >= 360) {
      break;
    }
    g.feed({ Y: 0 });
    g.rotate(hoek + aStapGrote);
  }
}

g.moveToSafety();

for (let diepte = 0; diepte > eindDiepte; diepte = diepte - zStapGrote) {
  g.feed({ Z: diepte - zStapGrote });
  freesEenKeerRondEnHeenEnWeer();
}

g.moveToSafety();

const gcode = g.generate();
const filePath = path.join(
  "./output",
  `stok-${stok.dikte}-${stok.lengte}.nc`
);

// Write content to the file
fs.writeFileSync(filePath, gcode, "utf8");
console.log('File written to ' + filePath);
