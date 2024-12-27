import { GcodeWriter } from "./gcode-writer";
import { Stok } from "./shapes/stok";
import { Coordinates } from "./types/coordinates";
import { EndMill } from "./types/end-mill";
import * as fs from "fs";
import * as path from "path";

// Defines constants for using in the program
const frees = new EndMill(6);
const stockLengte = 1;
const stok = new Stok(14.4 * 2, stockLengte);

let zStapGrote: number = 2;
const aantalAStappen = Math.ceil(stok.omtrek / frees.radius);
const aStapGrote: number = 360 / aantalAStappen;

const eindDiepte: number = -5;
zStapGrote = Math.min(zStapGrote, Math.abs(eindDiepte));

const savePosition: Coordinates = { X: 0, Y: 0, Z: 10 };
const g = new GcodeWriter(
  {
    standard: 500,
    rapid: 800,
  },
  savePosition
);

function freesEenKeerRondEnHeenEnWeer(beginPosition: number): number {
  for (let hoek = 0; hoek <= 365; hoek = hoek + (aStapGrote * 2)) {
    g.feed({ Y: stok.lengte });
    g.rotate(beginPosition + hoek);
    if (hoek >= 360) {
      break;
    }
    g.feed({ Y: 0 });
    g.rotate(beginPosition + hoek + aStapGrote);
  }

  return beginPosition + 360;
}

// Program starts here
g.moveToSafety();

let lastAngle = 0;
for (let diepte = 0; diepte > eindDiepte; diepte = diepte - zStapGrote) {
  let nextZ = Math.min(Math.abs(diepte - zStapGrote), Math.abs(eindDiepte)) * -1;
  g.feed({ Z: nextZ });
  lastAngle = freesEenKeerRondEnHeenEnWeer(lastAngle);
}

g.moveToSafety();

const gcode = g.generate();

// Write content to the file
const filePath = path.join(
  "./output",
  `stok_thickness-${stok.dikte}_length-${stok.lengte}_depth-${eindDiepte}_step-${zStapGrote}.nc`
);
fs.writeFileSync(filePath, gcode, "utf8");
console.log('File written to ' + filePath);
