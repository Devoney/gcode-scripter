type Coordinates = {
  X: number;
  Y?: number;
  Z?: number;
} | {
  X?: number;
  Y: number;
  Z?: number;
} | {
  X?: number;
  Y?: number;
  Z: number;
};

type FeedRate = 'standard' | 'rapid';

class GcodeWriter {
  private readonly gcodeLines: string[] = [];
  private lastFeedRate: FeedRate | null = null;
  private readonly lastCoordinates: Required<Coordinates> = {
      X: 0,
      Y: 0,
      Z: 0
  };

  constructor (private readonly feedRates: { [key in FeedRate]: number }, public readonly safeLocation: Required<Coordinates>) {
      this.setFeedRate('standard');
  }

  public move(coordinates: Coordinates, feedRate: FeedRate = 'standard', comment?: string) {
      this.setFeedRate(feedRate);
      
      let code: string;
      switch(feedRate) {
          case 'standard':
              code = 'G1';
              break;
          case 'rapid':
              code = 'G0';
              break;
          default:
              throw new Error(`MovementType '${feedRate}' not implemented.`);
      }

      let line = code;
      for (const key of Object.keys(coordinates) as (keyof Coordinates)[]) {
          const value = coordinates[key] as number;
          line = `${line} ${key}${value}`;
          this.lastCoordinates[key] = value;
      }

      this.add(line, comment);
  }

  public feed(coordinates: Coordinates, comment?: string): void {
      this.move(coordinates, "standard", comment);
  }

  public rapid(coordinates: Coordinates, comment?: string): void {
      this.move(coordinates, "rapid", comment);
  }

  public waitForUser(comment?: string): void {
      this.add("M0", comment);
  }

  public moveToSafety(): void {
      this.safeHeight();
      this.move( {
          X: this.safeLocation.X,
          Y: this.safeLocation.Y,
      }, "rapid", "Moving to safe location");
  }

  public safeHeight(): void {
      this.move( { Z: this.safeLocation.Z }, "rapid", "Safe height");
  }

  public generate(): string {
      let output = '';

      for(const line of this.gcodeLines) {
          output += `${line}\r\n`;
      }

      return output;
  }

  public getCurrentCoordinates(): Required<Coordinates> {
      return {
          ...this.lastCoordinates
      };
  }

  private setFeedRate(feedRate: FeedRate): void {
      if (this.lastFeedRate === feedRate) {
          return;
      }
      const rate = this.feedRates[feedRate];
      this.add(`F${rate} ; ${feedRate}`)
      this.lastFeedRate = feedRate;
  }

  private add(line: string, comment?: string): void {
      if (!!comment) {
          line = `${line} ; ${comment}`;
      }
      this.gcodeLines.push(line);
  }
}

class EndMill {
  public readonly radius: number;

  constructor(public readonly diameter: number) {
      this.radius = diameter / 2;
  }
}

const g = new GcodeWriter({
  standard: 35,
  rapid: 800
}, { X: 85, Y: 85, Z: 5 });

class Fixture {
  public readonly headRadius: number;

  constructor(public readonly headDiameter: number,
      public readonly headThickness: number,
      public readonly shaftDiameter: number) { 
          this.headRadius = this.headDiameter / 2;
      }
}

// EXMAPLE USAGE
const endmill = new EndMill(6);
const fixture = new Fixture(13.85, 2.75, 8.15);
const safeHeight = 5;
const desiredHeadWidth = 12.6;
const headTrimmingDepth = (fixture.headDiameter - desiredHeadWidth) / 2;
const shaftDepth = (fixture.headDiameter - fixture.shaftDiameter) / 2;
const centerHeadX = (fixture.headThickness / 2) + (endmill.radius);
const savePosition: Coordinates = { X: 85, Y: 85, Z: 5};

g.safeHeight();
g.rapid({ 
  X: centerHeadX, 
  Y: -(fixture.headRadius + 2 + endmill.radius),
}, "Prepare for trimming head width");
g.rapid({ Z: -headTrimmingDepth });
g.feed({ Y: fixture.headRadius + endmill.radius + 2 }, "Trimming head width one side");
g.rapid({ X: endmill.diameter + fixture.headThickness }, "Moving to alongside of the bottom of the head");
g.rapid({ Z: -shaftDepth }, "Plunging to shaft");
g.feed({ Y: -(fixture.headRadius + endmill.radius + 2) }, "Flattening bottom of head one side");
const shaftYTop = g.getCurrentCoordinates();
g.moveToSafety();
g.waitForUser("Rotate workpiece 180º now and press start to continue");
g.rapid( {
  ...shaftYTop,
  Y: shaftYTop.Y + 1
}, "Moving back into position to mill.");
g.feed({ Y: -(fixture.headRadius + endmill.radius + 2)}, "Trimming shaft other side.");
g.rapid({ Z: -headTrimmingDepth, X: centerHeadX });
g.feed({ Y: fixture.headRadius + endmill.radius + 2 }, "Milling other side of head.");
g.moveToSafety();

const gcode = g.generate();
console.log("GCODE", { gcode });

/* 
 * Should have outputted:
 *
F35 ; standard
F800 ; rapid
G0 Z5 ; Safe height
G0 X4.375 Y-11.925 ; Prepare for trimming head width
G0 Z-0.625
F35 ; standard
G1 Y11.925 ; Trimming head width one side
F800 ; rapid
G0 X8.75 ; Moving to alongside of the bottom of the head
G0 Z-2.8499999999999996 ; Plunging to shaft
F35 ; standard
G1 Y-11.925 ; Flattening bottom of head one side
F800 ; rapid
G0 Z5 ; Safe height
G0 X85 Y85 ; Moving to safe location
M0 ; Rotate workpiece 180º now and press start to continue
G0 X8.75 Y-10.925 Z-2.8499999999999996 ; Moving back into position to mill.
F35 ; standard
G1 Y-11.925 ; Trimming shaft other side.
F800 ; rapid
G0 Z-0.625 X4.375
F35 ; standard
G1 Y11.925 ; Milling other side of head.
F800 ; rapid
G0 Z5 ; Safe height
G0 X85 Y85 ; Moving to safe location
 */
